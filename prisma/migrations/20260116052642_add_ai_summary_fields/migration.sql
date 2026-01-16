-- AlterTable
ALTER TABLE "News" ADD COLUMN     "aiKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "aiProvider" TEXT,
ADD COLUMN     "aiSummarizedAt" TIMESTAMP(3),
ADD COLUMN     "aiSummary" TEXT;

-- CreateIndex
CREATE INDEX "News_aiSummarizedAt_idx" ON "News"("aiSummarizedAt");
