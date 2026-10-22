-- Drop the unused Transaction.status column and its enum.
ALTER TABLE "Transaction" DROP COLUMN IF EXISTS "status";
DROP TYPE IF EXISTS "TransactionStatus";
