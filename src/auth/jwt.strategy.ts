import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import { AuthenticatedUser } from './authenticated-user.interface'
import { readAuthCookie } from './auth-cookie'

interface JwtPayload {
    sub: string
    email: string
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(configService: ConfigService) {
        super({
            jwtFromRequest: readAuthCookie,
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET')!,
        })
    }

    async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
        return {
            userId: payload.sub,
            email: payload.email,
        }
    }
}
