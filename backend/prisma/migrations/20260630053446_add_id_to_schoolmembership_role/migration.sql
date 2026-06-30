/*
  Warnings:

  - The primary key for the `SchoolMembershipRole` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[membershipId,roleId]` on the table `SchoolMembershipRole` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `SchoolMembershipRole` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable: Add id column as nullable first
ALTER TABLE "SchoolMembershipRole" DROP CONSTRAINT "SchoolMembershipRole_pkey",
ADD COLUMN     "id" UUID;

-- Populate id column with unique UUIDs for existing rows
UPDATE "SchoolMembershipRole" SET "id" = gen_random_uuid() WHERE "id" IS NULL;

-- Make id column NOT NULL and set as primary key
ALTER TABLE "SchoolMembershipRole" ALTER COLUMN "id" SET NOT NULL,
ADD CONSTRAINT "SchoolMembershipRole_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolMembershipRole_membershipId_roleId_key" ON "SchoolMembershipRole"("membershipId", "roleId");
