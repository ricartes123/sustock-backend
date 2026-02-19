import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { AuthenticatedUser } from './authenticated-user.interface'

export const CurrentUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
        const request = ctx.switchToHttp().getRequest()
        return request.user
    },
)