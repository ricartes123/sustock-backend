-- DropIndex
DROP INDEX "Movement_createdAt_idx";

-- DropIndex
DROP INDEX "Movement_workspaceId_idx";

-- DropIndex
DROP INDEX "Product_isActive_idx";

-- DropIndex
DROP INDEX "Product_workspaceId_idx";

-- DropIndex
DROP INDEX "Sale_status_idx";

-- DropIndex
DROP INDEX "Sale_workspaceId_idx";

-- CreateIndex
CREATE INDEX "Movement_workspaceId_createdAt_idx" ON "Movement"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "Product_workspaceId_isActive_idx" ON "Product"("workspaceId", "isActive");

-- CreateIndex
CREATE INDEX "Sale_workspaceId_createdAt_idx" ON "Sale"("workspaceId", "createdAt");
