import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceGuard } from '../workspace-context/workspace.guard';
import { CurrentWorkspace } from '../workspace-context/current-workspace.decorator';
import type { Workspace } from '@prisma/client';
import { APP_ROUTES } from '../app.routes';

@Controller(APP_ROUTES.CLIENTS.ROOT)
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class ClientsController {
    constructor(private readonly clientsService: ClientsService) { }

    @Post()
    create(@Body() createClientDto: CreateClientDto, @CurrentWorkspace() workspace: Workspace) {
        return this.clientsService.create(createClientDto, workspace.id);
    }

    @Get()
    findAll(@CurrentWorkspace() workspace: Workspace) {
        return this.clientsService.findAll(workspace.id);
    }

    @Get(APP_ROUTES.CLIENTS.BY_ID)
    findOne(@Param('id') id: string, @CurrentWorkspace() workspace: Workspace) {
        return this.clientsService.findOne(id, workspace.id);
    }
}
