import { Reflector } from '@nestjs/core'
import { Role } from '@prisma/client'

export const Roles = Reflector.createDecorator<Role[]>()

export const ADMIN_ROLES: Role[] = [Role.OWNER, Role.ADMIN]
