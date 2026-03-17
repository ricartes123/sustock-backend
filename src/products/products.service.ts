import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'
import { PaginationDto } from './dto/pagination.dto'
import { Prisma, Product } from '@prisma/client'

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) { }

  async create(data: CreateProductDto, workspaceId: string) {
    return this.prisma.product.create({
      data: {
        name: data.name,
        sku: data.sku,
        barcode: data.barcode,
        costPrice: data.costPrice,
        price: data.price,
        stock: data.stock,
        stockMin: data.stockMin,
        workspaceId,
      },
    })
  }

  async findAll(
    workspaceId: string,
    { page = 1, limit = 10, search, lowStock, status = 'ACTIVE' }: PaginationDto,
  ) {

    const skip = (page - 1) * limit;

    if (lowStock === 'true') {
      // Products where stock <= stockMin (raw query required as Prisma findMany can't compare columns)
      const keyword = search ? `%${search}%` : null;

      const isActiveFilter = status === 'ALL' ? '' : (status === 'ACTIVE' ? `AND "isActive" = true` : `AND "isActive" = false`);

      const rawQuery = search
        ? this.prisma.$queryRawUnsafe<Product[]>(
          `SELECT * FROM "Product" WHERE "workspaceId" = $1 ${isActiveFilter} AND "stock" <= "stockMin" AND ("name" ILIKE $2 OR "sku" ILIKE $2 OR "barcode" ILIKE $2) ORDER BY "createdAt" DESC LIMIT $3 OFFSET $4`,
          workspaceId, keyword, limit, skip
        )
        : this.prisma.$queryRawUnsafe<Product[]>(
          `SELECT * FROM "Product" WHERE "workspaceId" = $1 ${isActiveFilter} AND "stock" <= "stockMin" ORDER BY "createdAt" DESC LIMIT $2 OFFSET $3`,
          workspaceId, limit, skip
        );

      const countQuery = search
        ? this.prisma.$queryRawUnsafe<{ count: bigint }[]>(
          `SELECT COUNT(*) as count FROM "Product" WHERE "workspaceId" = $1 ${isActiveFilter} AND "stock" <= "stockMin" AND ("name" ILIKE $2 OR "sku" ILIKE $2 OR "barcode" ILIKE $2)`,
          workspaceId, keyword
        )
        : this.prisma.$queryRawUnsafe<{ count: bigint }[]>(
          `SELECT COUNT(*) as count FROM "Product" WHERE "workspaceId" = $1 ${isActiveFilter} AND "stock" <= "stockMin"`,
          workspaceId
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

    const whereClause: Prisma.ProductWhereInput = { workspaceId };
    if (status !== 'ALL') {
      whereClause.isActive = status === 'ACTIVE';
    }

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


  async findOne(productId: string, workspaceId: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        workspaceId,
        isActive: true,
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
    workspaceId: string,
  ) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        workspaceId,
        isActive: true,
      },
    })

    if (!product) {
      throw new NotFoundException('Product not found')
    }

    return this.prisma.product.update({
      where: { id: product.id },
      data: {
        name: data.name,
        sku: data.sku,
        barcode: data.barcode,
        costPrice: data.costPrice,
        price: data.price,
        stock: data.stock,
        stockMin: data.stockMin,
        isActive: data.isActive
      },
    })
  }

  async remove(productId: string, workspaceId: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        workspaceId,
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