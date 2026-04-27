import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { SaleStatus } from '@prisma/client'

@Injectable()
export class DashboardService {
    constructor(
        private prisma: PrismaService,
    ) { }

    async getOverview(workspaceId: string) {
        const workspace = await this.prisma.workspace.findUnique({
            where: { id: workspaceId },
            select: { currency: true },
        });

        if (!workspace) {
            throw new NotFoundException('Workspace not found');
        }

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [
            totalProducts,
            totalStockValueResult,
            lowStockResult,
            salesTodayCount,
            salesTodayResult,
            monthlyMovements,
            recentSales,
            recentMovements,
            noPriceCount,
            noSales30DaysResult,
            topProductsResult,
            lowStockProductsResult
        ] = await Promise.all([

            // 1. Total active products
            this.prisma.product.count({
                where: {
                    workspaceId,
                    isActive: true,
                },
            }),

            // 2. Total stock value
            this.prisma.$queryRaw<{ total: number }[]>`
                SELECT SUM(price * stock) as total
                FROM "Product"
                WHERE "workspaceId" = ${workspaceId}
                AND "isActive" = true
            `,

            // 3. Low stock count
            this.prisma.$queryRaw<{ count: number }[]>`
                SELECT COUNT(*)::int as count
                FROM "Product"
                WHERE "workspaceId" = ${workspaceId}
                AND "isActive" = true
                AND "stock" <= "stockMin"
            `,

            // 4. Sales today count
            this.prisma.sale.count({
                where: {
                    workspaceId,
                    createdAt: { gte: startOfToday },
                    status: { not: SaleStatus.CANCELLED }
                }
            }),

            // 5. Sales today total
            this.prisma.sale.aggregate({
                where: {
                    workspaceId,
                    createdAt: { gte: startOfToday },
                    status: { not: SaleStatus.CANCELLED }
                },
                _sum: { totalAmount: true }
            }),

            // 6. Monthly movements
            this.prisma.movement.count({
                where: {
                    workspaceId,
                    createdAt: { gte: startOfMonth }
                }
            }),

            // 7. Recent sales
            this.prisma.sale.findMany({
                where: { workspaceId },
                include: {
                    client: { select: { name: true } }
                },
                orderBy: { createdAt: 'desc' },
                take: 5
            }),

            // 8. Recent movements
            this.prisma.movement.findMany({
                where: { workspaceId },
                include: {
                    product: { select: { name: true } },
                    user: { select: { email: true, firstName: true } },
                },
                orderBy: { createdAt: 'desc' },
                take: 5,
            }),

            // 9. Products without price
            this.prisma.product.count({
                where: {
                    workspaceId,
                    isActive: true,
                    price: 0
                }
            }),

            // 10. Products without sales in 30 days
            this.prisma.$queryRaw<{ count: number }[]>`
                SELECT COUNT(*)::int as count
                FROM "Product" p
                WHERE p."workspaceId" = ${workspaceId}
                AND p."isActive" = true
                AND NOT EXISTS (
                    SELECT 1 FROM "SaleItem" si
                    JOIN "Sale" s ON s.id = si."saleId"
                    WHERE si."productId" = p.id
                    AND s."createdAt" >= ${thirtyDaysAgo}
                )
            `,

            // 11. Top selling products
            this.prisma.$queryRaw<{ id: string, name: string, totalSold: number }[]>`
                SELECT p.id, p.name, COALESCE(SUM(si.quantity), 0)::int as "totalSold"
                FROM "Product" p
                JOIN "SaleItem" si ON si."productId" = p.id
                JOIN "Sale" s ON s.id = si."saleId"
                WHERE p."workspaceId" = ${workspaceId}
                GROUP BY p.id, p.name
                ORDER BY "totalSold" DESC
                LIMIT 5
            `,

            // 12. Low stock products list
            this.prisma.$queryRaw<{ id: string, name: string, stock: number, stockMin: number }[]>`
                SELECT p.id, p.name, p.stock, p."stockMin"
                FROM "Product" p
                WHERE p."workspaceId" = ${workspaceId}
                AND p."isActive" = true
                AND p.stock <= p."stockMin"
                ORDER BY p.stock ASC
                LIMIT 5
            `
        ]);

        return {
            currency: workspace.currency,
            totalProducts,
            totalStockValue: Number(totalStockValueResult[0]?.total ?? 0),

            // New UI Bloque 1
            salesToday: Number(salesTodayResult._sum.totalAmount ?? 0),
            salesTodayCount,
            lowStockCount: Number(lowStockResult[0]?.count ?? 0),
            monthlyMovements,

            // Bloque 3
            recentSales,
            recentMovements,
            topProducts: topProductsResult.map(p => ({ ...p, totalSold: Number(p.totalSold) })),
            lowStockProducts: lowStockProductsResult.map(p => ({ ...p, stock: Number(p.stock), stockMin: Number(p.stockMin) })),

            // Bloque 4 (Alerts - if still needed by frontend)
            alerts: {
                lowStock: Number(lowStockResult[0]?.count ?? 0),
                noPrice: noPriceCount,
                noSales30Days: Number(noSales30DaysResult[0]?.count ?? 0)
            }
        };
    }
}
