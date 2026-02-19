import { IsEnum, IsInt, Min, IsString } from 'class-validator'
import { MovementType } from '@prisma/client'

export class CreateMovementDto {
  @IsString()
  productId: string

  @IsEnum(MovementType)
  type: MovementType

  @IsInt()
  @Min(1)
  quantity: number
}