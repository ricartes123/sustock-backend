import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

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

        const [
            totalProducts,
            totalMovements,
            totalStockValueResult,
            lowStockResult,
            recentProducts,
            recentMovements,
        ] = await Promise.all([

            this.prisma.product.count({
                where: {
                    workspaceId,
                    isActive: true,
                },
            }),

            this.prisma.movement.count({
                where: { workspaceId },
            }),

            this.prisma.$queryRaw<{ total: number }[]>`
                SELECT SUM(price * stock) as total
                FROM "Product"
                WHERE "workspaceId" = ${workspaceId}
                AND "isActive" = true
            `,

            this.prisma.$queryRaw<{ count: number }[]>`
                SELECT COUNT(*)::int as count
                FROM "Product"
                WHERE "workspaceId" = ${workspaceId}
                AND "isActive" = true
                AND "stock" <= "stockMin"
            `,

            this.prisma.product.findMany({
                where: { workspaceId, isActive: true },
                orderBy: { createdAt: 'desc' },
                take: 5,
            }),

            this.prisma.movement.findMany({
                where: { workspaceId },
                include: {
                    product: { select: { name: true } },
                    user: { select: { email: true } },
                },
                orderBy: { createdAt: 'desc' },
                take: 5,
            })
        ]);

        return {
            currency: workspace.currency,
            totalProducts,
            totalStockValue: Number(totalStockValueResult[0]?.total ?? 0),
            lowStockCount: Number(lowStockResult[0]?.count ?? 0),
            totalMovements,
            recentProducts,
            recentMovements,
        };
    }
}