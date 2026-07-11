-- CreateTable
CREATE TABLE "sms_wallets" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sms_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sms_wallets_school_id_key" ON "sms_wallets"("school_id");

-- AddForeignKey
ALTER TABLE "sms_wallets" ADD CONSTRAINT "sms_wallets_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
