import { Controller, Post, Body, Get, Param, UseGuards, Query, Patch, Delete } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceGuard } from '../workspace-context/workspace.guard';
import { RolesGuard } from '../workspace-context/roles.guard';
import { Roles, ADMIN_ROLES } from '../workspace-context/roles.decorator';
import { CurrentWorkspace } from '../workspace-context/current-workspace.decorator';
import type { Workspace } from '@prisma/client';
import { APP_ROUTES } from '../app.routes';
import { PaginationDto } from '../products/dto/pagination.dto';

@Controller(APP_ROUTES.CLIENTS.ROOT)
@UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
export class ClientsController {
    constructor(private readonly clientsService: ClientsService) { }

    @Post()
    create(@Body() createClientDto: CreateClientDto, @CurrentWorkspace() workspace: Workspace) {
        return this.clientsService.create(createClientDto, workspace.id);
    }

    @Get()
    findAll(
        @CurrentWorkspace() workspace: Workspace,
        @Query() pagination: PaginationDto,
    ) {
        return this.clientsService.findAll(workspace.id, pagination);
    }

    @Get(APP_ROUTES.CLIENTS.BY_ID)
    findOne(@Param('id') id: string, @CurrentWorkspace() workspace: Workspace) {
        return this.clientsService.findOne(id, workspace.id);
    }

    @Patch(APP_ROUTES.CLIENTS.BY_ID)
    update(
        @Param('id') id: string,
        @Body() updateClientDto: UpdateClientDto,
        @CurrentWorkspace() workspace: Workspace,
    ) {
        return this.clientsService.update(id, updateClientDto, workspace.id);
    }

    @Roles(ADMIN_ROLES)
    @Delete(APP_ROUTES.CLIENTS.BY_ID)
    remove(@Param('id') id: string, @CurrentWorkspace() workspace: Workspace) {
        return this.clientsService.remove(id, workspace.id);
    }

    @Roles(ADMIN_ROLES)
    @Post(':id/restore')
    restore(@Param('id') id: string, @CurrentWorkspace() workspace: Workspace) {
        return this.clientsService.restore(id, workspace.id);
    }
}
