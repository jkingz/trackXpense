# Receipt Storage

## Status

Shipped: `POST /api/receipts` (session-gated via `checkUser`; `image/*` capped at `MAX_RECEIPT_BYTES`) → `lib/storage.ts` (R2 when configured, else `public/uploads`); `scan-receipt.tsx` uploads and `add-transaction-form.tsx` writes `receiptUrl`.

## Goal

Uploaded receipts are stored and `transaction.receiptUrl` is written.

## UI: n/a

## Increments

1. Add upload endpoint `POST /api/receipts` returning a URL (local filesystem or signed URL). Touches: `app/api/receipts/route.ts`.
2. Wire `scanReceipt`/form to upload and set `receiptUrl`. Touches: `actions/transaction.ts`, `add-transaction-form.tsx`.
3. Storage backend decision (local vs S3/R2) + env vars.

### First increment scope

- **Files**: `app/api/receipts/route.ts`
- **Test**: `tests/api/unit/receipts-route.test.ts`
- **Done when**: POST returns a URL string

## Deferred / open questions

- Storage provider (local disk vs S3/R2) — owner decision.

## Security / permissions

Owner-scoped; authority `actions/lib/checkUser.ts`.

## Verification

- `pnpm typecheck`, `pnpm build`
- Manual upload returns URL
