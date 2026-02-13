-- AlterTable
ALTER TABLE "Trend" ADD COLUMN "traffic" TEXT;
ALTER TABLE "Trend" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'google_trends_rss';
