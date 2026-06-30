/*
  Warnings:

  - You are about to drop the column `classLevel` on the `classes` table. All the data in the column will be lost.
  - You are about to drop the column `className` on the `classes` table. All the data in the column will be lost.
  - You are about to drop the column `classTeacher` on the `classes` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `classes` table. All the data in the column will be lost.
  - You are about to drop the column `schoolId` on the `classes` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `classes` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `roles` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `roles` table. All the data in the column will be lost.
  - You are about to drop the column `membershipId` on the `school_membership_roles` table. All the data in the column will be lost.
  - You are about to drop the column `roleId` on the `school_membership_roles` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `school_memberships` table. All the data in the column will be lost.
  - You are about to drop the column `schoolId` on the `school_memberships` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `school_memberships` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `school_memberships` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `schools` table. All the data in the column will be lost.
  - You are about to drop the column `postOffice` on the `schools` table. All the data in the column will be lost.
  - You are about to drop the column `schoolAddress` on the `schools` table. All the data in the column will be lost.
  - You are about to drop the column `schoolEmail` on the `schools` table. All the data in the column will be lost.
  - You are about to drop the column `schoolLogo` on the `schools` table. All the data in the column will be lost.
  - You are about to drop the column `schoolName` on the `schools` table. All the data in the column will be lost.
  - You are about to drop the column `schoolPhone` on the `schools` table. All the data in the column will be lost.
  - You are about to drop the column `schoolWebsite` on the `schools` table. All the data in the column will be lost.
  - You are about to drop the column `subscriptionEndDate` on the `schools` table. All the data in the column will be lost.
  - You are about to drop the column `subscriptionStartDate` on the `schools` table. All the data in the column will be lost.
  - You are about to drop the column `subscriptionStatus` on the `schools` table. All the data in the column will be lost.
  - You are about to drop the column `subscriptionType` on the `schools` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `schools` table. All the data in the column will be lost.
  - The primary key for the `student_guardians` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `guardianId` on the `student_guardians` table. All the data in the column will be lost.
  - You are about to drop the column `relationshipId` on the `student_guardians` table. All the data in the column will be lost.
  - You are about to drop the column `studentId` on the `student_guardians` table. All the data in the column will be lost.
  - You are about to drop the column `admissionNumber` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `classId` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `dateOfBirth` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `schoolId` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `secondName` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `hashedPassword` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `secondName` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `strams` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[membership_id,role_id]` on the table `school_membership_roles` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[school_id,user_id]` on the table `school_memberships` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[student_id,guardian_id]` on the table `student_guardians` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `class_level` to the `classes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `class_name` to the `classes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `class_teacher` to the `classes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `school_id` to the `classes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `classes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `roles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `membership_id` to the `school_membership_roles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role_id` to the `school_membership_roles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `school_id` to the `school_memberships` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `school_memberships` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `school_memberships` table without a default value. This is not possible if the table is not empty.
  - Added the required column `school_name` to the `schools` table without a default value. This is not possible if the table is not empty.
  - Added the required column `school_phone` to the `schools` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `schools` table without a default value. This is not possible if the table is not empty.
  - Added the required column `guardian_id` to the `student_guardians` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `student_guardians` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `student_id` to the `student_guardians` table without a default value. This is not possible if the table is not empty.
  - Added the required column `admission_number` to the `students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `class_id` to the `students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `date_of_birth` to the `students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `first_name` to the `students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_name` to the `students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `school_id` to the `students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `first_name` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hashed_password` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "classes" DROP CONSTRAINT "classes_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "school_membership_roles" DROP CONSTRAINT "school_membership_roles_membershipId_fkey";

-- DropForeignKey
ALTER TABLE "school_membership_roles" DROP CONSTRAINT "school_membership_roles_roleId_fkey";

-- DropForeignKey
ALTER TABLE "school_memberships" DROP CONSTRAINT "school_memberships_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "school_memberships" DROP CONSTRAINT "school_memberships_userId_fkey";

-- DropForeignKey
ALTER TABLE "strams" DROP CONSTRAINT "strams_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "student_guardians" DROP CONSTRAINT "student_guardians_guardianId_fkey";

-- DropForeignKey
ALTER TABLE "student_guardians" DROP CONSTRAINT "student_guardians_studentId_fkey";

-- DropForeignKey
ALTER TABLE "students" DROP CONSTRAINT "students_classId_fkey";

-- DropForeignKey
ALTER TABLE "students" DROP CONSTRAINT "students_schoolId_fkey";

-- DropIndex
DROP INDEX "school_membership_roles_membershipId_roleId_key";

-- DropIndex
DROP INDEX "school_memberships_schoolId_userId_key";

-- DropIndex
DROP INDEX "student_guardians_studentId_guardianId_key";

-- AlterTable
ALTER TABLE "classes" DROP COLUMN "classLevel",
DROP COLUMN "className",
DROP COLUMN "classTeacher",
DROP COLUMN "createdAt",
DROP COLUMN "schoolId",
DROP COLUMN "updatedAt",
ADD COLUMN     "class_level" TEXT NOT NULL,
ADD COLUMN     "class_name" TEXT NOT NULL,
ADD COLUMN     "class_teacher" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "school_id" UUID NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMPTZ NOT NULL;

-- AlterTable
ALTER TABLE "roles" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMPTZ NOT NULL;

-- AlterTable
ALTER TABLE "school_membership_roles" DROP COLUMN "membershipId",
DROP COLUMN "roleId",
ADD COLUMN     "membership_id" UUID NOT NULL,
ADD COLUMN     "role_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "school_memberships" DROP COLUMN "createdAt",
DROP COLUMN "schoolId",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "school_id" UUID NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMPTZ NOT NULL,
ADD COLUMN     "user_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "schools" DROP COLUMN "createdAt",
DROP COLUMN "postOffice",
DROP COLUMN "schoolAddress",
DROP COLUMN "schoolEmail",
DROP COLUMN "schoolLogo",
DROP COLUMN "schoolName",
DROP COLUMN "schoolPhone",
DROP COLUMN "schoolWebsite",
DROP COLUMN "subscriptionEndDate",
DROP COLUMN "subscriptionStartDate",
DROP COLUMN "subscriptionStatus",
DROP COLUMN "subscriptionType",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "post_office" TEXT,
ADD COLUMN     "school_address" TEXT,
ADD COLUMN     "school_email" TEXT,
ADD COLUMN     "school_logo" TEXT,
ADD COLUMN     "school_name" TEXT NOT NULL,
ADD COLUMN     "school_phone" TEXT NOT NULL,
ADD COLUMN     "school_website" TEXT,
ADD COLUMN     "subscription_end_date" TIMESTAMPTZ,
ADD COLUMN     "subscription_start_date" TIMESTAMPTZ,
ADD COLUMN     "subscription_status" "SubscriptionStatus" NOT NULL DEFAULT 'trial',
ADD COLUMN     "subscription_type" "SubscriptionType" NOT NULL DEFAULT 'free',
ADD COLUMN     "updated_at" TIMESTAMPTZ NOT NULL;

-- AlterTable
ALTER TABLE "student_guardians" DROP CONSTRAINT "student_guardians_pkey",
DROP COLUMN "guardianId",
DROP COLUMN "relationshipId",
DROP COLUMN "studentId",
ADD COLUMN     "guardian_id" UUID NOT NULL,
ADD COLUMN     "id" UUID NOT NULL,
ADD COLUMN     "student_id" UUID NOT NULL,
ADD CONSTRAINT "student_guardians_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "students" DROP COLUMN "admissionNumber",
DROP COLUMN "classId",
DROP COLUMN "createdAt",
DROP COLUMN "dateOfBirth",
DROP COLUMN "firstName",
DROP COLUMN "lastName",
DROP COLUMN "schoolId",
DROP COLUMN "secondName",
DROP COLUMN "updatedAt",
ADD COLUMN     "admission_number" TEXT NOT NULL,
ADD COLUMN     "class_id" UUID NOT NULL,
ADD COLUMN     "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "date_of_birth" DATE NOT NULL,
ADD COLUMN     "first_name" TEXT NOT NULL,
ADD COLUMN     "last_name" TEXT NOT NULL,
ADD COLUMN     "school_id" UUID NOT NULL,
ADD COLUMN     "second_name" TEXT,
ADD COLUMN     "updated_at" TIMESTAMPTZ NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "createdAt",
DROP COLUMN "firstName",
DROP COLUMN "hashedPassword",
DROP COLUMN "lastName",
DROP COLUMN "secondName",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "first_name" TEXT NOT NULL,
ADD COLUMN     "hashed_password" TEXT NOT NULL,
ADD COLUMN     "last_name" TEXT,
ADD COLUMN     "second_name" TEXT,
ADD COLUMN     "updated_at" TIMESTAMPTZ NOT NULL;

-- DropTable
DROP TABLE "strams";

-- CreateTable
CREATE TABLE "streams" (
    "id" UUID NOT NULL,
    "stream_name" TEXT NOT NULL,
    "school_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "streams_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "school_membership_roles_membership_id_role_id_key" ON "school_membership_roles"("membership_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "school_memberships_school_id_user_id_key" ON "school_memberships"("school_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_guardians_student_id_guardian_id_key" ON "student_guardians"("student_id", "guardian_id");

-- AddForeignKey
ALTER TABLE "school_memberships" ADD CONSTRAINT "school_memberships_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_memberships" ADD CONSTRAINT "school_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_membership_roles" ADD CONSTRAINT "school_membership_roles_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "school_memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_membership_roles" ADD CONSTRAINT "school_membership_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "streams" ADD CONSTRAINT "streams_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_guardians" ADD CONSTRAINT "student_guardians_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_guardians" ADD CONSTRAINT "student_guardians_guardian_id_fkey" FOREIGN KEY ("guardian_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
