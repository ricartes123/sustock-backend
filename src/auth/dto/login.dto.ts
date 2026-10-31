import { IsEmail, IsString } from 'class-validator'
import { NormalizeEmail } from '../user-email'

export class LoginDto {
  @NormalizeEmail()
  @IsEmail()
  email: string

  @IsString()
  password: string
}