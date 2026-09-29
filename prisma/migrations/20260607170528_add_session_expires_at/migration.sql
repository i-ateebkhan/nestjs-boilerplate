-- AlterTable: add expiresAt, backfilling existing rows as already-expired
ALTER TABLE "sessions" ADD COLUMN "expiresAt" TIMESTAMP(3);

UPDATE "sessions" SET "expiresAt" = CURRENT_TIMESTAMP WHERE "expiresAt" IS NULL;

ALTER TABLE "sessions" ALTER COLUMN "expiresAt" SET NOT NULL;
