/*
  Warnings:

  - You are about to drop the column `created_at` on the `academic_years` table. All the data in the column will be lost.
  - You are about to drop the column `end_date` on the `academic_years` table. All the data in the column will be lost.
  - You are about to drop the column `school_id` on the `academic_years` table. All the data in the column will be lost.
  - You are about to drop the column `start_date` on the `academic_years` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `academic_years` table. All the data in the column will be lost.
  - You are about to drop the column `class_id` on the `enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `enrollment_status` on the `enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `student_id` on the `enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `term_id` on the `enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `year_id` on the `enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `roles` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `roles` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `schools` table. All the data in the column will be lost.
  - You are about to drop the column `deleted_at` on the `schools` table. All the data in the column will be lost.
  - You are about to drop the column `post_office` on the `schools` table. All the data in the column will be lost.
  - You are about to drop the column `school_logo` on the `schools` table. All the data in the column will be lost.
  - You are about to drop the column `school_tier` on the `schools` table. All the data in the column will be lost.
  - You are about to drop the column `school_website` on the `schools` table. All the data in the column will be lost.
  - You are about to drop the column `subscription_end_date` on the `schools` table. All the data in the column will be lost.
  - You are about to drop the column `subscription_plan` on the `schools` table. All the data in the column will be lost.
  - You are about to drop the column `subscription_start_date` on the `schools` table. All the data in the column will be lost.
  - You are about to drop the column `subscription_status` on the `schools` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `schools` table. All the data in the column will be lost.
  - The primary key for the `streams` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `created_at` on the `streams` table. All the data in the column will be lost.
  - You are about to drop the column `school_id` on the `streams` table. All the data in the column will be lost.
  - You are about to drop the column `stream_id` on the `streams` table. All the data in the column will be lost.
  - You are about to drop the column `stream_name` on the `streams` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `streams` table. All the data in the column will be lost.
  - You are about to drop the column `guardian_id` on the `student_guardians` table. All the data in the column will be lost.
  - You are about to drop the column `is_primary` on the `student_guardians` table. All the data in the column will be lost.
  - You are about to drop the column `receives_email` on the `student_guardians` table. All the data in the column will be lost.
  - You are about to drop the column `receives_sms` on the `student_guardians` table. All the data in the column will be lost.
  - You are about to drop the column `student_id` on the `student_guardians` table. All the data in the column will be lost.
  - The primary key for the `students` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `admission_number` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `archive_reason` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `date_of_birth` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `deleted_at` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `first_name` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `last_name` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `school_id` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `second_name` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `student_id` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `student_life_cycle_status` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `academic_year_id` on the `terms` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `terms` table. All the data in the column will be lost.
  - You are about to drop the column `end_date` on the `terms` table. All the data in the column will be lost.
  - You are about to drop the column `start_date` on the `terms` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `terms` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `deleted_at` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `last_login` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `class_assignments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `classes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `school_membership_roles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `school_users` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name,schoolId]` on the table `academic_years` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[studentId,classInstanceId,academicYearId]` on the table `enrollments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,schoolId]` on the table `streams` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[studentId,guardianId]` on the table `student_guardians` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[schoolId,admissionNumber]` on the table `students` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[academicYearId,name]` on the table `terms` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `endDate` to the `academic_years` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolId` to the `academic_years` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `academic_years` table without a default value. This is not possible if the table is not empty.
  - Added the required column `academicYearId` to the `enrollments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `classInstanceId` to the `enrollments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentId` to the `enrollments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `enrollments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `schools` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `streams` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `name` to the `streams` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolId` to the `streams` table without a default value. This is not possible if the table is not empty.
  - Added the required column `guardianId` to the `student_guardians` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentId` to the `student_guardians` table without a default value. This is not possible if the table is not empty.
  - Added the required column `admissionNumber` to the `students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dateOfBirth` to the `students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `students` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `students` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `lastName` to the `students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolId` to the `students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `academicYearId` to the `terms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endDate` to the `terms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `terms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('present', 'absent', 'late', 'excused');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('morning', 'afternoon', 'lesson');

-- DropForeignKey
ALTER TABLE "academic_years" DROP CONSTRAINT "academic_years_school_id_fkey";

-- DropForeignKey
ALTER TABLE "class_assignments" DROP CONSTRAINT "class_assignments_class_id_fkey";

-- DropForeignKey
ALTER TABLE "class_assignments" DROP CONSTRAINT "class_assignments_school_id_fkey";

-- DropForeignKey
ALTER TABLE "class_assignments" DROP CONSTRAINT "class_assignments_teacher_id_fkey";

-- DropForeignKey
ALTER TABLE "classes" DROP CONSTRAINT "classes_academic_year_id_fkey";

-- DropForeignKey
ALTER TABLE "classes" DROP CONSTRAINT "classes_class_teacher_id_fkey";

-- DropForeignKey
ALTER TABLE "classes" DROP CONSTRAINT "classes_stream_id_fkey";

-- DropForeignKey
ALTER TABLE "enrollments" DROP CONSTRAINT "enrollments_class_id_fkey";

-- DropForeignKey
ALTER TABLE "enrollments" DROP CONSTRAINT "enrollments_student_id_fkey";

-- DropForeignKey
ALTER TABLE "enrollments" DROP CONSTRAINT "enrollments_term_id_fkey";

-- DropForeignKey
ALTER TABLE "enrollments" DROP CONSTRAINT "enrollments_year_id_fkey";

-- DropForeignKey
ALTER TABLE "school_membership_roles" DROP CONSTRAINT "school_membership_roles_membership_id_fkey";

-- DropForeignKey
ALTER TABLE "school_membership_roles" DROP CONSTRAINT "school_membership_roles_role_id_fkey";

-- DropForeignKey
ALTER TABLE "school_users" DROP CONSTRAINT "school_users_school_id_fkey";

-- DropForeignKey
ALTER TABLE "school_users" DROP CONSTRAINT "school_users_user_id_fkey";

-- DropForeignKey
ALTER TABLE "streams" DROP CONSTRAINT "streams_school_id_fkey";

-- DropForeignKey
ALTER TABLE "student_guardians" DROP CONSTRAINT "student_guardians_guardian_id_fkey";

-- DropForeignKey
ALTER TABLE "student_guardians" DROP CONSTRAINT "student_guardians_student_id_fkey";

-- DropForeignKey
ALTER TABLE "students" DROP CONSTRAINT "students_school_id_fkey";

-- DropForeignKey
ALTER TABLE "terms" DROP CONSTRAINT "terms_academic_year_id_fkey";

-- DropIndex
DROP INDEX "academic_years_name_school_id_key";

-- DropIndex
DROP INDEX "academic_years_school_id_idx";

-- DropIndex
DROP INDEX "enrollments_class_id_idx";

-- DropIndex
DROP INDEX "enrollments_student_id_class_id_year_id_term_id_key";

-- DropIndex
DROP INDEX "enrollments_student_id_idx";

-- DropIndex
DROP INDEX "enrollments_term_id_idx";

-- DropIndex
DROP INDEX "enrollments_year_id_idx";

-- DropIndex
DROP INDEX "schools_subscription_status_idx";

-- DropIndex
DROP INDEX "streams_school_id_idx";

-- DropIndex
DROP INDEX "streams_stream_name_school_id_key";

-- DropIndex
DROP INDEX "student_guardians_student_id_guardian_id_key";

-- DropIndex
DROP INDEX "students_school_id_admission_number_key";

-- DropIndex
DROP INDEX "students_school_id_idx";

-- DropIndex
DROP INDEX "terms_academic_year_id_idx";

-- DropIndex
DROP INDEX "terms_academic_year_id_name_key";

-- AlterTable
ALTER TABLE "academic_years" DROP COLUMN "created_at",
DROP COLUMN "end_date",
DROP COLUMN "school_id",
DROP COLUMN "start_date",
DROP COLUMN "updated_at",
ADD COLUMN     "endDate" DATE NOT NULL,
ADD COLUMN     "schoolId" TEXT NOT NULL,
ADD COLUMN     "startDate" DATE NOT NULL;

-- AlterTable
ALTER TABLE "enrollments" DROP COLUMN "class_id",
DROP COLUMN "created_at",
DROP COLUMN "enrollment_status",
DROP COLUMN "student_id",
DROP COLUMN "term_id",
DROP COLUMN "updated_at",
DROP COLUMN "year_id",
ADD COLUMN     "academicYearId" TEXT NOT NULL,
ADD COLUMN     "classInstanceId" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" "EnrollmentStatus" NOT NULL DEFAULT 'active',
ADD COLUMN     "studentId" TEXT NOT NULL,
ADD COLUMN     "termId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "roles" DROP COLUMN "created_at",
DROP COLUMN "updated_at";

-- AlterTable
ALTER TABLE "schools" DROP COLUMN "created_at",
DROP COLUMN "deleted_at",
DROP COLUMN "post_office",
DROP COLUMN "school_logo",
DROP COLUMN "school_tier",
DROP COLUMN "school_website",
DROP COLUMN "subscription_end_date",
DROP COLUMN "subscription_plan",
DROP COLUMN "subscription_start_date",
DROP COLUMN "subscription_status",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deletedAt" TIMESTAMPTZ,
ADD COLUMN     "schoolTier" "SchoolTier" NOT NULL DEFAULT 'medium',
ADD COLUMN     "subscriptionPlan" "SubscriptionPlan" NOT NULL DEFAULT 'free',
ADD COLUMN     "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'trial',
ADD COLUMN     "updatedAt" TIMESTAMPTZ NOT NULL;

-- AlterTable
ALTER TABLE "streams" DROP CONSTRAINT "streams_pkey",
DROP COLUMN "created_at",
DROP COLUMN "school_id",
DROP COLUMN "stream_id",
DROP COLUMN "stream_name",
DROP COLUMN "updated_at",
ADD COLUMN     "classTemplateId" UUID,
ADD COLUMN     "id" UUID NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "schoolId" TEXT NOT NULL,
ADD CONSTRAINT "streams_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "student_guardians" DROP COLUMN "guardian_id",
DROP COLUMN "is_primary",
DROP COLUMN "receives_email",
DROP COLUMN "receives_sms",
DROP COLUMN "student_id",
ADD COLUMN     "guardianId" TEXT NOT NULL,
ADD COLUMN     "studentId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "students" DROP CONSTRAINT "students_pkey",
DROP COLUMN "admission_number",
DROP COLUMN "archive_reason",
DROP COLUMN "created_at",
DROP COLUMN "date_of_birth",
DROP COLUMN "deleted_at",
DROP COLUMN "first_name",
DROP COLUMN "last_name",
DROP COLUMN "school_id",
DROP COLUMN "second_name",
DROP COLUMN "student_id",
DROP COLUMN "student_life_cycle_status",
DROP COLUMN "updated_at",
ADD COLUMN     "admissionNumber" TEXT NOT NULL,
ADD COLUMN     "dateOfBirth" DATE NOT NULL,
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "id" UUID NOT NULL,
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "schoolId" TEXT NOT NULL,
ADD COLUMN     "secondName" TEXT,
ADD COLUMN     "status" "StudentStatus" NOT NULL DEFAULT 'active',
ADD CONSTRAINT "students_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "terms" DROP COLUMN "academic_year_id",
DROP COLUMN "created_at",
DROP COLUMN "end_date",
DROP COLUMN "start_date",
DROP COLUMN "updated_at",
ADD COLUMN     "academicYearId" TEXT NOT NULL,
ADD COLUMN     "endDate" DATE NOT NULL,
ADD COLUMN     "startDate" DATE NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "created_at",
DROP COLUMN "deleted_at",
DROP COLUMN "last_login",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deletedAt" TIMESTAMPTZ,
ADD COLUMN     "lastLogin" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMPTZ NOT NULL;

-- DropTable
DROP TABLE "class_assignments";

-- DropTable
DROP TABLE "classes";

-- DropTable
DROP TABLE "school_membership_roles";

-- DropTable
DROP TABLE "school_users";

-- CreateTable
CREATE TABLE "school_memberships" (
    "id" UUID NOT NULL,
    "schoolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_roles" (
    "id" UUID NOT NULL,
    "membershipId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "membership_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_templates" (
    "id" UUID NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL,

    CONSTRAINT "class_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_instances" (
    "id" UUID NOT NULL,
    "classTemplateId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "streamId" TEXT NOT NULL,
    "classTeacherId" TEXT,

    CONSTRAINT "class_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" UUID NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_subjects" (
    "id" UUID NOT NULL,
    "classInstanceId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,

    CONSTRAINT "class_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessments" (
    "id" UUID NOT NULL,
    "classInstanceId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "totalMarks" INTEGER NOT NULL,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_results" (
    "id" UUID NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "marks" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "assessment_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_sessions" (
    "id" UUID NOT NULL,
    "classInstanceId" TEXT NOT NULL,
    "sessionDate" TIMESTAMP(3) NOT NULL,
    "sessionType" "SessionType" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',

    CONSTRAINT "attendance_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" UUID NOT NULL,
    "sessionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "checkInTime" TIMESTAMP(3),

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL,
    "studentId" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" TEXT NOT NULL,
    "transactionRef" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discipline_cases" (
    "id" UUID NOT NULL,
    "studentId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discipline_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "school_memberships_schoolId_userId_key" ON "school_memberships"("schoolId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "membership_roles_membershipId_roleId_key" ON "membership_roles"("membershipId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "class_templates_schoolId_name_key" ON "class_templates"("schoolId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "class_instances_classTemplateId_academicYearId_streamId_key" ON "class_instances"("classTemplateId", "academicYearId", "streamId");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_schoolId_code_key" ON "subjects"("schoolId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "class_subjects_classInstanceId_subjectId_key" ON "class_subjects"("classInstanceId", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_results_assessmentId_studentId_key" ON "assessment_results"("assessmentId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_sessionId_studentId_key" ON "attendance_records"("sessionId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "academic_years_name_schoolId_key" ON "academic_years"("name", "schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_studentId_classInstanceId_academicYearId_key" ON "enrollments"("studentId", "classInstanceId", "academicYearId");

-- CreateIndex
CREATE UNIQUE INDEX "streams_name_schoolId_key" ON "streams"("name", "schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "student_guardians_studentId_guardianId_key" ON "student_guardians"("studentId", "guardianId");

-- CreateIndex
CREATE UNIQUE INDEX "students_schoolId_admissionNumber_key" ON "students"("schoolId", "admissionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "terms_academicYearId_name_key" ON "terms"("academicYearId", "name");

-- AddForeignKey
ALTER TABLE "school_memberships" ADD CONSTRAINT "school_memberships_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_memberships" ADD CONSTRAINT "school_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_roles" ADD CONSTRAINT "membership_roles_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "school_memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_roles" ADD CONSTRAINT "membership_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "streams" ADD CONSTRAINT "streams_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "streams" ADD CONSTRAINT "streams_classTemplateId_fkey" FOREIGN KEY ("classTemplateId") REFERENCES "class_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_years" ADD CONSTRAINT "academic_years_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "terms" ADD CONSTRAINT "terms_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_instances" ADD CONSTRAINT "class_instances_classTemplateId_fkey" FOREIGN KEY ("classTemplateId") REFERENCES "class_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_instances" ADD CONSTRAINT "class_instances_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_instances" ADD CONSTRAINT "class_instances_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "streams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_guardians" ADD CONSTRAINT "student_guardians_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_guardians" ADD CONSTRAINT "student_guardians_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_classInstanceId_fkey" FOREIGN KEY ("classInstanceId") REFERENCES "class_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_termId_fkey" FOREIGN KEY ("termId") REFERENCES "terms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_subjects" ADD CONSTRAINT "class_subjects_classInstanceId_fkey" FOREIGN KEY ("classInstanceId") REFERENCES "class_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_subjects" ADD CONSTRAINT "class_subjects_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_results" ADD CONSTRAINT "assessment_results_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_results" ADD CONSTRAINT "assessment_results_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_classInstanceId_fkey" FOREIGN KEY ("classInstanceId") REFERENCES "class_instances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "attendance_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
