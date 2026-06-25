-- Add column only if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shipments'
    AND column_name = 'external_tracking_id'
  ) THEN
    ALTER TABLE "shipments" ADD COLUMN "external_tracking_id" TEXT;
  END IF;
END $$;

-- Backfill rows that have no value yet
UPDATE "shipments"
SET "external_tracking_id" = 'LEGACY-' || "tracking_id"
WHERE "external_tracking_id" IS NULL;

-- Enforce NOT NULL if not already set
ALTER TABLE "shipments" ALTER COLUMN "external_tracking_id" SET NOT NULL;

-- Add unique constraint only if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'shipments_external_tracking_id_key'
  ) THEN
    ALTER TABLE "shipments" ADD CONSTRAINT "shipments_external_tracking_id_key" UNIQUE ("external_tracking_id");
  END IF;
END $$;