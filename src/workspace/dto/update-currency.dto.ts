import { IsISO4217CurrencyCode, IsOptional, IsNumber, Min } from 'class-validator';

export class UpdateCurrencyDto {
    @IsISO4217CurrencyCode()
    newCurrency: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    conversionRate?: number;
}
