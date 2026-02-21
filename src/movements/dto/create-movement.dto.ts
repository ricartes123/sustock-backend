import { IsEnum, IsInt, Min, IsString, IsOptional } from 'class-validator'
import { MovementType } from '@prisma/client'

export class CreateMovementDto {
  @IsString()
  productId: string

  @IsEnum(MovementType)
  type: MovementType

  @IsInt()
  @Min(1)
  quantity: number

  @IsString()
  @IsOptional()
  reason?: string
}