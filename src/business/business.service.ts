import { Injectable } from '@nestjs/common';
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
}