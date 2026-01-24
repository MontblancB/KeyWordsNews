-- CreateTable
CREATE TABLE "Trend" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'south_korea',
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trend_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Trend_collectedAt_country_rank_idx" ON "Trend"("collectedAt", "country", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "Trend_keyword_collectedAt_key" ON "Trend"("keyword", "collectedAt");
