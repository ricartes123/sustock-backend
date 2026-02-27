import { Controller, Post, Body, Get, Param, Delete, UseGuards } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceGuard } from '../workspace-context/workspace.guard';
import { CurrentWorkspace } from '../workspace-context/current-workspace.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/authenticated-user.interface';
import type { Workspace } from '@prisma/client';

@Controller('sales')
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

    @Get(':id')
    findOne(@Param('id') id: string, @CurrentWorkspace() workspace: Workspace) {
        return this.salesService.findOne(id, workspace.id);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @CurrentWorkspace() workspace: Workspace, @CurrentUser() user: AuthenticatedUser) {
        return this.salesService.remove(id, workspace.id, user.userId);
    }
}
