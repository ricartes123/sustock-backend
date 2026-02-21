import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';

export class UpdateCurrencyDto {
    @IsString()
    @IsNotEmpty()
    newCurrency: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    conversionRate?: number;
}
