import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { TeamService } from './team.service';
import { InviteMemberDto } from './dto/invite-member.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceGuard } from '../workspace-context/workspace.guard';
import { RolesGuard } from '../workspace-context/roles.guard';
import { Roles } from '../workspace-context/roles.decorator';
import { CurrentWorkspace } from '../workspace-context/current-workspace.decorator';
import { CurrentWorkspaceRole } from '../workspace-context/current-workspace-role.decorator';
import { Role } from '@prisma/client';
import type { Workspace } from '@prisma/client';
import { APP_ROUTES } from '../app.routes';

@Controller(APP_ROUTES.TEAM.ROOT)
@UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
export class TeamController {
    constructor(private readonly teamService: TeamService) { }

    @Get()
    listMembers(@CurrentWorkspace() workspace: Workspace) {
        return this.teamService.listMembers(workspace.id);
    }

    @Post(APP_ROUTES.TEAM.INVITE)
    @Roles([Role.OWNER, Role.ADMIN])
    inviteMember(
        @CurrentWorkspace() workspace: Workspace,
        @CurrentWorkspaceRole() actorRole: Role,
        @Body() data: InviteMemberDto,
    ) {
        return this.teamService.inviteMember(workspace.id, data, actorRole);
    }

    @Delete(APP_ROUTES.TEAM.BY_ID)
    @Roles([Role.OWNER, Role.ADMIN])
    removeMember(
        @CurrentWorkspace() workspace: Workspace,
        @CurrentWorkspaceRole() actorRole: Role,
        @Param('id') memberId: string,
    ) {
        return this.teamService.removeMember(workspace.id, memberId, actorRole);
    }
}
