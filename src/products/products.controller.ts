import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  Patch,
  Delete,
  Query,
} from '@nestjs/common'
import { ProductsService } from './products.service'
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { WorkspaceGuard } from '../workspace-context/workspace.guard'
import { CurrentWorkspace } from '../workspace-context/current-workspace.decorator'
import type { Workspace } from '@prisma/client'
import { PaginationDto } from './dto/pagination.dto'
import { APP_ROUTES } from '../app.routes'

@Controller(APP_ROUTES.PRODUCTS.ROOT)
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class ProductsController {
  constructor(private productsService: ProductsService) { }

  @Post()
  create(
    @Body() data: CreateProductDto,
    @CurrentWorkspace() workspace: Workspace,
  ) {
    return this.productsService.create(data, workspace.id)
  }

  @Get()
  findAll(
    @CurrentWorkspace() workspace: Workspace,
    @Query() pagination: PaginationDto,
  ) {
    return this.productsService.findAll(workspace.id, pagination);
  }

  @Get(APP_ROUTES.PRODUCTS.BY_ID)
  findOne(
    @Param('id') id: string,
    @CurrentWorkspace() workspace: Workspace,
  ) {
    return this.productsService.findOne(id, workspace.id)
  }

  @Get(APP_ROUTES.PRODUCTS.MOVEMENTS)
  getMovements(
    @Param('id') id: string,
    @CurrentWorkspace() workspace: Workspace,
  ) {
    return this.productsService.getProductMovements(id, workspace.id);
  }

  @Patch(APP_ROUTES.PRODUCTS.BY_ID)
  update(
    @Param('id') id: string,
    @Body() data: UpdateProductDto,
    @CurrentWorkspace() workspace: Workspace,
  ) {
    return this.productsService.update(id, data, workspace.id)
  }

  @Delete(APP_ROUTES.PRODUCTS.BY_ID)
  remove(
    @Param('id') id: string,
    @CurrentWorkspace() workspace: Workspace,
  ) {
    return this.productsService.remove(id, workspace.id)
  }
}