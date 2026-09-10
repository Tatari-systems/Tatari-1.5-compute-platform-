-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "ClientRequirement" (
    "id" UUID NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "companyWebsite" TEXT,
    "workloadType" TEXT NOT NULL,
    "gpuModel" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "region" TEXT NOT NULL,
    "timeframeStart" TIMESTAMPTZ(3) NOT NULL,
    "timeframeEnd" TIMESTAMPTZ(3) NOT NULL,
    "budgetMinUsd" DECIMAL(18,2),
    "budgetMaxUsd" DECIMAL(18,2) NOT NULL,
    "minimumUptimeBps" INTEGER NOT NULL,
    "slaNotes" TEXT,
    "mustHaves" JSONB NOT NULL,
    "niceToHaves" JSONB NOT NULL,
    "additionalNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ClientRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GpuSupply" (
    "id" UUID NOT NULL,
    "vendorId" TEXT NOT NULL,
    "gpuModel" TEXT NOT NULL,
    "quantityAvailable" INTEGER NOT NULL,
    "region" TEXT NOT NULL,
    "hourlyPriceUsd" DECIMAL(18,6) NOT NULL,
    "minimumUptimeBps" INTEGER NOT NULL,
    "availableFrom" TIMESTAMPTZ(3) NOT NULL,
    "availableUntil" TIMESTAMPTZ(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'available',
    "sourceType" TEXT NOT NULL,
    "isTestData" BOOLEAN NOT NULL DEFAULT false,
    "sourceReference" TEXT,
    "lastVerifiedAt" TIMESTAMPTZ(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "GpuSupply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" UUID NOT NULL,
    "requirementId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_approval',
    "totalEstimatedCostUsd" DECIMAL(18,2) NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteLineItem" (
    "id" UUID NOT NULL,
    "quoteId" UUID NOT NULL,
    "supplyId" UUID,
    "vendorId" TEXT NOT NULL,
    "gpuModel" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "hourlyPriceUsd" DECIMAL(18,6) NOT NULL,
    "billableHours" INTEGER NOT NULL,
    "supplierSubtotalUsd" DECIMAL(18,2) NOT NULL,
    "marginBps" INTEGER NOT NULL,
    "platformFeeUsd" DECIMAL(18,2) NOT NULL,
    "totalEstimatedCostUsd" DECIMAL(18,2) NOT NULL,
    "minimumUptimeBps" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commitment" (
    "id" UUID NOT NULL,
    "quoteId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_delivery',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Commitment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalUser" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT,
    "role" TEXT NOT NULL DEFAULT 'reviewer',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "InternalUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" UUID,
    "beforeStatus" TEXT,
    "afterStatus" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientRequirement_status_createdAt_idx" ON "ClientRequirement"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ClientRequirement_region_gpuModel_timeframeStart_timeframeE_idx" ON "ClientRequirement"("region", "gpuModel", "timeframeStart", "timeframeEnd");

-- CreateIndex
CREATE INDEX "GpuSupply_status_region_gpuModel_idx" ON "GpuSupply"("status", "region", "gpuModel");

-- CreateIndex
CREATE INDEX "GpuSupply_availableFrom_availableUntil_idx" ON "GpuSupply"("availableFrom", "availableUntil");

-- CreateIndex
CREATE INDEX "GpuSupply_vendorId_idx" ON "GpuSupply"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_requirementId_key" ON "Quote"("requirementId");

-- CreateIndex
CREATE INDEX "Quote_status_createdAt_idx" ON "Quote"("status", "createdAt");

-- CreateIndex
CREATE INDEX "QuoteLineItem_quoteId_idx" ON "QuoteLineItem"("quoteId");

-- CreateIndex
CREATE INDEX "QuoteLineItem_supplyId_idx" ON "QuoteLineItem"("supplyId");

-- CreateIndex
CREATE UNIQUE INDEX "Commitment_quoteId_key" ON "Commitment"("quoteId");

-- CreateIndex
CREATE INDEX "Commitment_status_createdAt_idx" ON "Commitment"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "InternalUser_email_key" ON "InternalUser"("email");

-- CreateIndex
CREATE INDEX "InternalUser_role_isActive_idx" ON "InternalUser"("role", "isActive");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "ClientRequirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteLineItem" ADD CONSTRAINT "QuoteLineItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteLineItem" ADD CONSTRAINT "QuoteLineItem_supplyId_fkey" FOREIGN KEY ("supplyId") REFERENCES "GpuSupply"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commitment" ADD CONSTRAINT "Commitment_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "InternalUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
