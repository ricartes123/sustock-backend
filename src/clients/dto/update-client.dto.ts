import { IsString, IsOptional, IsEmail, IsBoolean, MinLength } from 'class-validator';

export class UpdateClientDto {
    @IsOptional()
    @IsString()
    @MinLength(3)
    name?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
