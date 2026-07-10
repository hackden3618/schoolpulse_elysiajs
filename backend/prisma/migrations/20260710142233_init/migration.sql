/*
  Warnings:

  - You are about to drop the `JoinRequest` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "JoinRequest";

-- CreateTable
CREATE TABLE "join_requests" (
    "id" UUID NOT NULL,
    "school_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "requested_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requested_by" TEXT NOT NULL,
    "status" "JoinRequestStatus" NOT NULL DEFAULT 'pending_review',
    "processed_by" TEXT,
    "processed_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "join_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "join_requests_school_name_phone_key" ON "join_requests"("school_name", "phone");
