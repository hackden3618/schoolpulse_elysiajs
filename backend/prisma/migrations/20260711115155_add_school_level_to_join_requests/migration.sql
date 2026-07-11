/*
  Warnings:

  - You are about to drop the column `admin_email` on the `join_requests` table. All the data in the column will be lost.
  - You are about to drop the column `admin_phone` on the `join_requests` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "school_level" ADD VALUE 'tertiary';

-- AlterTable
ALTER TABLE "join_requests" DROP COLUMN "admin_email",
DROP COLUMN "admin_phone",
ADD COLUMN     "school_level" "school_level";
