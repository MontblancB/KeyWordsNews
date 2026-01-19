-- AlterTable
ALTER TABLE "News" ADD COLUMN "aiInsight" TEXT;
ALTER TABLE "News" ADD COLUMN "aiInsightExpert" TEXT;
ALTER TABLE "News" ADD COLUMN "aiInsightAt" TIMESTAMP(3);
ALTER TABLE "News" ADD COLUMN "aiInsightProvider" TEXT;

-- CreateIndex
CREATE INDEX "News_aiInsightAt_idx" ON "News"("aiInsightAt");
