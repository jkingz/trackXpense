# Rule 15 — Cross-cutting authority, one authority per rule, enforced once

- **Auth gate:** `proxy.ts` is the only thing that turns an anonymous request away. `lib/checkUser.ts` reads `currentUser()`, resolves it to a `users` row and creates that row on first sight; it returns `null` when there is no session and swallows a failed read or write to `null` too, so it is provisioning, not a gate — both of its callers discard the value. `actions/lib/checkUser.ts` reads `auth()` and **throws** `Unauthorized`, and is the only gate that runs inside a server action. Both are used; neither is the other's wrapper. Plan B §2c consolidates them.
- **Database access:** `lib/prisma.ts` — singleton client (pg driver adapter). All data reads/writes go through Prisma.
- **Errors:** Thrown errors in Server Components/Actions surface as generic toast via Sonner. No internal messages to client.
- **Validation:** `lib/schema.ts` — Zod schemas for form input. They run **client-side only**, through `zodResolver` in the two forms; no server action parses its input (`parseInput` is Plan B).
