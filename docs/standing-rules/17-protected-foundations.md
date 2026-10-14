# Rule 17 — Protected foundations

- `lib/checkUser.ts` (provisions the `users` row during page render; returns `null`, never redirects) and `actions/lib/checkUser.ts` (the gate that throws inside server actions) — do not bypass either, and do not quietly make the first behave like the second: that consolidation is Plan B §2c.
- `lib/prisma.ts` — singleton, do not instantiate Prisma elsewhere.
- `prisma/schema.prisma` — schema is single source of truth for data shape.
- `tsconfig.json` — the compiler settings and `include` are the type gate; do not narrow `include`, re-add `typescript.ignoreBuildErrors`, or flip `noImplicitAny` / `useUnknownInCatchVariables` without Plan B's budget.
- Clerk integration in `app/(auth)/` — do not move or modify without understanding auth flow end-to-end.
