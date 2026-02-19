import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { BusinessContextService } from '../business-context/business-context.service'

@Injectable()
export class DashboardService {
    constructor(
        private prisma: PrismaService,
        private businessContextService: BusinessContextService,
    ) { }

    async getOverview(userId: string) {
        const business = await this.businessContextService.getBusinessOrThrow(userId)

        const totalProducts = await this.prisma.product.count({
            where: { businessId: business.id },
        })

        const aggregate = await this.prisma.product.aggregate({
            where: { businessId: business.id },
            _sum: {
                stock: true,
            },
        })

        const products = await this.prisma.product.findMany({
            where: { businessId: business.id },
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
                businessId: business.id,
                stock: { lte: 3 },
            },
        })

        const totalMovements = await this.prisma.movement.count({
            where: { businessId: business.id },
        })

        return {
            totalProducts,
            totalStockValue,
            lowStockCount,
            totalMovements,
        }
    }
}