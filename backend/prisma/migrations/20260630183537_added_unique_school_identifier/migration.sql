/*
  Warnings:

  - A unique constraint covering the columns `[school_name]` on the table `schools` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "schools_school_name_key" ON "schools"("school_name");
