import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'
import { BusinessContextService } from '../business-context/business-context.service'

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private businessContextService: BusinessContextService,
  ) {}

  async create(data: CreateProductDto, userId: string) {
    const business =
      await this.businessContextService.getBusinessOrThrow(userId)

    return this.prisma.product.create({
      data: {
        name: data.name,
        price: data.price,
        stock: data.stock,
        businessId: business.id,
      },
    })
  }

  async findAll(userId: string) {
    const business =
      await this.businessContextService.getBusinessOrThrow(userId)

    return this.prisma.product.findMany({
      where: { businessId: business.id },
    })
  }

  async findOne(productId: string, userId: string) {
    const business =
      await this.businessContextService.getBusinessOrThrow(userId)

    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        businessId: business.id,
      },
    })

    if (!product) {
      throw new NotFoundException('Product not found')
    }

    return product
  }

  async update(productId: string, data: UpdateProductDto, userId: string) {
    const business =
      await this.businessContextService.getBusinessOrThrow(userId)

    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        businessId: business.id,
      },
    })

    if (!product) {
      throw new NotFoundException('Product not found')
    }

    return this.prisma.product.update({
      where: { id: product.id },
      data,
    })
  }

  async remove(productId: string, userId: string) {
    const business =
      await this.businessContextService.getBusinessOrThrow(userId)

    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        businessId: business.id,
      },
    })

    if (!product) {
      throw new NotFoundException('Product not found')
    }

    await this.prisma.product.delete({
      where: { id: product.id },
    })

    return { message: 'Product deleted successfully' }
  }
}