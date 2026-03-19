-- AlterTable
ALTER TABLE "progress_items" ALTER COLUMN "date" TYPE TEXT USING COALESCE(date::TEXT, '');
ALTER TABLE "progress_items" ALTER COLUMN "date" SET DEFAULT '';
ALTER TABLE "progress_items" ALTER COLUMN "date" SET NOT NULL;
