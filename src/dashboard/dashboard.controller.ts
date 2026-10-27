import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { DashboardService } from './dashboard.service'
import { DashboardQueryDto } from './dto/dashboard-query.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { WorkspaceGuard } from '../workspace-context/workspace.guard'
import { CurrentWorkspace } from '../workspace-context/current-workspace.decorator'
import type { Workspace } from '@prisma/client'
import { APP_ROUTES } from '../app.routes'

@Controller(APP_ROUTES.DASHBOARD.ROOT)
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class DashboardController {
    constructor(private dashboardService: DashboardService) { }

    @Get()
    getOverview(@CurrentWorkspace() workspace: Workspace, @Query() query: DashboardQueryDto) {
        return this.dashboardService.getOverview(workspace.id, query.tz)
    }
}