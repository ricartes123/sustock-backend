import { IsEmail, IsString, MinLength, IsNotEmpty, IsOptional, IsISO4217CurrencyCode } from 'class-validator'

export class RegisterDto {
  @IsEmail()
  email: string

  @IsString()
  @MinLength(6)
  password: string

  @IsString()
  @IsNotEmpty()
  workspaceName: string

  @IsString()
  @IsNotEmpty()
  firstName: string

  @IsString()
  @IsNotEmpty()
  lastName: string

  @IsISO4217CurrencyCode()
  @IsOptional()
  currency?: string
}