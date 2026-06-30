-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('trial', 'active', 'cancelled', 'suspended', 'defaulted', 'terminated');

-- CreateEnum
CREATE TYPE "SubscriptionType" AS ENUM ('free', 'monthly', 'termly', 'yearly');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'on_leave', 'suspended', 'defaulted', 'terminated');

-- CreateTable
CREATE TABLE "schools" (
    "id" UUID NOT NULL,
    "school_name" TEXT NOT NULL,
    "school_phone" TEXT NOT NULL,
    "school_address" TEXT,
    "school_logo" TEXT,
    "school_email" TEXT,
    "school_website" TEXT,
    "post_office" TEXT,
    "subscription_status" "SubscriptionStatus" NOT NULL DEFAULT 'trial',
    "subscription_type" "SubscriptionType" NOT NULL DEFAULT 'free',
    "subscription_start_date" TIMESTAMPTZ,
    "subscription_end_date" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "first_name" TEXT NOT NULL,
    "second_name" TEXT,
    "last_name" TEXT,
    "phone" TEXT NOT NULL,
    "hashed_password" TEXT NOT NULL,
    "email" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_memberships" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "school_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_membership_roles" (
    "membership_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,

    CONSTRAINT "school_membership_roles_pkey" PRIMARY KEY ("membership_id","role_id")
);

-- CreateTable
CREATE TABLE "streams" (
    "stream_id" UUID NOT NULL,
    "stream_name" TEXT NOT NULL,
    "school_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "streams_pkey" PRIMARY KEY ("stream_id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" UUID NOT NULL,
    "class_name" TEXT NOT NULL,
    "class_teacher" TEXT NOT NULL,
    "class_level" TEXT NOT NULL,
    "school_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "student_id" UUID NOT NULL,
    "date_of_birth" DATE NOT NULL,
    "admission_number" TEXT NOT NULL,
    "class_id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "first_name" TEXT NOT NULL,
    "second_name" TEXT,
    "last_name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("student_id")
);

-- CreateTable
CREATE TABLE "student_guardians" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "guardian_id" UUID NOT NULL,
    "relationship" TEXT NOT NULL,

    CONSTRAINT "student_guardians_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "school_memberships_school_id_user_id_key" ON "school_memberships"("school_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "classes_id_school_id_key" ON "classes"("id", "school_id");

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
ALTER TABLE "students" ADD CONSTRAINT "students_class_id_school_id_fkey" FOREIGN KEY ("class_id", "school_id") REFERENCES "classes"("id", "school_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_guardians" ADD CONSTRAINT "student_guardians_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("student_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_guardians" ADD CONSTRAINT "student_guardians_guardian_id_fkey" FOREIGN KEY ("guardian_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
