import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InviteMemberDto } from './dto/invite-member.dto';
import { Role } from '@prisma/client';

@Injectable()
export class TeamService {
    constructor(private prisma: PrismaService) { }

    async listMembers(businessId: string) {
        return this.prisma.teamMember.findMany({
            where: { businessId },
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

    async inviteMember(businessId: string, data: InviteMemberDto) {
        // Find user by email
        const user = await this.prisma.user.findUnique({
            where: { email: data.email },
        });

        if (!user) {
            throw new NotFoundException('User with this email not found');
        }

        // Check if member already exists in business team
        const existingMember = await this.prisma.teamMember.findUnique({
            where: {
                userId_businessId: {
                    userId: user.id,
                    businessId,
                },
            },
        });

        if (existingMember) {
            throw new ConflictException('User is already a team member of this business');
        }

        // Check if user is owner
        const business = await this.prisma.business.findUnique({
            where: { id: businessId },
        });

        if (business?.ownerId === user.id) {
            throw new ConflictException('User is the owner of this business');
        }

        return this.prisma.teamMember.create({
            data: {
                userId: user.id,
                businessId,
                role: data.role || Role.STAFF,
            },
        });
    }

    async removeMember(businessId: string, memberId: string) {
        const member = await this.prisma.teamMember.findFirst({
            where: { id: memberId, businessId },
        });

        if (!member) {
            throw new NotFoundException('Team member not found');
        }

        await this.prisma.teamMember.delete({
            where: { id: member.id },
        });

        return { message: 'Team member removed successfully' };
    }
}
