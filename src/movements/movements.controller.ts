import { Controller, Post, Body, UseGuards, Get, Query, Param } from '@nestjs/common'
import { MovementsService } from './movements.service'
import { CreateMovementDto } from './dto/create-movement.dto'
import { MovementsQueryDto } from './dto/movements-query.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { WorkspaceGuard } from '../workspace-context/workspace.guard'
import { CurrentWorkspace } from '../workspace-context/current-workspace.decorator'
import { CurrentUser } from '../auth/current-user.decorator'
import type { AuthenticatedUser } from '../auth/authenticated-user.interface'
import type { Workspace } from '@prisma/client'
import { APP_ROUTES } from '../app.routes'

@Controller(APP_ROUTES.MOVEMENTS.ROOT)
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class MovementsController {
    constructor(private movementsService: MovementsService) { }

    @Post()
    create(
        @Body() data: CreateMovementDto,
        @CurrentWorkspace() workspace: Workspace,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.movementsService.create(data, workspace.id, user.userId)
    }

    @Get()
    findAll(
        @CurrentWorkspace() workspace: Workspace,
        @Query() query: MovementsQueryDto,
    ) {
        return this.movementsService.findAll(
            workspace.id,
            query.page,
            query.limit,
            query.startDate ? new Date(query.startDate) : undefined,
            query.endDate ? new Date(query.endDate) : undefined,
            query.type,
        )
    }

    @Get(APP_ROUTES.MOVEMENTS.SUMMARY_LAST_30_DAYS)
    async getSummary(@CurrentWorkspace() workspace: Workspace) {
        return this.movementsService.getLast30DaysSummary(workspace.id)
    }

    @Get(APP_ROUTES.MOVEMENTS.BY_PRODUCT)
    getMovementsByProduct(
        @Param('productId') productId: string,
        @CurrentWorkspace() workspace: Workspace,
        @Query() query: MovementsQueryDto,
    ) {
        return this.movementsService.findByProduct(productId, workspace.id, query.page, query.limit)
    }
}