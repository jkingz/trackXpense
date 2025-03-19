'use server';
import { revalidatePath } from 'next/cache';

import { db } from '@/lib/prisma';

import aj from '@/lib/arcjet';
import { request } from '@arcjet/next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { calculateNextRecurringDate, checkUser, serializeAmount } from './lib';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Scan Receipt
export async function scanReceipt(file) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    // Convert ArrayBuffer to Base64
    const base64String = Buffer.from(arrayBuffer).toString('base64');

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
    const cleanedText = text.replace(/```(?:json)?\n?/g, '').trim();

    try {
      const data = JSON.parse(cleanedText);
      return {
        amount: parseFloat(data.amount),
        date: new Date(data.date),
        description: data.description,
        category: data.category,
        merchantName: data.merchantName,
      };
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      throw new Error('Invalid response format from Gemini');
    }
  } catch (error) {
    console.error('Error scanning receipt:', error);
    throw new Error('Failed to scan receipt');
  }
}

export async function createTransaction(data) {
  try {
    // check if use if logged in
    const user = await checkUser();

    // Get request data for ArcJet
    const req = await request();

    // Check rate limit
    const decision = await aj.protect(req, {
      userId: user.id, // Specify the user ID
      requested: 1, // Specify how many tokens to consume
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        const { remaining, reset } = decision.reason;
        console.error({
          code: 'RATE_LIMIT_EXCEEDED',
          details: {
            remaining,
            resetInSeconds: reset,
          },
        });

        throw new Error('Too many requests. Please try again later.');
      }

      throw new Error('Request blocked');
    }
    // check account if exists
    const account = await db.account.findUnique({
      where: {
        id: data.accountId,
        userId: user.id,
      },
    });
    if (!account) {
      throw new Error('Account not found');
    }

    // calculate balance
    const balanceChange = data.type === 'EXPENSE' ? -data.amount : data.amount;
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
    revalidatePath('/dashboard');
    revalidatePath('/account/${transaction.accountId}');
    return { success: true, data: serializeAmount(transaction) };
  } catch (error) {
    throw new Error(error);
  }
}
