/*
  Warnings:

  - The primary key for the `admin_profiles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `admin_profiles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "admin_profiles" DROP CONSTRAINT "admin_profiles_pkey",
DROP COLUMN "id";
