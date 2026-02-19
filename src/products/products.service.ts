import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateProductDto } from './dto/create-product.dto'

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  private async getBusinessOrThrow(userId: string) {
    const business = await this.prisma.business.findFirst({
      where: { ownerId: userId },
    })

    if (!business) {
      throw new NotFoundException('Business not found for this user')
    }

    return business
  }

  async create(data: CreateProductDto, userId: string) {
    const business = await this.prisma.business.findFirst({
      where: { ownerId: userId },
    })

    return this.prisma.product.create({
      data: {
        name: data.name,
        price: data.price,
        stock: data.stock,
        businessId: business!.id,
      },
    })
  }

  async findAll(userId: string) {
    const business = await this.prisma.business.findFirst({
      where: { ownerId: userId },
    })

    return this.prisma.product.findMany({
      where: { businessId: business!.id },
    })
  }

}