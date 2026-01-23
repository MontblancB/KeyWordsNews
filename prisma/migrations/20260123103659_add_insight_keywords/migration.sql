-- AlterTable
ALTER TABLE "News" ADD COLUMN     "aiInsightKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[];
