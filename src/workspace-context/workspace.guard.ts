import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { Prisma } from '@prisma/client'

@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(private prisma: PrismaService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const user = request.user

    const workspaceId = request.headers['x-workspace-id'];

    const whereClause: Prisma.WorkspaceWhereInput = {
      OR: [
        { ownerId: user.userId },
        { teamMembers: { some: { userId: user.userId } } },
      ],
    };

    if (workspaceId) {
      whereClause.id = workspaceId;
    }

    const workspace = await this.prisma.workspace.findFirst({
      where: whereClause,
    })

    if (!workspace) {
      throw new NotFoundException('Workspace not found or access denied')
    }

    request.workspace = workspace

    return true
  }
}