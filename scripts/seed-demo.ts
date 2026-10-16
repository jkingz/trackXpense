/**
 * Demo seed: gives every identity in the database a fresh, plausible seven-month
 * ledger — paycheque day, rent day, the weekly shop, the gym direct debit, a
 * savings account that earns a little, a household pot that splits bills, and
 * enough one-offs that the charts have a story instead of a hum.
 *
 *   pnpm db:seed
 *
 * What it touches: every row in transactions, accounts and budgets, then writes
 * a new ledger for each row in `users`. User rows are never deleted, and the
 * local demo identity is created first if it is missing.
 *
 * Why every identity and not just the demo one: a real Clerk session wins over the
 * no-login fallback (actions/lib/checkUser.ts:34), so seeding only `local-demo`
 * would leave a presenter who happens to be signed in staring at an empty ledger.
 *
 * Deterministic: one fixed base seed plus a per-user stream, so the same users
 * reproduce the same numbers on every run, and two users never get identical
 * ledgers. Re-runnable inside one transaction — a half-finished seed never lands.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";

import { DEMO_USER_PROFILE } from "../lib/demo-identity.ts";

// node does not read .env.local the way Next does, so load the names this needs.
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (match && !process.env[match[1]]) {
    process.env[match[1]] = match[2].replace(/^"|"$/g, "");
  }
}

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

/** Deterministic PRNG: same seed, same ledger, so re-seeding is not a surprise. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable 32-bit hash, used to fork one PRNG stream per identity. */
function hash32(input: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

const SEED_BASE = 0x9be41;

type AccountKey = "current" | "household" | "savings" | "travel";

const ACCOUNTS: {
  key: AccountKey;
  name: string;
  type: "CURRENT" | "SAVINGS";
  isDefault: boolean;
  opening: number;
}[] = [
  { key: "current", name: "Everyday current", type: "CURRENT", isDefault: true, opening: 1450 },
  { key: "household", name: "Shared household", type: "CURRENT", isDefault: false, opening: 2400 },
  { key: "savings", name: "Rainy-day savings", type: "SAVINGS", isDefault: false, opening: 6800 },
  { key: "travel", name: "Trip fund", type: "SAVINGS", isDefault: false, opening: 1250 },
];

/**
 * Monthly spend ceiling for the budget rail. Measured against this data set, months
 * run 2,424 to 2,573 and the one carrying insurance plus a flight hits 3,151, so at
 * 2,900 the rail sits around 85–90% most months and tips over exactly once — the
 * state worth showing in a demo.
 */
const BUDGET = 2900;

/** Month index 0 is the oldest seeded month, MONTHS - 1 is this one. */
const MONTHS = 7;

type Template = {
  day: number;
  type: "INCOME" | "EXPENSE";
  /** A category id from data/categories.ts — anything else renders without a colour. */
  category: string;
  /** A fixed amount, or an inclusive range drawn from the per-user stream. */
  amount: number | [number, number];
  /** A single description, or a list to pick one from. */
  description: string | readonly string[];
  account: AccountKey;
  /** Written as a direct debit so the recurring filter and the cron have real rows. */
  recurring?: "WEEKLY" | "MONTHLY" | "YEARLY";
  /** Card purchases sitting between authorised and settled. */
  status?: "PENDING";
};

const SHOPS = [
  "Weekly shop — Freshmart",
  "Market run — Hill Street",
  "Top-up — Corner grocer",
  "Big shop — Freshmart bulk aisle",
  "Deliverables — Pane & Fig",
] as const;

const MEALS = [
  "Lunch — Noodle Room",
  "Dinner — Casa Verde",
  "Coffee and a pastry — Bramble",
  "Takeaway — Seoul Bowl",
  "Brunch with Ana — Kitchen Yard",
  "Ramen after the cinema — Tanuki",
] as const;

const TREATS = [
  "Cinema — two tickets",
  "Concert — Harbour Hall",
  "Board games night",
  "Swim session — Ironworks pool",
] as const;

const HOMEGOODS = [
  "Running shoes — Strider",
  "Desk lamp — Nordhaus",
  "Winter jacket — Mill Lane",
  "Kitchen things — Homestead",
  "Plants — Glasshouse Row",
] as const;

/** Everything that repeats in all seven months. */
const RECURRING: Template[] = [
  {
    day: 1,
    type: "INCOME",
    category: "salary",
    amount: 3120,
    description: "Salary — Northwind Studio",
    account: "current",
    recurring: "MONTHLY",
  },
  {
    day: 1,
    type: "EXPENSE",
    category: "housing",
    amount: 1340,
    description: "Rent — Flat 4B, Ashgrove Road",
    account: "current",
    recurring: "MONTHLY",
  },
  {
    day: 2,
    type: "EXPENSE",
    category: "utilities",
    amount: [42, 68],
    description: "Water and gas — Meridian Utilities",
    account: "household",
  },
  {
    day: 3,
    type: "EXPENSE",
    category: "personal",
    amount: 34,
    description: "Gym membership — Ironworks",
    account: "current",
    recurring: "MONTHLY",
  },
  {
    day: 4,
    type: "EXPENSE",
    category: "groceries",
    amount: [38, 92],
    description: SHOPS,
    account: "current",
    recurring: "WEEKLY",
  },
  {
    day: 5,
    type: "INCOME",
    category: "investments",
    amount: [13, 24],
    description: "Fixed-deposit interest — Meridian Bank",
    account: "savings",
  },
  // The schema has one money type per row and no TRANSFER, so a pot is funded as
  // an incoming standing order instead of being debited out of Everyday current.
  {
    day: 2,
    type: "INCOME",
    category: "investments",
    amount: 250,
    description: "Savings standing order — Meridian Bank",
    account: "savings",
  },
  {
    day: 6,
    type: "INCOME",
    category: "other-income",
    amount: 140,
    description: "Trip fund standing order — Meridian Bank",
    account: "travel",
  },
  {
    day: 6,
    type: "EXPENSE",
    category: "transportation",
    amount: 44,
    description: "Metro card top-up",
    account: "current",
  },
  {
    day: 7,
    type: "EXPENSE",
    category: "bills",
    amount: 27.5,
    description: "Phone bill — Loop Mobile",
    account: "household",
  },
  {
    day: 8,
    type: "EXPENSE",
    category: "entertainment",
    amount: 16.99,
    description: "Streaming — Reelbox",
    account: "current",
    recurring: "MONTHLY",
  },
  {
    day: 9,
    type: "EXPENSE",
    category: "utilities",
    amount: [96, 142],
    description: "Electricity — GridCo",
    account: "current",
  },
  {
    day: 11,
    type: "EXPENSE",
    category: "food",
    amount: [9, 36],
    description: MEALS,
    account: "current",
  },
  {
    day: 12,
    type: "EXPENSE",
    category: "bills",
    amount: 4.5,
    description: "Account service fee",
    account: "current",
  },
  {
    day: 13,
    type: "EXPENSE",
    category: "utilities",
    amount: 62,
    description: "Broadband — Fiberline",
    account: "current",
    recurring: "MONTHLY",
  },
  {
    day: 14,
    type: "EXPENSE",
    category: "groceries",
    amount: [34, 78],
    description: SHOPS,
    account: "current",
    recurring: "WEEKLY",
  },
  {
    day: 16,
    type: "EXPENSE",
    category: "entertainment",
    amount: [18, 48],
    description: TREATS,
    account: "current",
  },
  {
    day: 18,
    type: "EXPENSE",
    category: "food",
    amount: [12, 54],
    description: MEALS,
    account: "current",
  },
  {
    day: 19,
    type: "EXPENSE",
    category: "groceries",
    amount: [40, 88],
    description: SHOPS,
    account: "current",
    recurring: "WEEKLY",
  },
  {
    day: 20,
    type: "EXPENSE",
    category: "transportation",
    amount: [50, 82],
    description: "Fuel — Oakhaven petrol",
    account: "current",
  },
  {
    day: 21,
    type: "EXPENSE",
    category: "shopping",
    amount: [22, 64],
    description: "Cleaning supplies — Homestead",
    account: "household",
  },
  {
    day: 22,
    type: "EXPENSE",
    category: "shopping",
    amount: [24, 72],
    description: HOMEGOODS,
    account: "current",
  },
  {
    day: 25,
    type: "EXPENSE",
    category: "groceries",
    amount: [36, 80],
    description: SHOPS,
    account: "current",
    recurring: "WEEKLY",
  },
  {
    day: 26,
    type: "EXPENSE",
    category: "personal",
    amount: [26, 46],
    description: "Haircut — Marsh Street",
    account: "current",
  },
  {
    day: 27,
    type: "EXPENSE",
    category: "food",
    amount: [14, 52],
    description: MEALS,
    account: "current",
  },
  {
    day: 28,
    type: "EXPENSE",
    category: "bills",
    amount: 120,
    description: "Household pot — split with Ana",
    account: "household",
    recurring: "MONTHLY",
  },
  {
    day: 30,
    type: "EXPENSE",
    category: "other-expense",
    amount: [8, 26],
    description: "Parcels and returns — Postbox",
    account: "current",
  },
];

/** One-offs, keyed by month index. Index MONTHS - 1 is the current month. */
const EVENTS: Record<number, Template[]> = {
  0: [
    {
      day: 17,
      type: "INCOME",
      category: "other-income",
      amount: 260,
      description: "Sold the road bike — Marsh Market",
      account: "current",
    },
    {
      day: 19,
      type: "EXPENSE",
      category: "healthcare",
      amount: 28.4,
      description: "Pharmacy — Wellmore",
      account: "current",
    },
  ],
  1: [
    {
      day: 8,
      type: "EXPENSE",
      category: "education",
      amount: 145,
      description: "Course — Advanced TypeScript",
      account: "current",
    },
    {
      day: 23,
      type: "EXPENSE",
      category: "gifts",
      amount: 45,
      description: "Birthday gift — Priya",
      account: "current",
    },
  ],
  2: [
    {
      day: 9,
      type: "EXPENSE",
      category: "travel",
      amount: 118,
      description: "Train to Bristol — weekend away",
      account: "current",
    },
    {
      day: 24,
      type: "EXPENSE",
      category: "travel",
      amount: 34,
      description: "Harbour museum and bike hire",
      account: "travel",
    },
    {
      day: 26,
      type: "INCOME",
      category: "business",
      amount: 340,
      description: "Template shop sales — Q1 tail",
      account: "current",
    },
  ],
  3: [
    {
      day: 6,
      type: "INCOME",
      category: "freelance",
      amount: 620,
      description: "Freelance project — logo set",
      account: "current",
    },
    {
      day: 15,
      type: "EXPENSE",
      category: "healthcare",
      amount: 78,
      description: "Dentist check-up — Bright Smile",
      account: "current",
    },
    {
      day: 17,
      type: "EXPENSE",
      category: "shopping",
      amount: 96,
      description: "Shelving and a repair — Homestead",
      account: "household",
    },
  ],
  4: [
    {
      day: 2,
      type: "INCOME",
      category: "rental",
      amount: 400,
      description: "Room sublet — two weeks",
      account: "current",
    },
    {
      day: 5,
      type: "EXPENSE",
      category: "insurance",
      amount: 344,
      description: "Car insurance — Halfcover",
      account: "savings",
      recurring: "YEARLY",
    },
    {
      day: 12,
      type: "EXPENSE",
      category: "travel",
      amount: 268,
      description: "Flight — Malaga return",
      account: "current",
    },
    {
      day: 13,
      type: "EXPENSE",
      category: "travel",
      amount: 214,
      description: "Hotel — two nights, Malaga",
      account: "travel",
    },
  ],
  5: [
    {
      day: 2,
      type: "INCOME",
      category: "salary",
      amount: 900,
      description: "Quarterly bonus — Northwind Studio",
      account: "current",
    },
    {
      day: 10,
      type: "INCOME",
      category: "freelance",
      amount: 480,
      description: "Freelance project — booking site",
      account: "current",
    },
    {
      day: 11,
      type: "EXPENSE",
      category: "shopping",
      amount: 132,
      description: "New desk chair — Foldwell",
      account: "current",
    },
    {
      day: 27,
      type: "EXPENSE",
      category: "gifts",
      amount: 30,
      description: "Host gift — Ana",
      account: "current",
    },
  ],
  // The current month, so the dashboard opens on recent activity. Days past
  // today are dropped by buildRows.
  [MONTHS - 1]: [
    {
      day: 7,
      type: "EXPENSE",
      category: "bills",
      amount: 24.5,
      description: "Book delivery — Hardback & Co",
      account: "current",
      status: "PENDING",
    },
    {
      day: 9,
      type: "EXPENSE",
      category: "travel",
      amount: 62,
      description: "Train tickets — weekend in Bath",
      account: "travel",
    },
    {
      day: 11,
      type: "EXPENSE",
      category: "groceries",
      amount: 52.3,
      description: "Weekly shop — Freshmart",
      account: "current",
      status: "PENDING",
    },
    {
      day: 13,
      type: "EXPENSE",
      category: "healthcare",
      amount: 64,
      description: "Optician — Clearview",
      account: "current",
    },
    {
      day: 15,
      type: "INCOME",
      category: "business",
      amount: 250,
      description: "Template shop sales — this month",
      account: "current",
    },
  ],
};

/** A row once its date and amount are resolved. */
type SeedRow = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  date: Date;
  category: string;
  status: "COMPLETED" | "PENDING";
  isRecurring: boolean;
  recurringInterval: "WEEKLY" | "MONTHLY" | "YEARLY" | null;
  lastProcessed: Date | null;
  nextRecurringDate: Date | null;
  accountKey: AccountKey;
};

function monthStart(index: number, today: Date) {
  return new Date(today.getFullYear(), today.getMonth() - (MONTHS - 1 - index), 1);
}

function nextOccurrence(date: Date, interval: "WEEKLY" | "MONTHLY" | "YEARLY") {
  const next = new Date(date);
  if (interval === "WEEKLY") next.setDate(next.getDate() + 7);
  else if (interval === "MONTHLY") next.setMonth(next.getMonth() + 1);
  else next.setFullYear(next.getFullYear() + 1);
  return next;
}

/**
 * One ledger per identity. `rand` is the user's own stream, so two users in the
 * same database never show the same amounts.
 */
function buildRows(rand: () => number, today: Date, tag: string): SeedRow[] {
  const money = (min: number, max: number) => Math.round((min + rand() * (max - min)) * 100) / 100;
  const oneOf = <T>(list: readonly T[]): T => list[Math.floor(rand() * list.length)];

  const rows: SeedRow[] = [];

  for (let index = 0; index < MONTHS; index++) {
    const start = monthStart(index, today);
    const lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();

    for (const template of [...RECURRING, ...(EVENTS[index] ?? [])]) {
      const day = Math.min(template.day, lastDay);
      const date = new Date(start.getFullYear(), start.getMonth(), day, 12, 0, 0);

      // Never write an entry dated after today: the month totals would claim
      // spending that has not happened yet.
      if (date > today) continue;

      const next = template.recurring ? nextOccurrence(date, template.recurring) : null;

      rows.push({
        id: `${tag}-${index}-${day}-${rows.length}`,
        type: template.type,
        amount:
          typeof template.amount === "number"
            ? template.amount
            : money(template.amount[0], template.amount[1]),
        description:
          typeof template.description === "string"
            ? template.description
            : oneOf(template.description),
        date,
        category: template.category,
        status: template.status ?? "COMPLETED",
        isRecurring: Boolean(template.recurring),
        recurringInterval: template.recurring ?? null,
        // A seeded direct debit is already paid for the month it appears in, so
        // lastProcessed always carries that date. nextRecurringDate stays null unless
        // the next occurrence is genuinely in the future: the recurring cron selects
        // isRecurring + COMPLETED + nextRecurringDate <= now (lib/inngest/functions.ts:171-185),
        // and leaving a past date on sixty historical rows would arm it to duplicate
        // the whole ledger the moment Inngest is switched on.
        lastProcessed: template.recurring ? date : null,
        nextRecurringDate: next && next > today ? next : null,
        accountKey: template.account,
      });
    }
  }

  return rows;
}

const round = (n: number) => Math.round(n * 100) / 100;

type AccountSummary = { name: string; balance: number; entries: number };

type UserSummary = {
  identity: string;
  entries: number;
  thisMonthIn: number;
  thisMonthOut: number;
  recurring: number;
  pending: number;
  oldest: string;
  newest: string;
  accounts: AccountSummary[];
};

try {
  const today = new Date();

  // upsert, not create: the app provisions this row on a first visit, so it may
  // already exist by the time the seed runs.
  await db.user.upsert({
    where: { clerkUserId: DEMO_USER_PROFILE.clerkUserId },
    update: {},
    create: DEMO_USER_PROFILE,
  });

  // Every identity in the table gets a ledger. User rows are never touched.
  const targets = await db.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, clerkUserId: true },
  });

  const perUser: UserSummary[] = [];

  // One transaction for the whole seed: the clears and every identity's rows commit
  // together, so a failure halfway through leaves the previous ledger intact rather
  // than an empty database.
  await db.$transaction(
    async (tx) => {
      // Transactions first, then budgets, then accounts.
      await tx.transaction.deleteMany({});
      await tx.budget.deleteMany({});
      await tx.account.deleteMany({});

      for (const target of targets) {
        const hash = hash32(target.id) >>> 0;
        const tag = `s${hash}`;
        const rows = buildRows(mulberry32((SEED_BASE ^ hash) >>> 0), today, tag);

        const created = await Promise.all(
          ACCOUNTS.map((account) =>
            tx.account.create({
              data: {
                name: account.name,
                type: account.type,
                isDefault: account.isDefault,
                // Opening balance. The entries below move it from here.
                balance: account.opening,
                userId: target.id,
              },
              select: { id: true },
            }),
          ),
        );

        const accountIdByKey = new Map<AccountKey, string>(
          ACCOUNTS.map((account, i) => [account.key, created[i].id]),
        );

        await tx.transaction.createMany({
          data: rows.map((row) => ({
            id: row.id,
            type: row.type,
            amount: row.amount,
            description: row.description,
            date: row.date,
            category: row.category,
            status: row.status,
            isRecurring: row.isRecurring,
            recurringInterval: row.recurringInterval,
            lastProcessed: row.lastProcessed,
            nextRecurringDate: row.nextRecurringDate,
            userId: target.id,
            accountId: accountIdByKey.get(row.accountKey)!,
            createdAt: row.date,
            updatedAt: row.date,
          })),
        });

        // Balances have to agree with the ledger. The app moves an account's balance
        // by the amount of every entry it takes, so an account seeded with a balance
        // that is not its opening plus its entries would drift the moment someone
        // adds a transaction.
        const accounts: AccountSummary[] = [];
        for (const account of ACCOUNTS) {
          const mine = rows.filter((row) => row.accountKey === account.key);
          const movement = mine.reduce(
            (total, row) => total + (row.type === "INCOME" ? row.amount : -row.amount),
            0,
          );
          const balance = round(account.opening + movement);
          await tx.account.update({
            where: { id: accountIdByKey.get(account.key)! },
            data: { balance },
          });
          accounts.push({ name: account.name, balance, entries: mine.length });
        }

        await tx.budget.create({ data: { userId: target.id, amount: BUDGET } });

        const monthStartOfNow = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthRows = rows.filter((row) => row.date >= monthStartOfNow);
        perUser.push({
          identity: target.clerkUserId,
          entries: rows.length,
          thisMonthIn: round(
            monthRows.reduce((t, r) => t + (r.type === "INCOME" ? r.amount : 0), 0),
          ),
          thisMonthOut: round(
            monthRows.reduce((t, r) => t + (r.type === "EXPENSE" ? r.amount : 0), 0),
          ),
          recurring: rows.filter((row) => row.isRecurring).length,
          pending: rows.filter((row) => row.status === "PENDING").length,
          oldest: rows[0]?.date.toDateString() ?? "-",
          newest: rows[rows.length - 1]?.date.toDateString() ?? "-",
          accounts,
        });
      }
    },
    // Prisma's default interactive timeout is 5s; this transaction makes about
    // thirteen round-trips per identity against a hosted database.
    { timeout: 120_000, maxWait: 10_000 },
  );

  console.log(`seeded ${targets.length} ${targets.length === 1 ? "identity" : "identities"}`);
  for (const u of perUser) {
    console.log(
      `\n${u.identity}: ${u.entries} entries, ${u.recurring} recurring, ${u.pending} pending`,
    );
    console.log(
      `  this month in ${u.thisMonthIn} / out ${u.thisMonthOut} against a ${BUDGET} ceiling`,
    );
    console.log(`  ${u.oldest} → ${u.newest}`);
    console.table(u.accounts);
  }

  // Counted from the database after the commit, not from the in-memory rows, so
  // what is printed is proof of what landed.
  console.log(
    "in database now:",
    await db.transaction.count(),
    "transactions,",
    await db.account.count(),
    "accounts,",
    await db.budget.count(),
    "budgets,",
    await db.user.count(),
    "users",
  );
} catch (error) {
  console.error("seed failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
