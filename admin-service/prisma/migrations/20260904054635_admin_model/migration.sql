-- CreateEnum
CREATE TYPE "PrizeTier" AS ENUM ('GRAND_PRIZE', 'CONSISTENCY_1ST', 'CONSISTENCY_2ND', 'TOP_PERFORMER', 'CATEGORY_1ST', 'CATEGORY_2ND');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('PENDING', 'PASSED', 'FAILED');

-- CreateEnum
CREATE TYPE "WinnerStatus" AS ENUM ('ACTIVE', 'CASCADED');

-- CreateTable
CREATE TABLE "Winner" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tier" "PrizeTier" NOT NULL,
    "category" TEXT,
    "rank" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "status" "WinnerStatus" NOT NULL DEFAULT 'ACTIVE',
    "cascadedFromId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Winner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KycRequest" (
    "id" TEXT NOT NULL,
    "winnerId" TEXT NOT NULL,
    "status" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KycRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Winner_tier_idx" ON "Winner"("tier");

-- CreateIndex
CREATE INDEX "Winner_category_idx" ON "Winner"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Winner_userId_status_key" ON "Winner"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "KycRequest_winnerId_key" ON "KycRequest"("winnerId");

-- AddForeignKey
ALTER TABLE "Winner" ADD CONSTRAINT "Winner_cascadedFromId_fkey" FOREIGN KEY ("cascadedFromId") REFERENCES "Winner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KycRequest" ADD CONSTRAINT "KycRequest_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "Winner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
