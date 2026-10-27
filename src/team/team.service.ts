import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InviteMemberDto } from './dto/invite-member.dto';
import { Role } from '@prisma/client';

@Injectable()
export class TeamService {
    constructor(private prisma: PrismaService) { }

    async listMembers(workspaceId: string) {
        return this.prisma.teamMember.findMany({
            where: { workspaceId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
            },
        });
    }

    async inviteMember(workspaceId: string, data: InviteMemberDto, actorRole: Role) {
        const role = data.role || Role.STAFF;

        if (role === Role.OWNER) {
            throw new ForbiddenException('Members cannot be invited as OWNER');
        }

        if (role === Role.ADMIN && actorRole !== Role.OWNER) {
            throw new ForbiddenException('Only the owner can invite admins');
        }

        // Find user by email
        const user = await this.prisma.user.findUnique({
            where: { email: data.email },
        });

        if (!user) {
            throw new NotFoundException('User with this email not found');
        }

        // Check if member already exists in workspace team
        const existingMember = await this.prisma.teamMember.findUnique({
            where: {
                userId_workspaceId: {
                    userId: user.id,
                    workspaceId,
                },
            },
        });

        if (existingMember) {
            throw new ConflictException('User is already a team member of this workspace');
        }

        // Check if user is owner
        const workspace = await this.prisma.workspace.findUnique({
            where: { id: workspaceId },
        });

        if (workspace?.ownerId === user.id) {
            throw new ConflictException('User is the owner of this workspace');
        }

        return this.prisma.teamMember.create({
            data: {
                userId: user.id,
                workspaceId,
                role,
            },
        });
    }

    async removeMember(workspaceId: string, memberId: string, actorRole: Role) {
        const member = await this.prisma.teamMember.findFirst({
            where: { id: memberId, workspaceId },
        });

        if (!member) {
            throw new NotFoundException('Team member not found');
        }

        if (member.role !== Role.STAFF && actorRole !== Role.OWNER) {
            throw new ForbiddenException('Only the owner can remove admins');
        }

        await this.prisma.teamMember.delete({
            where: { id: member.id },
        });

        return { message: 'Team member removed successfully' };
    }
}
