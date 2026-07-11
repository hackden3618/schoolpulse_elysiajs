-- Add admin_phone and admin_email to join_requests
ALTER TABLE "join_requests" ADD COLUMN "admin_phone" TEXT NOT NULL DEFAULT '';
ALTER TABLE "join_requests" ADD COLUMN "admin_email" TEXT;
ALTER TABLE "join_requests" ALTER COLUMN "admin_phone" DROP DEFAULT;

-- Re-add unique constraints on users
DELETE FROM "users" WHERE "phone" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "users_phone_key" ON "users"("phone");
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
