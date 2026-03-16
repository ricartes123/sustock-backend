import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import type { AuthenticatedUser } from './authenticated-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { APP_ROUTES } from '../app.routes';

@Controller(APP_ROUTES.AUTH.ROOT)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) { }

  @Post(APP_ROUTES.AUTH.REGISTER)
  async register(@Body() data: RegisterDto) {
    return this.authService.register(data);
  }

  @Post(APP_ROUTES.AUTH.LOGIN)
  async login(@Body() data: LoginDto) {
    return this.authService.login(data);
  }

  @Get(APP_ROUTES.AUTH.ME)
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    const fullProfile = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        workspaces: {
          select: {
            id: true,
            name: true,
            currency: true,
          }
        },
        teamMemberships: {
          include: {
            workspace: {
              select: {
                id: true,
                name: true,
                currency: true,
              }
            }
          }
        }
      }
    });

    return fullProfile;
  }
}
