import { Controller, Post, Body, Get, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceGuard } from '../workspace-context/workspace.guard';
import { CurrentWorkspace } from '../workspace-context/current-workspace.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/authenticated-user.interface';
import type { Workspace } from '@prisma/client';
import { APP_ROUTES } from '../app.routes';
import { PaginationDto } from '../products/dto/pagination.dto';

@Controller(APP_ROUTES.SALES.ROOT)
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class SalesController {
    constructor(private readonly salesService: SalesService) { }

    @Post()
    create(
        @Body() createSaleDto: CreateSaleDto,
        @CurrentWorkspace() workspace: Workspace,
        @CurrentUser() user: AuthenticatedUser
    ) {
        return this.salesService.create(createSaleDto, workspace.id, user.userId);
    }

    @Get()
    findAll(@CurrentWorkspace() workspace: Workspace) {
        return this.salesService.findAll(workspace.id);
    }

    @Get(APP_ROUTES.SALES.BY_ID)
    findOne(@Param('id') id: string, @CurrentWorkspace() workspace: Workspace) {
        return this.salesService.findOne(id, workspace.id);
    }

    @Delete(APP_ROUTES.SALES.BY_ID)
    remove(@Param('id') id: string, @CurrentWorkspace() workspace: Workspace, @CurrentUser() user: AuthenticatedUser) {
        return this.salesService.remove(id, workspace.id, user.userId);
    }

    //historial de ventas con paginación de un cliente
    @Get(APP_ROUTES.SALES.CLIENT_ID)
    findOneClient(
        @Param('clientId') clientId: string, 
        @CurrentWorkspace() workspace: Workspace,
        @Query() pagination: PaginationDto
    ) {
        return this.salesService.findOneClient(clientId, workspace.id, pagination);
    }
}
