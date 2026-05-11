-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPERADMIN');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('LABEL_CREATED', 'IN_TRANSIT', 'DELIVERED');

-- CreateTable
CREATE TABLE "admin_profiles" (
    "id" TEXT NOT NULL,
    "clerk_user_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'SUPERADMIN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipments" (
    "tracking_id" TEXT NOT NULL,
    "external_seller_order_id" TEXT NOT NULL,
    "courier" TEXT NOT NULL,
    "origin_address" TEXT NOT NULL,
    "destination_address" TEXT NOT NULL,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'LABEL_CREATED',
    "label_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("tracking_id")
);

-- CreateTable
CREATE TABLE "shipment_events" (
    "id" TEXT NOT NULL,
    "tracking_id" TEXT NOT NULL,
    "status_update" "ShipmentStatus" NOT NULL,
    "location" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipment_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_profiles_clerk_user_id_key" ON "admin_profiles"("clerk_user_id");

-- CreateIndex
CREATE INDEX "shipments_status_idx" ON "shipments"("status");

-- CreateIndex
CREATE INDEX "shipments_external_seller_order_id_idx" ON "shipments"("external_seller_order_id");

-- CreateIndex
CREATE INDEX "shipment_events_tracking_id_idx" ON "shipment_events"("tracking_id");

-- AddForeignKey
ALTER TABLE "shipment_events" ADD CONSTRAINT "shipment_events_tracking_id_fkey" FOREIGN KEY ("tracking_id") REFERENCES "shipments"("tracking_id") ON DELETE CASCADE ON UPDATE CASCADE;
