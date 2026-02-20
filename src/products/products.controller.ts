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
import { BusinessGuard } from '../business-context/business.guard'
import { CurrentBusiness } from '../business-context/current-business.decorator'
import type { Business } from '@prisma/client'
import { PaginationDto } from './dto/pagination.dto'

@Controller('products')
@UseGuards(JwtAuthGuard, BusinessGuard)
export class ProductsController {
  constructor(private productsService: ProductsService) { }

  @Post()
  create(
    @Body() data: CreateProductDto,
    @CurrentBusiness() business: Business,
  ) {
    return this.productsService.create(data, business.id)
  }

  @Get()
  findAll(
    @CurrentBusiness() business: Business,
    @Query() pagination: PaginationDto,
  ) {
    return this.productsService.findAll(business.id, pagination);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentBusiness() business: Business,
  ) {
    return this.productsService.findOne(id, business.id)
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() data: UpdateProductDto,
    @CurrentBusiness() business: Business,
  ) {
    return this.productsService.update(id, data, business.id)
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentBusiness() business: Business,
  ) {
    return this.productsService.remove(id, business.id)
  }
}