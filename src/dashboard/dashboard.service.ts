import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class DashboardService {
    constructor(
        private prisma: PrismaService,
    ) { }

    async getOverview(businessId: string) {
        const totalProducts = await this.prisma.product.count({
            where: { businessId },
        })

        const aggregate = await this.prisma.product.aggregate({
            where: { businessId },
            _sum: {
                stock: true,
            },
        })

        const products = await this.prisma.product.findMany({
            where: { businessId },
            select: {
                price: true,
                stock: true,
            },
        })

        const totalStockValue = products.reduce(
            (sum, product) => sum + product.price * product.stock,
            0,
        )

        const lowStockCount = await this.prisma.product.count({
            where: {
                businessId,
                stock: { lte: 3 },
            },
        })

        const totalMovements = await this.prisma.movement.count({
            where: { businessId },
        })

        return {
            totalProducts,
            totalStockValue,
            lowStockCount,
            totalMovements,
        }
    }
}