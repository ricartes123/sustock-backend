import { Controller, Post, Body, UseGuards, Get, Res, HttpCode, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import type { AuthenticatedUser } from './authenticated-user.interface';
import { AUTH_COOKIE, AUTH_SESSION_TTL_SECONDS, authCookieOptions } from './auth-cookie';
import { APP_ROUTES } from '../app.routes';

@Controller(APP_ROUTES.AUTH.ROOT)
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post(APP_ROUTES.AUTH.REGISTER)
  async register(@Body() data: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { userId, accessToken } = await this.authService.register(data);
    this.setSessionCookie(res, accessToken);
    return this.authService.getProfile(userId);
  }

  @Post(APP_ROUTES.AUTH.LOGIN)
  @HttpCode(HttpStatus.OK)
  async login(@Body() data: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { userId, accessToken } = await this.authService.login(data);
    this.setSessionCookie(res, accessToken);
    return this.authService.getProfile(userId);
  }

  @Post(APP_ROUTES.AUTH.LOGOUT)
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(AUTH_COOKIE, authCookieOptions());
  }

  @Get(APP_ROUTES.AUTH.ME)
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getProfile(user.userId);
  }

  private setSessionCookie(res: Response, accessToken: string) {
    res.cookie(AUTH_COOKIE, accessToken, {
      ...authCookieOptions(),
      maxAge: AUTH_SESSION_TTL_SECONDS * 1000,
    });
  }
}
