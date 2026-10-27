import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { Role } from '@prisma/client'

export const CurrentWorkspaceRole = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): Role => {
        const request = ctx.switchToHttp().getRequest()
        return request.workspaceRole
    },
)
