import { IsOptional, IsString, IsNumber, Min } from 'class-validator'

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  sku?: string

  @IsOptional()
  @IsString()
  barcode?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  costPrice?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  stockMin?: number

  @IsOptional()
  isActive?: boolean
}