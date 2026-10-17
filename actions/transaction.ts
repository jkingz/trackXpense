"use server";

import { request } from "@arcjet/next";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";

import aj from "@/lib/arcjet";
import { db } from "@/lib/prisma";
import type { TransactionInput } from "@/lib/schema";

import { calculateNextRecurringDate, checkUser, serializeAmount } from "./lib";
import { toErrorMessage } from "./lib";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

// Model chosen from measured behaviour against this key, not from a doc page.
// Census on one receipt image, 3 attempts each: `gemini-2.5-flash` and
// `gemini-2.5-flash-lite` 404 ("no longer available to new users") — that is what
// broke the scan — while `gemini-3.8-flash` and `gemini-flash-latest` answered but
// intermittently threw 503 "high demand" and took 38-92s. `gemini-3.1-flash-lite`
// and `gemini-flash-lite-latest` went 10/10 in 2-5s with byte-identical
// extraction. The versioned name is pinned over the rolling alias so the model
// behind the feature cannot change under the app mid-demo.
const RECEIPT_MODEL = "gemini-3.1-flash-lite";

// Scan Receipt
export async function scanReceipt(file: File) {
  try {
    const model = genAI.getGenerativeModel({ model: RECEIPT_MODEL });

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    // Convert ArrayBuffer to Base64
    const base64String = Buffer.from(arrayBuffer).toString("base64");

    const prompt = `
      Analyze this receipt image and extract the following information in JSON format:
      - Total amount (just the number)
      - Date (in ISO format)
      - Description or items purchased (brief summary)
      - Merchant/store name
      - Suggested category (one of: housing,transportation,groceries,utilities,entertainment,food,shopping,healthcare,education,personal,travel,insurance,gifts,bills,other-expense )

      Only respond with valid JSON in this exact format:
      {
        "amount": number,
        "date": "ISO date string",
        "description": "string",
        "merchantName": "string",
        "category": "string"
      }

      If its not a recipt, return an empty object
    `;

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      },
      prompt,
    ]);

    const response = await result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

    let data: {
      amount?: unknown;
      date?: unknown;
      description?: unknown;
      category?: unknown;
      merchantName?: unknown;
    };
    try {
      data = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Error parsing JSON response:", parseError);
      throw new Error("Invalid response format from Gemini");
    }

    const amount = parseFloat(data.amount as string);
    const date = new Date(data.date as string);
    // The prompt tells the model to answer `{}` for a non-receipt, so an absent
    // amount or date is an expected outcome, not a crash: handing it on would put
    // "NaN" and "Invalid date" into the form fields.
    if (!Number.isFinite(amount) || Number.isNaN(date.getTime())) {
      throw new Error("No receipt could be read from that image. Try a clearer photo.");
    }
    return {
      amount,
      date,
      description: data.description as string,
      category: data.category as string,
      merchantName: data.merchantName as string,
    };
  } catch (error) {
    console.error("Error scanning receipt:", error);
    // Carry the cause: a flat "Failed to scan receipt" is what hid a retired model
    // name behind a retired-model 404.
    throw new Error(`Failed to scan receipt: ${toErrorMessage(error)}`);
  }
}

// Create Transaction
export async function createTransaction(data: TransactionInput) {
  try {
    // check if use if logged in
    const user = await checkUser();

    // Rate limiting. `request()` has no public IP to read locally, so Arcjet
    // falls back to 127.0.0.1 and warns on every write in development; outside
    // production the bucket would rate-limit every local developer as one
    // address anyway. Production keeps both calls.
    const decision =
      process.env.NODE_ENV === "production"
        ? await aj.protect(await request(), {
            userId: user.id, // Specify the user ID
            requested: 1, // Specify how many tokens to consume
          })
        : null;

    if (decision?.isDenied()) {
      if (decision.reason.isRateLimit()) {
        const { remaining, reset } = decision.reason;
        console.error({
          code: "RATE_LIMIT_EXCEEDED",
          details: {
            remaining,
            resetInSeconds: reset,
          },
        });

        throw new Error("Too many requests. Please try again later.");
      }

      throw new Error("Request blocked");
    }
    // check account if exists
    const account = await db.account.findUnique({
      where: {
        id: data.accountId,
        userId: user.id,
      },
    });
    if (!account) {
      throw new Error("Account not found");
    }

    // calculate balance
    const balanceChange = data.type === "EXPENSE" ? -data.amount : data.amount;
    // new balance
    const newBalance = account.balance.toNumber() + balanceChange;

    // create transaction
    const transaction = await db.$transaction(async (tx) => {
      const newTransaction = await tx.transaction.create({
        data: {
          ...data,
          userId: user.id,
          nextRecurringDate:
            data.isRecurring && data.recurringInterval
              ? calculateNextRecurringDate(data.date, data.recurringInterval)
              : null,
        },
      });

      // update account balance
      await tx.account.update({
        where: {
          id: data.accountId,
        },
        data: {
          balance: newBalance,
        },
      });
      return newTransaction;
    });
    revalidatePath("/dashboard");
    revalidatePath(`/account/${transaction.accountId}`);
    return { success: true, data: serializeAmount(transaction) };
  } catch (error) {
    throw new Error(toErrorMessage(error));
  }
}

// get transaction by id
export async function getTransactionById(id: string) {
  // check if use if logged in
  const user = await checkUser();

  // check if transaction exists
  const transaction = await db.transaction.findUnique({
    where: {
      id,
      userId: user.id,
    },
  });
  if (!transaction) {
    throw new Error("Transaction not found");
  }

  return serializeAmount(transaction);
}

// update transaction
export async function updateTransaction(data: TransactionInput, id: string) {
  try {
    const user = await checkUser();
    // Get original transaction and calculate balance change
    const originalTransaction = await db.transaction.findUnique({
      where: {
        id,
        userId: user.id,
      },
      include: {
        account: true,
      },
    });
    if (!originalTransaction) {
      throw new Error("Transaction not found");
    }

    const oldBalanceChange =
      originalTransaction.type === "EXPENSE"
        ? -originalTransaction.amount.toNumber()
        : originalTransaction.amount.toNumber();
    const newBalanceChange = data.type === "EXPENSE" ? -data.amount : data.amount;
    const netBalanceChange = newBalanceChange - oldBalanceChange;

    // Update transaction and account balance in a transaction
    const transaction = await db.$transaction(async (tx) => {
      const updated = await tx.transaction.update({
        where: {
          id,
          userId: user.id,
        },
        data: {
          ...data,
          nextRecurringDate:
            data.isRecurring && data.recurringInterval
              ? calculateNextRecurringDate(data.date, data.recurringInterval)
              : null,
        },
      });

      // Update account balance using the original balance
      const currentBalance = originalTransaction.account.balance.toNumber();
      const newBalance = currentBalance + netBalanceChange;
      // update account balance
      await tx.account.update({
        where: {
          id: data.accountId,
        },
        data: {
          balance: newBalance,
        },
      });
      return updated;
    });
    revalidatePath("/dashboard");
    revalidatePath(`/account/${data.accountId}`);
    return { success: true, data: serializeAmount(transaction) };
  } catch (error) {
    throw new Error(toErrorMessage(error));
  }
}
