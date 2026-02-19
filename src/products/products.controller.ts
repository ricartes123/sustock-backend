import { Controller, Post, Body, UseGuards, Get, Param, Patch } from '@nestjs/common'
import { ProductsService } from './products.service'
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import type { AuthenticatedUser } from '../auth/authenticated-user.interface'

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private productsService: ProductsService) { }

  @Post()
  create(
    @Body() data: CreateProductDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.productsService.create(data, user.userId)
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.productsService.findAll(user.userId)
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.productsService.findOne(id, user.userId)
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() data: UpdateProductDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.productsService.update(id, data, user.userId)
  }
}