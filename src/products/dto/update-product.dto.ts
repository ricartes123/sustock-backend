import { IsOptional, IsString, IsNumber, IsInt, IsBoolean, Min } from 'class-validator'

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
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  costPrice?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  stockMin?: number

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}