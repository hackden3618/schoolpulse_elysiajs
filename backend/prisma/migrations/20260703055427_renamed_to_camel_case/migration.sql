/*
  Warnings:

  - You are about to drop the `ClassAssignment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ClassAssignment" DROP CONSTRAINT "ClassAssignment_class_id_fkey";

-- DropForeignKey
ALTER TABLE "ClassAssignment" DROP CONSTRAINT "ClassAssignment_school_id_fkey";

-- DropForeignKey
ALTER TABLE "ClassAssignment" DROP CONSTRAINT "ClassAssignment_teacher_id_fkey";

-- DropTable
DROP TABLE "ClassAssignment";

-- CreateTable
CREATE TABLE "class_assignments" (
    "id" UUID NOT NULL,
    "class_id" UUID NOT NULL,
    "teacher_id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "start_date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMPTZ,

    CONSTRAINT "class_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "class_assignments_class_id_idx" ON "class_assignments"("class_id");

-- CreateIndex
CREATE INDEX "class_assignments_school_id_idx" ON "class_assignments"("school_id");

-- CreateIndex
CREATE INDEX "class_assignments_teacher_id_idx" ON "class_assignments"("teacher_id");

-- CreateIndex
CREATE INDEX "class_assignments_academic_year_id_idx" ON "class_assignments"("academic_year_id");

-- CreateIndex
CREATE UNIQUE INDEX "class_assignments_class_id_teacher_id_key" ON "class_assignments"("class_id", "teacher_id");

-- AddForeignKey
ALTER TABLE "class_assignments" ADD CONSTRAINT "class_assignments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_assignments" ADD CONSTRAINT "class_assignments_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "school_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_assignments" ADD CONSTRAINT "class_assignments_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
