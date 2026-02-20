import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'
import { PaginationDto } from './dto/pagination.dto'

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) { }

  async create(data: CreateProductDto, businessId: string) {
    return this.prisma.product.create({
      data: {
        name: data.name,
        price: data.price,
        stock: data.stock,
        businessId,
      },
    })
  }

  async findAll(
    businessId: string,
    { page = 1, limit = 10 }: PaginationDto,
  ) {

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([

      this.prisma.product.findMany({
        where: { businessId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),

      this.prisma.product.count({
        where: { businessId },
      }),

    ]);

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }


  async findOne(productId: string, businessId: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        businessId,
      },
    })

    if (!product) {
      throw new NotFoundException('Product not found')
    }

    return product
  }

  async update(
    productId: string,
    data: UpdateProductDto,
    businessId: string,
  ) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        businessId,
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

  async remove(productId: string, businessId: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        businessId,
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