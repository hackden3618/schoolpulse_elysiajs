-- CreateEnum
CREATE TYPE "platform_admin_role" AS ENUM ('super_admin', 'admin', 'staff', 'support');

-- CreateEnum
CREATE TYPE "platform_admin_status" AS ENUM ('active', 'invited', 'suspended');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "aggregate_type" ADD VALUE 'join_request';
ALTER TYPE "aggregate_type" ADD VALUE 'platform_admin';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "event_type" ADD VALUE 'JoinRequestSubmitted';
ALTER TYPE "event_type" ADD VALUE 'JoinRequestApproved';
ALTER TYPE "event_type" ADD VALUE 'JoinRequestRejected';
ALTER TYPE "event_type" ADD VALUE 'PlatformAdminInvited';
ALTER TYPE "event_type" ADD VALUE 'PlatformAdminCreated';

-- AlterTable
ALTER TABLE "join_requests" ADD COLUMN     "country" TEXT DEFAULT 'Kenya',
ADD COLUMN     "county" TEXT,
ADD COLUMN     "one_time_code" TEXT,
ADD COLUMN     "town" TEXT;

-- CreateTable
CREATE TABLE "platform_admins" (
    "id" UUID NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "role" "platform_admin_role" NOT NULL DEFAULT 'staff',
    "hashed_password" TEXT,
    "status" "platform_admin_status" NOT NULL DEFAULT 'invited',
    "created_by" UUID,
    "last_login" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "platform_admins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "platform_admins_email_key" ON "platform_admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "platform_admins_phone_key" ON "platform_admins"("phone");
