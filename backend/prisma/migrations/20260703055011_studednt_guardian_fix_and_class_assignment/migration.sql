-- DropForeignKey
ALTER TABLE "student_guardians" DROP CONSTRAINT "student_guardians_guardian_id_fkey";

-- CreateTable
CREATE TABLE "ClassAssignment" (
    "id" UUID NOT NULL,
    "claas_id" UUID NOT NULL,
    "teacher_id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "start_date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMPTZ,

    CONSTRAINT "ClassAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClassAssignment_claas_id_idx" ON "ClassAssignment"("claas_id");

-- CreateIndex
CREATE INDEX "ClassAssignment_school_id_idx" ON "ClassAssignment"("school_id");

-- CreateIndex
CREATE INDEX "ClassAssignment_teacher_id_idx" ON "ClassAssignment"("teacher_id");

-- CreateIndex
CREATE INDEX "ClassAssignment_academic_year_id_idx" ON "ClassAssignment"("academic_year_id");

-- CreateIndex
CREATE UNIQUE INDEX "ClassAssignment_claas_id_teacher_id_key" ON "ClassAssignment"("claas_id", "teacher_id");

-- AddForeignKey
ALTER TABLE "ClassAssignment" ADD CONSTRAINT "ClassAssignment_claas_id_fkey" FOREIGN KEY ("claas_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassAssignment" ADD CONSTRAINT "ClassAssignment_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "school_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassAssignment" ADD CONSTRAINT "ClassAssignment_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_guardians" ADD CONSTRAINT "student_guardians_guardian_id_fkey" FOREIGN KEY ("guardian_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
