-- Add column as nullable first so existing rows aren't rejected
ALTER TABLE "shipments" ADD COLUMN "external_tracking_id" TEXT;

-- Backfill existing rows with a placeholder derived from their own tracking_id
UPDATE "shipments"
SET "external_tracking_id" = 'LEGACY-' || "tracking_id"
WHERE "external_tracking_id" IS NULL;

-- Now that every row has a value, enforce NOT NULL and add the unique constraint
ALTER TABLE "shipments" ALTER COLUMN "external_tracking_id" SET NOT NULL;
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_external_tracking_id_key" UNIQUE ("external_tracking_id");