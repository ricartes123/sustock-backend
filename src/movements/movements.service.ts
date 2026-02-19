import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateMovementDto } from './dto/create-movement.dto'
import { MovementType } from '@prisma/client'

@Injectable()
export class MovementsService {
    constructor(private prisma: PrismaService) { }

    private async getBusinessOrThrow(userId: string) {
        const business = await this.prisma.business.findFirst({
            where: { ownerId: userId },
        })

        if (!business) {
            throw new NotFoundException('Business not found')
        }

        return business
    }

    async create(data: CreateMovementDto, userId: string) {
        const business = await this.getBusinessOrThrow(userId)

        return this.prisma.$transaction(async (tx) => {
            const product = await tx.product.findFirst({
                where: {
                    id: data.productId,
                    businessId: business.id,
                },
            })

            if (!product) {
                throw new NotFoundException('Product not found')
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

            await tx.movement.create({
                data: {
                    type: data.type,
                    quantity: data.quantity,
                    productId: product.id,
                    businessId: business.id,
                },
            })

            await tx.product.update({
                where: { id: product.id },
                data: { stock: newStock },
            })

            return { message: 'Movement created successfully' }
        })
    }
}