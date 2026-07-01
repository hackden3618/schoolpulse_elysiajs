/*
  Warnings:

  - The values [cancelled] on the enum `SubscriptionStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [on_leave,suspended,defaulted,terminated] on the enum `UserStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `class_level` on the `classes` table. All the data in the column will be lost.
  - You are about to drop the column `class_name` on the `classes` table. All the data in the column will be lost.
  - You are about to drop the column `class_teacher` on the `classes` table. All the data in the column will be lost.
  - You are about to drop the column `school_id` on the `classes` table. All the data in the column will be lost.
  - The primary key for the `school_membership_roles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `subscription_type` on the `schools` table. All the data in the column will be lost.
  - The `relationship` column on the `student_guardians` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `class_id` on the `students` table. All the data in the column will be lost.
  - You are about to drop the `school_memberships` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[stream_id,academic_year_id,level]` on the table `classes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[membership_id,role_id]` on the table `school_membership_roles` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[school_phone]` on the table `schools` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[school_email]` on the table `schools` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stream_name,school_id]` on the table `streams` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[school_id,admission_number]` on the table `students` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `academic_year_id` to the `classes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `class_teacher_id` to the `classes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `level` to the `classes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stream_id` to the `classes` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `school_membership_roles` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- CreateEnum
CREATE TYPE "SchoolTier" AS ENUM ('small', 'medium', 'large', 'enterprise');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('free', 'monthly', 'termly', 'yearly');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('active', 'on_leave', 'suspended', 'resigned', 'terminated');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('active', 'suspended', 'transferred', 'expelled', 'on_leave', 'medical_leave', 'truant', 'dropped_out');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('active', 'inactive', 'archived', 'graduated', 'deceased');

-- CreateEnum
CREATE TYPE "Relationship" AS ENUM ('father', 'mother', 'sibling', 'emergency', 'sponsor', 'legal_guardian', 'step_parent', 'relative', 'other');

-- CreateEnum
CREATE TYPE "ArchiveReason" AS ENUM ('graduated', 'dropped_out', 'expelled', 'transferred', 'deceased', 'other');

-- AlterEnum
BEGIN;
CREATE TYPE "SubscriptionStatus_new" AS ENUM ('trial', 'active', 'suspended', 'pending_review', 'defaulted', 'terminated');
ALTER TABLE "public"."schools" ALTER COLUMN "subscription_status" DROP DEFAULT;
ALTER TABLE "schools" ALTER COLUMN "subscription_status" TYPE "SubscriptionStatus_new" USING ("subscription_status"::text::"SubscriptionStatus_new");
ALTER TYPE "SubscriptionStatus" RENAME TO "SubscriptionStatus_old";
ALTER TYPE "SubscriptionStatus_new" RENAME TO "SubscriptionStatus";
DROP TYPE "public"."SubscriptionStatus_old";
ALTER TABLE "schools" ALTER COLUMN "subscription_status" SET DEFAULT 'trial';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "UserStatus_new" AS ENUM ('active', 'inactive', 'archived');
ALTER TABLE "public"."users" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "status" TYPE "UserStatus_new" USING ("status"::text::"UserStatus_new");
ALTER TYPE "UserStatus" RENAME TO "UserStatus_old";
ALTER TYPE "UserStatus_new" RENAME TO "UserStatus";
DROP TYPE "public"."UserStatus_old";
ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'active';
COMMIT;

-- DropForeignKey
ALTER TABLE "classes" DROP CONSTRAINT "classes_school_id_fkey";

-- DropForeignKey
ALTER TABLE "school_membership_roles" DROP CONSTRAINT "school_membership_roles_membership_id_fkey";

-- DropForeignKey
ALTER TABLE "school_memberships" DROP CONSTRAINT "school_memberships_school_id_fkey";

-- DropForeignKey
ALTER TABLE "school_memberships" DROP CONSTRAINT "school_memberships_user_id_fkey";

-- DropForeignKey
ALTER TABLE "student_guardians" DROP CONSTRAINT "student_guardians_guardian_id_fkey";

-- DropForeignKey
ALTER TABLE "students" DROP CONSTRAINT "students_class_id_school_id_fkey";

-- DropForeignKey
ALTER TABLE "students" DROP CONSTRAINT "students_school_id_fkey";

-- DropIndex
DROP INDEX "classes_id_school_id_key";

-- AlterTable
ALTER TABLE "classes" DROP COLUMN "class_level",
DROP COLUMN "class_name",
DROP COLUMN "class_teacher",
DROP COLUMN "school_id",
ADD COLUMN     "academic_year_id" UUID NOT NULL,
ADD COLUMN     "class_teacher_id" UUID NOT NULL,
ADD COLUMN     "level" INTEGER NOT NULL,
ADD COLUMN     "stream_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "school_membership_roles" DROP CONSTRAINT "school_membership_roles_pkey",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "school_membership_roles_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "schools" DROP COLUMN "subscription_type",
ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'Kenya',
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'KES',
ADD COLUMN     "deleted_at" TIMESTAMPTZ,
ADD COLUMN     "school_tier" "SchoolTier" DEFAULT 'medium',
ADD COLUMN     "subscription_plan" "SubscriptionPlan" NOT NULL DEFAULT 'free',
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Africa/Nairobi';

-- AlterTable
ALTER TABLE "student_guardians" ADD COLUMN     "is_primary" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "receives_email" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "receives_sms" BOOLEAN NOT NULL DEFAULT true,
DROP COLUMN "relationship",
ADD COLUMN     "relationship" "Relationship" NOT NULL DEFAULT 'legal_guardian';

-- AlterTable
ALTER TABLE "students" DROP COLUMN "class_id",
ADD COLUMN     "archive_reason" "ArchiveReason",
ADD COLUMN     "deleted_at" TIMESTAMPTZ,
ADD COLUMN     "student_life_cycle_status" "StudentStatus" NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deleted_at" TIMESTAMPTZ,
ADD COLUMN     "last_login" TIMESTAMP(3),
ADD COLUMN     "profile_pic" TEXT;

-- DropTable
DROP TABLE "school_memberships";

-- DropEnum
DROP TYPE "SubscriptionType";

-- CreateTable
CREATE TABLE "academic_years" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "school_id" UUID NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terms" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "class_id" UUID NOT NULL,
    "year_id" UUID NOT NULL,
    "term_id" UUID NOT NULL,
    "enrollment_status" "EnrollmentStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_users" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "left_at" TIMESTAMP(3),

    CONSTRAINT "school_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "academic_years_school_id_idx" ON "academic_years"("school_id");

-- CreateIndex
CREATE UNIQUE INDEX "academic_years_name_school_id_key" ON "academic_years"("name", "school_id");

-- CreateIndex
CREATE INDEX "terms_academic_year_id_idx" ON "terms"("academic_year_id");

-- CreateIndex
CREATE UNIQUE INDEX "terms_academic_year_id_name_key" ON "terms"("academic_year_id", "name");

-- CreateIndex
CREATE INDEX "enrollments_student_id_idx" ON "enrollments"("student_id");

-- CreateIndex
CREATE INDEX "enrollments_class_id_idx" ON "enrollments"("class_id");

-- CreateIndex
CREATE INDEX "enrollments_year_id_idx" ON "enrollments"("year_id");

-- CreateIndex
CREATE INDEX "enrollments_term_id_idx" ON "enrollments"("term_id");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_student_id_class_id_year_id_term_id_key" ON "enrollments"("student_id", "class_id", "year_id", "term_id");

-- CreateIndex
CREATE UNIQUE INDEX "school_users_school_id_user_id_key" ON "school_users"("school_id", "user_id");

-- CreateIndex
CREATE INDEX "classes_stream_id_idx" ON "classes"("stream_id");

-- CreateIndex
CREATE INDEX "classes_academic_year_id_idx" ON "classes"("academic_year_id");

-- CreateIndex
CREATE INDEX "classes_class_teacher_id_idx" ON "classes"("class_teacher_id");

-- CreateIndex
CREATE UNIQUE INDEX "classes_stream_id_academic_year_id_level_key" ON "classes"("stream_id", "academic_year_id", "level");

-- CreateIndex
CREATE UNIQUE INDEX "school_membership_roles_membership_id_role_id_key" ON "school_membership_roles"("membership_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "schools_school_phone_key" ON "schools"("school_phone");

-- CreateIndex
CREATE UNIQUE INDEX "schools_school_email_key" ON "schools"("school_email");

-- CreateIndex
CREATE INDEX "schools_subscription_status_idx" ON "schools"("subscription_status");

-- CreateIndex
CREATE INDEX "streams_school_id_idx" ON "streams"("school_id");

-- CreateIndex
CREATE UNIQUE INDEX "streams_stream_name_school_id_key" ON "streams"("stream_name", "school_id");

-- CreateIndex
CREATE INDEX "students_school_id_idx" ON "students"("school_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_school_id_admission_number_key" ON "students"("school_id", "admission_number");

-- AddForeignKey
ALTER TABLE "academic_years" ADD CONSTRAINT "academic_years_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "terms" ADD CONSTRAINT "terms_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_stream_id_fkey" FOREIGN KEY ("stream_id") REFERENCES "streams"("stream_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_class_teacher_id_fkey" FOREIGN KEY ("class_teacher_id") REFERENCES "school_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_guardians" ADD CONSTRAINT "student_guardians_guardian_id_fkey" FOREIGN KEY ("guardian_id") REFERENCES "school_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("student_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_year_id_fkey" FOREIGN KEY ("year_id") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_term_id_fkey" FOREIGN KEY ("term_id") REFERENCES "terms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_users" ADD CONSTRAINT "school_users_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_users" ADD CONSTRAINT "school_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_membership_roles" ADD CONSTRAINT "school_membership_roles_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "school_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
