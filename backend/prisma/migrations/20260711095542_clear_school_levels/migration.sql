/*
  Warnings:

  - The values [mixed] on the enum `school_level` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "school_level_new" AS ENUM ('pre_primary', 'primary', 'hybrid_pri_jsecondary', 'junior_secondary', 'senior_secondary');
ALTER TABLE "public"."schools" ALTER COLUMN "school_level" DROP DEFAULT;
ALTER TABLE "schools" ALTER COLUMN "school_level" TYPE "school_level_new" USING ("school_level"::text::"school_level_new");
ALTER TYPE "school_level" RENAME TO "school_level_old";
ALTER TYPE "school_level_new" RENAME TO "school_level";
DROP TYPE "public"."school_level_old";
ALTER TABLE "schools" ALTER COLUMN "school_level" SET DEFAULT 'hybrid_pri_jsecondary';
COMMIT;

-- AlterTable
ALTER TABLE "schools" ALTER COLUMN "school_level" SET DEFAULT 'hybrid_pri_jsecondary';
