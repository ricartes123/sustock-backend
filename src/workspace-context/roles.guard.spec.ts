import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { RolesGuard } from './roles.guard';

function contextFor(workspaceRole: Role): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ workspaceRole }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const reflector = { getAllAndOverride: jest.fn() };
  const guard = new RolesGuard(reflector as unknown as Reflector);

  it('allows any role when the route declares no roles', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(contextFor(Role.STAFF))).toBe(true);
  });

  it('allows roles listed in @Roles()', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.OWNER, Role.ADMIN]);
    expect(guard.canActivate(contextFor(Role.ADMIN))).toBe(true);
  });

  it('rejects roles not listed in @Roles()', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.OWNER, Role.ADMIN]);
    expect(() => guard.canActivate(contextFor(Role.STAFF))).toThrow(ForbiddenException);
  });
});
