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
        sku: data.sku,
        barcode: data.barcode,
        price: data.price,
        stock: data.stock,
        businessId,
      },
    })
  }

  async findAll(
    businessId: string,
    { page = 1, limit = 10, search, lowStock }: PaginationDto,
  ) {

    const skip = (page - 1) * limit;

    if (lowStock === 'true') {
      // Products where stock <= stockMin (raw query required as Prisma findMany can't compare columns)
      const keyword = search ? `%${search}%` : null;

      const rawQuery = search
        ? this.prisma.$queryRawUnsafe<any[]>(
          `SELECT * FROM "Product" WHERE "businessId" = $1 AND "isActive" = true AND "stock" <= "stockMin" AND ("name" ILIKE $2 OR "sku" ILIKE $2 OR "barcode" ILIKE $2) ORDER BY "createdAt" DESC LIMIT $3 OFFSET $4`,
          businessId, keyword, limit, skip
        )
        : this.prisma.$queryRawUnsafe<any[]>(
          `SELECT * FROM "Product" WHERE "businessId" = $1 AND "isActive" = true AND "stock" <= "stockMin" ORDER BY "createdAt" DESC LIMIT $2 OFFSET $3`,
          businessId, limit, skip
        );

      const countQuery = search
        ? this.prisma.$queryRawUnsafe<{ count: bigint }[]>(
          `SELECT COUNT(*) as count FROM "Product" WHERE "businessId" = $1 AND "isActive" = true AND "stock" <= "stockMin" AND ("name" ILIKE $2 OR "sku" ILIKE $2 OR "barcode" ILIKE $2)`,
          businessId, keyword
        )
        : this.prisma.$queryRawUnsafe<{ count: bigint }[]>(
          `SELECT COUNT(*) as count FROM "Product" WHERE "businessId" = $1 AND "isActive" = true AND "stock" <= "stockMin"`,
          businessId
        );

      const [products, countResult] = await Promise.all([rawQuery, countQuery]);
      const total = Number(countResult[0].count);

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

    const whereClause: any = { businessId, isActive: true };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({
        where: whereClause,
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
        isActive: true,
      },
    })

    if (!product) {
      throw new NotFoundException('Product not found')
    }

    return product
  }

  async getProductMovements(productId: string, businessId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, businessId, isActive: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.movement.findMany({
      where: {
        productId,
        businessId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
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
        isActive: true,
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
        isActive: true,
      },
    })

    if (!product) {
      throw new NotFoundException('Product not found')
    }

    await this.prisma.product.update({
      where: { id: product.id },
      data: { isActive: false },
    })

    return { message: 'Product successfully archived' }
  }
}