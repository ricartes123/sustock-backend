import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(private prisma: PrismaService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const user = request.user

    const workspaceId = request.headers['x-workspace-id'];

    if (typeof workspaceId !== 'string' || !workspaceId) {
      throw new BadRequestException('Missing x-workspace-id header')
    }

    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        OR: [
          { ownerId: user.userId },
          { teamMembers: { some: { userId: user.userId } } },
        ],
      },
    })

    if (!workspace) {
      throw new NotFoundException('Workspace not found or access denied')
    }

    request.workspace = workspace

    return true
  }
}