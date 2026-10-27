import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Roles } from './roles.decorator'

// Must run after WorkspaceGuard, which resolves request.workspaceRole.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const allowedRoles = this.reflector.getAllAndOverride(Roles, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!allowedRoles) {
      return true
    }

    const { workspaceRole } = context.switchToHttp().getRequest()

    if (!allowedRoles.includes(workspaceRole)) {
      throw new ForbiddenException('Insufficient role for this action')
    }

    return true
  }
}
