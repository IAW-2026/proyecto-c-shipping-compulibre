/*
  Warnings:

  - You are about to drop the column `external_buyer_id` on the `shipments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "shipments" DROP COLUMN "external_buyer_id",
ADD COLUMN     "external_buyer_order_id" TEXT NOT NULL DEFAULT '';
