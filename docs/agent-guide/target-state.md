# TARGET STATE — Not Yet Built

Intent not implemented, or implemented and never run. Requirements for future work.

- **Multi-user sharing.** No shared budgets / collaboration.
- **Mobile app.** Web-only MVP.
- **Recurring processing against a DB.** Verified locally via Inngest dev server. Remaining: cloud keys + prod host.
- **Email delivery.** Sending depends on Inngest functions firing and a valid `RESEND_API_KEY`.
- **Receipt storage.** Local disk MVP (`public/uploads`). S3/R2 deferred until scale requires it.
- **Tests beyond unit tier.** Scaffolds pass; expanding coverage to pages/actions/routes is a follow-up effort.
- **No integration tier.** Harness adapters driven only by throwaway harnesses; a wiring regression ships green.
- **Claude Code hooks.** Verified live against `scripts/pipeline-gate.ts` (pre-edit deny + status JSON) on 2026-10-23; documented shapes match.
- **TypeScript 7** via `@typescript/native-preview` (tsgo) for typecheck; ESLint dropped in favour of `vp check` (oxlint) via viteplus.
- **`transactions.status` has no transition logic.** Defaults `COMPLETED`, only read as a filter. State machine waits until a real transition exists.
- **Inngest host (decided):** Vercel serverless — serve `/api/inngest`, set keys in prod. Local dev uses `INNGEST_DEV=1`.
- **Counts hand-maintained.** No automated check that docs totals match code. Deferred; not blocking.
