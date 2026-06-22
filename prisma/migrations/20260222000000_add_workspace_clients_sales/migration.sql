-- Rename Business -> Workspace
ALTER TABLE "Business" RENAME TO "Workspace";
ALTER TABLE "Workspace" RENAME CONSTRAINT "Business_pkey" TO "Workspace_pkey";
ALTER TABLE "Workspace" RENAME CONSTRAINT "Business_ownerId_fkey" TO "Workspace_ownerId_fkey";
ALTER INDEX "Business_ownerId_idx" RENAME TO "Workspace_ownerId_idx";

-- TeamMember: businessId -> workspaceId
ALTER TABLE "TeamMember" RENAME COLUMN "businessId" TO "workspaceId";
ALTER TABLE "TeamMember" RENAME CONSTRAINT "TeamMember_businessId_fkey" TO "TeamMember_workspaceId_fkey";
ALTER INDEX "TeamMember_businessId_idx" RENAME TO "TeamMember_workspaceId_idx";
ALTER INDEX "TeamMember_userId_businessId_key" RENAME TO "TeamMember_userId_workspaceId_key";

-- Product: add costPrice, rename businessId -> workspaceId
ALTER TABLE "Product" ADD COLUMN "costPrice" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "Product" RENAME COLUMN "businessId" TO "workspaceId";
ALTER TABLE "Product" RENAME CONSTRAINT "Product_businessId_fkey" TO "Product_workspaceId_fkey";
ALTER INDEX "Product_businessId_idx" RENAME TO "Product_workspaceId_idx";

-- Movement: rename businessId -> workspaceId, add saleId column
ALTER TABLE "Movement" RENAME COLUMN "businessId" TO "workspaceId";
ALTER TABLE "Movement" RENAME CONSTRAINT "Movement_businessId_fkey" TO "Movement_workspaceId_fkey";
ALTER INDEX "Movement_businessId_idx" RENAME TO "Movement_workspaceId_idx";
ALTER TABLE "Movement" ADD COLUMN "saleId" TEXT;

-- CreateTable Client
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Client_workspaceId_idx" ON "Client"("workspaceId");

ALTER TABLE "Client" ADD CONSTRAINT "Client_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable Sale (status/cancelledAt are added right after by the existing 20260423000001_add_sale_status migration)
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "clientId" TEXT,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Sale_workspaceId_idx" ON "Sale"("workspaceId");
CREATE INDEX "Sale_clientId_idx" ON "Sale"("clientId");
CREATE INDEX "Sale_userId_idx" ON "Sale"("userId");

ALTER TABLE "Sale" ADD CONSTRAINT "Sale_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable SaleItem
CREATE TABLE "SaleItem" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "unitCost" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "SaleItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SaleItem_saleId_idx" ON "SaleItem"("saleId");
CREATE INDEX "SaleItem_productId_idx" ON "SaleItem"("productId");

ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey Movement.saleId (now that Sale exists)
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;
