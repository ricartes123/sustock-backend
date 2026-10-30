import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkspaceService {
  constructor(private prisma: PrismaService) { }

  async findAllByUser(userId: string) {
    return this.prisma.workspace.findMany({
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

  async updateCurrency(workspaceId: string, newCurrency: string, userId: string, conversionRate?: number) {
    // Verificamos que el negocio exista y que el usuario sea el OWNER
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }
    if (workspace.ownerId !== userId) {
      throw new ForbiddenException('Only the workspace owner can change the currency');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedWorkspace = await tx.workspace.update({
        where: { id: workspaceId },
        data: { currency: newCurrency },
      });

      if (conversionRate && conversionRate > 0) {
        // Cost must follow price, otherwise margins and invested money mix two currencies
        await tx.product.updateMany({
          where: { workspaceId },
          data: {
            price: { multiply: conversionRate },
            costPrice: { multiply: conversionRate },
          }
        });
      }

      return updatedWorkspace;
    });
  }
}