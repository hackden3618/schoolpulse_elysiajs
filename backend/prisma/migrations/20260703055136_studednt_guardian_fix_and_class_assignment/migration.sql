/*
  Warnings:

  - You are about to drop the column `claas_id` on the `ClassAssignment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[class_id,teacher_id]` on the table `ClassAssignment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `class_id` to the `ClassAssignment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ClassAssignment" DROP CONSTRAINT "ClassAssignment_claas_id_fkey";

-- DropIndex
DROP INDEX "ClassAssignment_claas_id_idx";

-- DropIndex
DROP INDEX "ClassAssignment_claas_id_teacher_id_key";

-- AlterTable
ALTER TABLE "ClassAssignment" DROP COLUMN "claas_id",
ADD COLUMN     "class_id" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "ClassAssignment_class_id_idx" ON "ClassAssignment"("class_id");

-- CreateIndex
CREATE UNIQUE INDEX "ClassAssignment_class_id_teacher_id_key" ON "ClassAssignment"("class_id", "teacher_id");

-- AddForeignKey
ALTER TABLE "ClassAssignment" ADD CONSTRAINT "ClassAssignment_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
