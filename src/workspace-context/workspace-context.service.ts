import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class WorkspaceContextService {
    constructor(private prisma: PrismaService) { }

    async getWorkspaceOrThrow(userId: string) {
        const workspace = await this.prisma.workspace.findFirst({
            where: { ownerId: userId },
        })

        if (!workspace) {
            throw new NotFoundException('Workspace not found')
        }

        return workspace
    }
}