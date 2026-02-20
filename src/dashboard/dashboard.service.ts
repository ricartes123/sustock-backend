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
            lowStockCount,
            totalMovements,
            totalStockValueResult
        ] = await Promise.all([

            this.prisma.product.count({
                where: { businessId },
            }),

            this.prisma.product.count({
                where: {
                    businessId,
                    stock: { lte: 3 },
                },
            }),

            this.prisma.movement.count({
                where: { businessId },
            }),

            this.prisma.$queryRaw<
                { total: number }[]
            >`
                SELECT SUM(price * stock) as total
                FROM "Product"
                WHERE "businessId" = ${businessId}
                `,
        ]);

        const totalStockValue = Number(
            totalStockValueResult[0]?.total ?? 0
        );

        return {
            currency: business.currency,
            totalProducts,
            totalStockValue,
            lowStockCount,
            totalMovements,
        };
    }
}