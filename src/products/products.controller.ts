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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ProductsService } from './products.service'
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { WorkspaceGuard } from '../workspace-context/workspace.guard'
import { CurrentWorkspace } from '../workspace-context/current-workspace.decorator'
import { CurrentUser } from '../auth/current-user.decorator'
import type { AuthenticatedUser } from '../auth/authenticated-user.interface'
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
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.productsService.create(data, workspace.id, user.userId)
  }

  @Post(APP_ROUTES.PRODUCTS.IMPORT)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  importProducts(
    @UploadedFile() file: Express.Multer.File,
    @CurrentWorkspace() workspace: Workspace,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo.')
    return this.productsService.importProducts(file.buffer, workspace.id, user.userId)
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

  @Patch(APP_ROUTES.PRODUCTS.BY_ID)
  update(
    @Param('id') id: string,
    @Body() data: UpdateProductDto,
    @CurrentWorkspace() workspace: Workspace,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.productsService.update(id, data, workspace.id, user.userId)
  }

  @Delete(APP_ROUTES.PRODUCTS.BY_ID)
  remove(
    @Param('id') id: string,
    @CurrentWorkspace() workspace: Workspace,
  ) {
    return this.productsService.remove(id, workspace.id)
  }

  @Post(APP_ROUTES.PRODUCTS.RESTORE)
  restore(
    @Param('id') id: string,
    @CurrentWorkspace() workspace: Workspace,
  ) {
    return this.productsService.restore(id, workspace.id)
  }
}