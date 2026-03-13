import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateMovementDto } from './dto/create-movement.dto'
import { MovementType, Prisma } from '@prisma/client'

@Injectable()
export class MovementsService {
    constructor(
        private prisma: PrismaService,
    ) { }

    async create(data: CreateMovementDto, workspaceId: string, userId: string) {
        return this.prisma.$transaction(async (tx) => {

            if (data.quantity <= 0) {
                throw new BadRequestException('Quantity must be greater than zero')
            }

            // Lock the product row to prevent race conditions during concurrent movements
            await tx.$executeRaw`SELECT 1 FROM "Product" WHERE id = ${data.productId} FOR UPDATE`;

            const product = await tx.product.findFirst({
                where: {
                    id: data.productId,
                    workspaceId,
                    isActive: true,
                },
            })

            if (!product) {
                throw new NotFoundException('Active product not found')
            }

            let stockUpdate: Prisma.ProductUpdateInput

            if (data.type === MovementType.IN) {
                stockUpdate = { stock: { increment: data.quantity } }
            } else if (data.type === MovementType.OUT) {
                if (product.stock < data.quantity) {
                    throw new BadRequestException(`La acción podría poner en peligro la credibilidad de los datos de su inventario. El stock de ${product.name} quedaría en negativo.`);
                }
                stockUpdate = { stock: { decrement: data.quantity } }
            } else if (data.type === MovementType.ADJUSTMENT) {
                stockUpdate = { stock: data.quantity }
            } else {
                throw new BadRequestException('Invalid movement type')
            }

            const movement = await tx.movement.create({
                data: {
                    type: data.type,
                    quantity: data.quantity,
                    reason: data.reason,
                    productId: product.id,
                    workspaceId,
                    userId,
                },
            })

            await tx.product.update({
                where: { id: product.id },
                data: stockUpdate,
            })

            return movement
        })
    }

    async findAll(
        workspaceId: string,
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
            workspaceId,
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

    async getStockRotation(workspaceId: string) {
        const last30Days = new Date()
        last30Days.setDate(last30Days.getDate() - 30)

        const grouped = await this.prisma.movement.groupBy({
            by: ['productId'],
            where: {
                workspaceId,
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

    async getLast30DaysSummary(workspaceId: string) {
        const last30Days = new Date()
        last30Days.setDate(last30Days.getDate() - 30)

        const movements = await this.prisma.movement.findMany({
            where: {
                workspaceId,
                createdAt: { gte: last30Days },
            },
            select: {
                type: true,
                quantity: true,
                createdAt: true,
            },
        })

        const map = new Map<string, { in: number; out: number }>()

        movements.forEach(m => {
            const date = m.createdAt.toISOString().split('T')[0]

            if (!map.has(date)) {
                map.set(date, { in: 0, out: 0 })
            }

            const entry = map.get(date)!

            if (m.type === 'IN') entry.in += m.quantity
            if (m.type === 'OUT') entry.out += m.quantity
        })

        return Array.from(map.entries())
            .map(([date, values]) => ({
                date,
                ...values,
            }))
            .sort((a, b) => a.date.localeCompare(b.date))
    }
} 