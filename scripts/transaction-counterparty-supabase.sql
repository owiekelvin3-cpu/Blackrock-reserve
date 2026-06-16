-- Link member transfers to the other party (sender/recipient) for badge display
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "counterpartyUserId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Transaction_counterpartyUserId_fkey'
  ) THEN
    ALTER TABLE "Transaction"
      ADD CONSTRAINT "Transaction_counterpartyUserId_fkey"
      FOREIGN KEY ("counterpartyUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Transaction_counterpartyUserId_idx" ON "Transaction"("counterpartyUserId");
