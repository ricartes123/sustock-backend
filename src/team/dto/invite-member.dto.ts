import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { Role } from '@prisma/client';
import { NormalizeEmail } from '../../auth/user-email';

export class InviteMemberDto {
    @NormalizeEmail()
    @IsEmail()
    email: string;

    @IsEnum(Role)
    @IsOptional()
    role?: Role;
}
