import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'
import { PaginationDto } from './dto/pagination.dto'
import { Prisma } from '@prisma/client'
import * as XLSX from 'xlsx'
import { isBlank, parseMoney, parseNonNegativeInt } from './import-parsers'

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

    const whereClause: Prisma.ProductWhereInput = { workspaceId };
    if (status !== 'ALL') {
      whereClause.isActive = status === 'ACTIVE';
    }

    if (lowStock === 'true') {
      whereClause.stock = { lte: this.prisma.product.fields.stockMin };
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

  async importProducts(buffer: Buffer, workspaceId: string) {
    let rows: Record<string, unknown>[]
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
    } catch {
      throw new BadRequestException('No se pudo leer el archivo. Asegurate de que sea un Excel (.xlsx) o CSV válido.')
    }

    if (rows.length === 0) {
      throw new BadRequestException('El archivo está vacío o no tiene filas de datos.')
    }

    if (rows.length > 500) {
      throw new BadRequestException('El archivo tiene más de 500 filas. Dividilo en partes más pequeñas.')
    }

    const errors: { row: number; message: string }[] = []
    let created = 0

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2

      const name = String(row['Nombre'] ?? '').trim()
      if (!name) {
        errors.push({ row: rowNum, message: 'El nombre del producto es requerido.' })
        continue
      }

      const price = parseMoney(row['Precio de Venta'])
      const costPrice = isBlank(row['Precio de Costo']) ? new Prisma.Decimal(0) : parseMoney(row['Precio de Costo'])
      const stock = parseNonNegativeInt(row['Stock'])
      const stockMin = isBlank(row['Stock Mínimo']) ? 0 : parseNonNegativeInt(row['Stock Mínimo'])

      if (price === null) {
        errors.push({ row: rowNum, message: `"${name}": Precio de Venta debe ser un número mayor o igual a 0, con hasta 2 decimales.` })
        continue
      }
      if (costPrice === null) {
        errors.push({ row: rowNum, message: `"${name}": Precio de Costo debe ser un número mayor o igual a 0, con hasta 2 decimales.` })
        continue
      }
      if (stock === null) {
        errors.push({ row: rowNum, message: `"${name}": Stock debe ser un número entero mayor o igual a 0.` })
        continue
      }
      if (stockMin === null) {
        errors.push({ row: rowNum, message: `"${name}": Stock Mínimo debe ser un número entero mayor o igual a 0.` })
        continue
      }

      await this.prisma.product.create({
        data: {
          name,
          sku: String(row['SKU'] ?? '').trim() || null,
          barcode: String(row['Código de Barras'] ?? '').trim() || null,
          price,
          costPrice,
          stock,
          stockMin,
          workspaceId,
        },
      })
      created++
    }

    return { created, total: rows.length, errors }
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