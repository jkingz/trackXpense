-- Drop the unused Transaction.status column and its enum.
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "status";
DROP TYPE IF EXISTS "TransactionStatus";
