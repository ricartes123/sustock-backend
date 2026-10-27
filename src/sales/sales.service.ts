import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { MovementType, SaleStatus, Prisma } from '@prisma/client';
import { PaginationDto } from '../products/dto/pagination.dto';
import { SalesQueryDto } from './dto/sales-query.dto';

@Injectable()
export class SalesService {
    constructor(private prisma: PrismaService) { }

    async create(data: CreateSaleDto, workspaceId: string, userId: string) {
        if (!data.items || data.items.length === 0) {
            throw new BadRequestException('Sale must contain at least one item');
        }

        const productIds = data.items.map((item) => item.productId);

        if (new Set(productIds).size !== productIds.length) {
            throw new BadRequestException('Each product can only appear once per sale');
        }

        return this.prisma.$transaction(async (tx) => {
            if (data.clientId) {
                const client = await tx.client.findFirst({
                    where: { id: data.clientId, workspaceId, isActive: true },
                    select: { id: true },
                });

                if (!client) {
                    throw new NotFoundException('Client not found');
                }
            }

            // Lock in a stable order so concurrent sales sharing products cannot deadlock
            for (const productId of [...productIds].sort()) {
                await tx.$executeRaw`SELECT 1 FROM "Product" WHERE id = ${productId} AND "workspaceId" = ${workspaceId} FOR UPDATE`;
            }

            const products = await tx.product.findMany({
                where: { id: { in: productIds }, workspaceId, isActive: true },
            });
            const productsById = new Map(products.map((product) => [product.id, product]));

            let totalAmount = new Prisma.Decimal(0);
            const saleItemsCreate: Prisma.SaleItemCreateManySaleInput[] = [];

            for (const item of data.items) {
                const product = productsById.get(item.productId);

                if (!product) {
                    throw new NotFoundException(`Product not found`);
                }

                if (product.stock < item.quantity) {
                    throw new BadRequestException(`Stock insuficiente de "${product.name}". Stock actual: ${product.stock} unidades.`);
                }

                const unitPrice = item.unitPrice !== undefined ? new Prisma.Decimal(item.unitPrice) : product.price;

                if (unitPrice.greaterThan(product.price)) {
                    throw new BadRequestException(`El precio de "${product.name}" no puede superar el precio de lista.`);
                }

                totalAmount = totalAmount.plus(unitPrice.times(item.quantity));

                saleItemsCreate.push({
                    productId: product.id,
                    quantity: item.quantity,
                    price: unitPrice,
                    unitCost: product.costPrice,
                });

                await tx.product.update({
                    where: { id: product.id },
                    data: { stock: { decrement: item.quantity } },
                });
            }

            const sale = await tx.sale.create({
                data: {
                    totalAmount,
                    clientId: data.clientId || null,
                    workspaceId,
                    userId,
                    items: { create: saleItemsCreate },
                },
                include: {
                    items: {
                        include: { product: true },
                    },
                    client: {
                        select: { name: true, phone: true, email: true },
                    },
                    user: { select: { firstName: true, lastName: true, email: true } },
                },
            });

            await tx.movement.createMany({
                data: saleItemsCreate.map((item) => ({
                    type: MovementType.OUT,
                    quantity: item.quantity,
                    reason: 'Venta',
                    productId: item.productId,
                    workspaceId,
                    userId,
                    saleId: sale.id,
                })),
            });

            return sale;
        });
    }

    async findAll(workspaceId: string, query: SalesQueryDto = {}) {
        const { page = 1, limit = 10, search, status, startDate, endDate, minAmount, maxAmount } = query;
        const skip = (page - 1) * limit;
        const whereClause: Prisma.SaleWhereInput = { workspaceId };

        if (status && status !== 'ALL') {
            whereClause.status = status as any;
        }

        if (search) {
            whereClause.OR = [
                {
                    client: {
                        name: {
                            contains: search,
                            mode: 'insensitive',
                        },
                    },
                },
                {
                    client: {
                        email: {
                            contains: search,
                            mode: 'insensitive',
                        },
                    },
                },
            ];
        }

        if (startDate || endDate) {
            whereClause.createdAt = {};
            if (startDate) {
                whereClause.createdAt.gte = new Date(`${startDate}T00:00:00.000Z`);
            }
            if (endDate) {
                whereClause.createdAt.lte = new Date(`${endDate}T23:59:59.999Z`);
            }
        }

        if (minAmount !== undefined || maxAmount !== undefined) {
            whereClause.totalAmount = {};
            if (minAmount !== undefined) {
                whereClause.totalAmount.gte = new Prisma.Decimal(minAmount);
            }
            if (maxAmount !== undefined) {
                whereClause.totalAmount.lte = new Prisma.Decimal(maxAmount);
            }
        }

        const [sales, total] = await Promise.all([
            this.prisma.sale.findMany({
                where: whereClause,
                skip,
                take: limit,
                include: {
                    client: {
                        select: { name: true, phone: true, email: true },
                    },
                    user: { select: { firstName: true, lastName: true, email: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.sale.count({ where: whereClause }),
        ]);

        return {
            data: sales,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    async findOne(id: string, workspaceId: string) {
        const sale = await this.prisma.sale.findFirst({
            where: { id, workspaceId },
            include: {
                items: {
                    include: {
                        product: true,
                    }
                },
                client: {
                    select: {
                        name: true,
                        phone: true,
                        email: true,
                    }
                },
                user: { select: { firstName: true, lastName: true, email: true } },
            },
        });

        if (!sale) {
            throw new NotFoundException('Sale not found');
        }

        return sale;
    }

    async remove(id: string, workspaceId: string, userId: string) {
        return this.prisma.$transaction(async (tx) => {
            const sale = await tx.sale.findFirst({
                where: { id, workspaceId },
                include: { items: true },
            });

            if (!sale) {
                throw new NotFoundException('Sale not found');
            }

            if (sale.status === SaleStatus.CANCELLED) {
                throw new BadRequestException('Sale is already cancelled');
            }

            for (const item of sale.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { increment: item.quantity } },
                });

                await tx.movement.create({
                    data: {
                        type: MovementType.IN,
                        quantity: item.quantity,
                        reason: 'Anulación de Venta',
                        productId: item.productId,
                        workspaceId,
                        userId,
                        saleId: sale.id,
                    },
                });
            }

            return tx.sale.update({
                where: { id: sale.id },
                data: {
                    status: SaleStatus.CANCELLED,
                    cancelledAt: new Date(),
                },
            });
        });
    }

    async findOneClient(clientId: string, workspaceId: string, { page = 1, limit = 10 }: PaginationDto) {
        const skip = (page - 1) * limit;
        const whereClause: Prisma.SaleWhereInput = { workspaceId, clientId };

        const [sales, total, stats] = await Promise.all([
            this.prisma.sale.findMany({
                where: whereClause,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    items: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    barcode: true,
                                }
                            }
                        }
                    },
                    user: { select: { firstName: true, lastName: true, email: true } },
                },
            }),
            this.prisma.sale.count({
                where: whereClause,
            }),
            this.prisma.sale.aggregate({
                where: whereClause,
                _sum: { totalAmount: true },
                _avg: { totalAmount: true }
            })
        ]);

        return {
            data: sales,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                totalAmount: stats._sum.totalAmount || 0,
                averageTicket: stats._avg.totalAmount || 0
            },
        };
    }
}
