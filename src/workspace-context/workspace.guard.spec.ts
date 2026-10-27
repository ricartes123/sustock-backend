import { BadRequestException, ExecutionContext, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { WorkspaceGuard } from './workspace.guard';
import { PrismaService } from '../prisma/prisma.service';

function contextFor(request: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('WorkspaceGuard', () => {
  const findFirst = jest.fn();
  const guard = new WorkspaceGuard({ workspace: { findFirst } } as unknown as PrismaService);

  beforeEach(() => findFirst.mockReset());

  it('rejects requests without the x-workspace-id header', async () => {
    const request = { user: { userId: 'u1' }, headers: {} };
    await expect(guard.canActivate(contextFor(request))).rejects.toBeInstanceOf(BadRequestException);
    expect(findFirst).not.toHaveBeenCalled();
  });

  it('rejects workspaces the user cannot access', async () => {
    findFirst.mockResolvedValue(null);
    const request = { user: { userId: 'u1' }, headers: { 'x-workspace-id': 'w2' } };
    await expect(guard.canActivate(contextFor(request))).rejects.toBeInstanceOf(NotFoundException);
  });

  it('attaches the workspace and resolves the owner role', async () => {
    findFirst.mockResolvedValue({ id: 'w1', ownerId: 'u1', teamMembers: [] });
    const request: Record<string, unknown> = { user: { userId: 'u1' }, headers: { 'x-workspace-id': 'w1' } };

    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
    expect(findFirst.mock.calls[0][0].where.id).toBe('w1');
    expect(request.workspace).toEqual({ id: 'w1', ownerId: 'u1' });
    expect(request.workspaceRole).toBe(Role.OWNER);
  });

  it('resolves the team member role for non-owners', async () => {
    findFirst.mockResolvedValue({ id: 'w1', ownerId: 'u1', teamMembers: [{ role: Role.STAFF }] });
    const request: Record<string, unknown> = { user: { userId: 'u2' }, headers: { 'x-workspace-id': 'w1' } };

    await guard.canActivate(contextFor(request));
    expect(request.workspaceRole).toBe(Role.STAFF);
  });
});
