-- AlterTable
ALTER TABLE "shipments" ADD COLUMN     "external_buyer_id" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "external_seller_id" TEXT NOT NULL DEFAULT '';
