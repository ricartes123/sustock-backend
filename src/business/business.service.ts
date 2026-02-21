import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BusinessService {
  constructor(private prisma: PrismaService) { }

  async findAllByUser(userId: string) {
    return this.prisma.business.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { teamMembers: { some: { userId } } },
        ],
      },
      select: {
        id: true,
        name: true,
        currency: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async updateCurrency(businessId: string, newCurrency: string, userId: string, conversionRate?: number) {
    // Verificamos que el negocio exista y que el usuario sea el OWNER
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }
    if (business.ownerId !== userId) {
      throw new ForbiddenException('Only the business owner can change the currency');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedBusiness = await tx.business.update({
        where: { id: businessId },
        data: { currency: newCurrency },
      });

      if (conversionRate && conversionRate > 0) {
        // En Prisma updateMany con campos numéricos podemos usar operaciones matemáticas atómicas.
        // Prisma Decimal type soporta multiply.
        await tx.product.updateMany({
          where: { businessId },
          data: {
            price: { multiply: conversionRate }
          }
        });
      }

      return updatedBusiness;
    });
  }
}