import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class DashboardService {
    constructor(
        private prisma: PrismaService,
    ) { }

    async getOverview(businessId: string) {
        const business = await this.prisma.business.findUnique({
            where: { id: businessId },
            select: { currency: true },
        });

        if (!business) {
            throw new NotFoundException('Business not found');
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
                    businessId,
                    isActive: true,
                },
            }),

            this.prisma.movement.count({
                where: { businessId },
            }),

            this.prisma.$queryRaw<{ total: number }[]>`
                SELECT SUM(price * stock) as total
                FROM "Product"
                WHERE "businessId" = ${businessId}
                AND "isActive" = true
            `,

            this.prisma.$queryRaw<{ count: number }[]>`
                SELECT COUNT(*)::int as count
                FROM "Product"
                WHERE "businessId" = ${businessId}
                AND "isActive" = true
                AND "stock" <= "stockMin"
            `,

            this.prisma.product.findMany({
                where: { businessId, isActive: true },
                orderBy: { createdAt: 'desc' },
                take: 5,
            }),

            this.prisma.movement.findMany({
                where: { businessId },
                include: {
                    product: { select: { name: true } },
                    user: { select: { email: true } },
                },
                orderBy: { createdAt: 'desc' },
                take: 5,
            })
        ]);

        return {
            currency: business.currency,
            totalProducts,
            totalStockValue: Number(totalStockValueResult[0]?.total ?? 0),
            lowStockCount: Number(lowStockResult[0]?.count ?? 0),
            totalMovements,
            recentProducts,
            recentMovements,
        };
    }
}