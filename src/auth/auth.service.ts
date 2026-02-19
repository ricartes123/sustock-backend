import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { RegisterDto } from './dto/register.dto'
import * as bcrypt from 'bcrypt'
import { JwtService } from '@nestjs/jwt'
import { UnauthorizedException } from '@nestjs/common'
import { LoginDto } from './dto/login.dto'

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  async register(data: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existingUser) {
      throw new BadRequestException('Email already in use')
    }

    const hashedPassword = await bcrypt.hash(data.password, 10)

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        businesses: {
          create: {
            name: data.businessName,
          },
        },
      },
      include: {
        businesses: true,
      },
    })

    return {
      message: 'User created successfully',
      user,
    }
  }
  
  async login(data: LoginDto) {
  const user = await this.prisma.user.findUnique({
    where: { email: data.email },
    include: { businesses: true },
  })

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

  const payload = {
    sub: user.id,
    email: user.email,
  }

  return {
    accessToken: this.jwtService.sign(payload),
  }
}
}