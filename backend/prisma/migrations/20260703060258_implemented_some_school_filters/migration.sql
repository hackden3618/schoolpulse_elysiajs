/*
  Warnings:

  - Added the required column `county` to the `schools` table without a default value. This is not possible if the table is not empty.
  - Added the required column `school_code` to the `schools` table without a default value. This is not possible if the table is not empty.
  - Added the required column `town` to the `schools` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "schools" ADD COLUMN     "county" TEXT NOT NULL,
ADD COLUMN     "school_code" TEXT NOT NULL,
ADD COLUMN     "town" TEXT NOT NULL;
