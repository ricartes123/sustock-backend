import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { TeamService } from './team.service';
import { InviteMemberDto } from './dto/invite-member.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BusinessGuard } from '../business-context/business.guard';
import { CurrentBusiness } from '../business-context/current-business.decorator';
import type { Business } from '@prisma/client';

@Controller('team')
@UseGuards(JwtAuthGuard, BusinessGuard)
export class TeamController {
    constructor(private readonly teamService: TeamService) { }

    @Get()
    listMembers(@CurrentBusiness() business: Business) {
        return this.teamService.listMembers(business.id);
    }

    @Post('invite')
    inviteMember(
        @CurrentBusiness() business: Business,
        @Body() data: InviteMemberDto,
    ) {
        return this.teamService.inviteMember(business.id, data);
    }

    @Delete(':id')
    removeMember(
        @CurrentBusiness() business: Business,
        @Param('id') memberId: string,
    ) {
        return this.teamService.removeMember(business.id, memberId);
    }
}
