import { NextResponse } from "next/server";

import { checkUser } from "@/actions/lib/checkUser";
import { db } from "@/lib/prisma";
import { transactionExportSchema } from "@/lib/schema";

const DAY = 24 * 60 * 60 * 1000;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = transactionExportSchema.safeParse({
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    format: searchParams.get("format") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }
  const { from, to, format, limit, cursor } = parsed.data;
  const toDate = to ? new Date(to) : new Date();
  const fromDate = from ? new Date(from) : new Date(toDate.getTime() - 30 * DAY);

  let user;
  try {
    user = await checkUser();
  } catch {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const transactions = await db.transaction.findMany({
    where: { userId: user.id, date: { gte: fromDate, lte: toDate } },
    orderBy: { date: "desc" },
    include: { account: { select: { name: true, type: true } } },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const hasMore = transactions.length > limit;
  const page = hasMore ? transactions.slice(0, limit) : transactions;
  const nextCursor = hasMore ? page[page.length - 1].id : null;

  if (format === "csv") {
    const header = "id,type,amount,description,category,date,accountId\n";
    const body = page
      .map((t) =>
        [
          t.id,
          t.type,
          t.amount,
          JSON.stringify(t.description ?? ""),
          t.category,
          t.date.toISOString(),
          t.accountId,
        ].join(","),
      )
      .join("\n");
    return new Response(header + body + (body ? "\n" : ""), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="transactions.csv"',
      },
    });
  }

  const res = NextResponse.json(page);
  if (nextCursor) res.headers.set("X-Next-Cursor", nextCursor);
  return res;
}
