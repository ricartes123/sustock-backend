import { IsString, IsNumber, IsInt, Min, IsOptional } from 'class-validator'

export class CreateProductDto {
  @IsString()
  name: string

  @IsString()
  @IsOptional()
  sku?: string

  @IsString()
  @IsOptional()
  barcode?: string

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number

  @IsInt()
  @Min(0)
  stock: number

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  costPrice?: number

  @IsInt()
  @Min(0)
  @IsOptional()
  stockMin?: number
}