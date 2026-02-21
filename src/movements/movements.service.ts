import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateMovementDto } from './dto/create-movement.dto'
import { MovementType, Prisma } from '@prisma/client'

@Injectable()
export class MovementsService {
    constructor(
        private prisma: PrismaService,
    ) { }

    async create(data: CreateMovementDto, businessId: string) {
        return this.prisma.$transaction(async (tx) => {

            if (data.quantity <= 0) {
                throw new BadRequestException('Quantity must be greater than zero')
            }

            const product = await tx.product.findFirst({
                where: {
                    id: data.productId,
                    businessId,
                    isActive: true,
                },
            })

            if (!product) {
                throw new NotFoundException('Active product not found')
            }

            let newStock = product.stock

            if (data.type === MovementType.IN) {
                newStock += data.quantity
            }

            if (data.type === MovementType.OUT) {
                if (product.stock < data.quantity) {
                    throw new BadRequestException('Insufficient stock')
                }
                newStock -= data.quantity
            }

            if (data.type === MovementType.ADJUSTMENT) {
                newStock = data.quantity
            }

            const movement = await tx.movement.create({
                data: {
                    type: data.type,
                    quantity: data.quantity,
                    reason: data.reason,
                    productId: product.id,
                    businessId,
                },
            })

            await tx.product.update({
                where: { id: product.id },
                data: { stock: newStock },
            })

            return movement
        })
    }

    async findAll(
        businessId: string,
        page = 1,
        limit = 10,
        startDate?: Date,
        endDate?: Date,
        type?: MovementType,
    ) {
        limit = Math.min(limit, 100)
        page = Math.max(page, 1)

        const skip = (page - 1) * limit

        const where: Prisma.MovementWhereInput = {
            businessId,
        }

        if (startDate || endDate) {
            where.createdAt = {}

            if (startDate) {
                where.createdAt.gte = startDate
            }

            if (endDate) {
                where.createdAt.lte = endDate
            }
        }

        if (type) {
            where.type = type
        }

        const [data, total] = await this.prisma.$transaction([
            this.prisma.movement.findMany({
                where,
                include: {
                    product: {
                        select: { name: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.movement.count({ where }),
        ])

        return {
            data,
            meta: {
                total,
                page,
                lastPage: Math.ceil(total / limit),
            },
        }
    }

    async getStockRotation(businessId: string) {
        const last30Days = new Date()
        last30Days.setDate(last30Days.getDate() - 30)

        const grouped = await this.prisma.movement.groupBy({
            by: ['productId'],
            where: {
                businessId,
                type: MovementType.OUT,
                createdAt: { gte: last30Days },
            },
            _sum: { quantity: true },
        })

        const products = await this.prisma.product.findMany({
            where: {
                id: { in: grouped.map(g => g.productId) },
            },
            select: {
                id: true,
                name: true,
            },
        })

        return grouped.map(g => {
            const product = products.find(p => p.id === g.productId)
            return {
                productId: g.productId,
                productName: product?.name,
                quantitySoldLast30Days: g._sum.quantity ?? 0,
            }
        })
    }
} 