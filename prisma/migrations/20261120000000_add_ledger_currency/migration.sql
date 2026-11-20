BEGIN;

CREATE TYPE "LedgerCurrency" AS ENUM ('PHP', 'USD');

-- Existing ledgers were presented in USD. New users start in PHP.
ALTER TABLE "users" ADD COLUMN "currency" "LedgerCurrency" NOT NULL DEFAULT 'USD';
ALTER TABLE "users" ALTER COLUMN "currency" SET DEFAULT 'PHP';

COMMIT;
