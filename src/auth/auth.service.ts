import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { RegisterDto } from './dto/register.dto'
import * as bcrypt from 'bcrypt'
import { JwtService } from '@nestjs/jwt'
import { UnauthorizedException } from '@nestjs/common'
import { LoginDto } from './dto/login.dto'
import { findUserByEmail } from './user-email'

const WORKSPACE_SUMMARY = { select: { id: true, name: true, currency: true } } as const

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) { }

  async register(data: RegisterDto) {
    const existingUser = await findUserByEmail(this.prisma, data.email)

    if (existingUser) {
      throw new BadRequestException('Email already in use')
    }

    const hashedPassword = await bcrypt.hash(data.password, 10)

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        workspaces: {
          create: {
            name: data.workspaceName,
            currency: data.currency || 'ARS',
          },
        },
      },
      select: { id: true, email: true },
    })

    return this.signToken(user)
  }

  async login(data: LoginDto) {
    const user = await findUserByEmail(this.prisma, data.email)

    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const passwordValid = await bcrypt.compare(
      data.password,
      user.password,
    )

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials')
    }

    return this.signToken(user)
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        workspaces: WORKSPACE_SUMMARY,
        teamMemberships: {
          select: { role: true, workspace: WORKSPACE_SUMMARY },
        },
      },
    })

    // A still-valid token can outlive its user
    if (!user) {
      throw new UnauthorizedException()
    }

    return user
  }

  private signToken(user: { id: string; email: string }) {
    return {
      userId: user.id,
      accessToken: this.jwtService.sign({ sub: user.id, email: user.email }),
    }
  }
}
