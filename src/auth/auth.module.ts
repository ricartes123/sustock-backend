import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtStrategy } from './jwt.strategy'
import { ThrottlerModule } from '@nestjs/throttler'
import { AUTH_SESSION_TTL_SECONDS } from './auth-cookie'
import { AUTH_THROTTLERS } from './auth-throttle'

@Module({
  imports: [
    ConfigModule,
    ThrottlerModule.forRoot(AUTH_THROTTLERS),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: AUTH_SESSION_TTL_SECONDS },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}