import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { TeamService } from './team.service';
import { InviteMemberDto } from './dto/invite-member.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceGuard } from '../workspace-context/workspace.guard';
import { CurrentWorkspace } from '../workspace-context/current-workspace.decorator';
import type { Workspace } from '@prisma/client';

@Controller('team')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class TeamController {
    constructor(private readonly teamService: TeamService) { }

    @Get()
    listMembers(@CurrentWorkspace() workspace: Workspace) {
        return this.teamService.listMembers(workspace.id);
    }

    @Post('invite')
    inviteMember(
        @CurrentWorkspace() workspace: Workspace,
        @Body() data: InviteMemberDto,
    ) {
        return this.teamService.inviteMember(workspace.id, data);
    }

    @Delete(':id')
    removeMember(
        @CurrentWorkspace() workspace: Workspace,
        @Param('id') memberId: string,
    ) {
        return this.teamService.removeMember(workspace.id, memberId);
    }
}
