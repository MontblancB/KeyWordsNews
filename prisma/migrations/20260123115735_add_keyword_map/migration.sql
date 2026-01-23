-- CreateTable
CREATE TABLE "KeywordMap" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "newsCount" INTEGER NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "provider" TEXT NOT NULL,

    CONSTRAINT "KeywordMap_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KeywordMap_cacheKey_key" ON "KeywordMap"("cacheKey");

-- CreateIndex
CREATE INDEX "KeywordMap_cacheKey_idx" ON "KeywordMap"("cacheKey");

-- CreateIndex
CREATE INDEX "KeywordMap_expiresAt_idx" ON "KeywordMap"("expiresAt");
