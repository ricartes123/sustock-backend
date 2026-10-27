import { IsString, IsOptional, IsArray, ArrayNotEmpty, ValidateNested, IsNumber, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SaleItemDto {
    @IsString()
    productId: string;

    @IsInt()
    @Min(1)
    quantity: number;

    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    unitPrice?: number;
}

export class CreateSaleDto {
    @IsOptional()
    @IsString()
    clientId?: string;

    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => SaleItemDto)
    items: SaleItemDto[];
}
