import { IsEmail, IsString, MinLength, IsNotEmpty, IsOptional, IsISO4217CurrencyCode } from 'class-validator'
import { NormalizeEmail } from '../user-email'

export class RegisterDto {
  @NormalizeEmail()
  @IsEmail()
  email: string

  @IsString()
  @MinLength(8)
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