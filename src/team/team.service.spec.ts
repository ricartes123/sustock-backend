import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { TeamService } from './team.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TeamService', () => {
  const prisma = {
    user: { findUnique: jest.fn() },
    workspace: { findUnique: jest.fn() },
    teamMember: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), delete: jest.fn() },
  };
  const service = new TeamService(prisma as unknown as PrismaService);

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.user.findUnique.mockResolvedValue({ id: 'u2' });
    prisma.teamMember.findUnique.mockResolvedValue(null);
    prisma.workspace.findUnique.mockResolvedValue({ id: 'w1', ownerId: 'u1' });
    prisma.teamMember.create.mockImplementation(({ data }) => Promise.resolve(data));
  });

  describe('inviteMember', () => {
    it('never allows inviting someone as OWNER', async () => {
      await expect(
        service.inviteMember('w1', { email: 'a@b.com', role: Role.OWNER }, Role.OWNER),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.teamMember.create).not.toHaveBeenCalled();
    });

    it('only lets the owner invite admins', async () => {
      await expect(
        service.inviteMember('w1', { email: 'a@b.com', role: Role.ADMIN }, Role.ADMIN),
      ).rejects.toBeInstanceOf(ForbiddenException);

      await expect(
        service.inviteMember('w1', { email: 'a@b.com', role: Role.ADMIN }, Role.OWNER),
      ).resolves.toMatchObject({ role: Role.ADMIN });
    });

    it('defaults to STAFF when no role is given', async () => {
      await expect(
        service.inviteMember('w1', { email: 'a@b.com' }, Role.ADMIN),
      ).resolves.toMatchObject({ role: Role.STAFF });
    });
  });

  describe('removeMember', () => {
    it('lets admins remove staff', async () => {
      prisma.teamMember.findFirst.mockResolvedValue({ id: 'm1', role: Role.STAFF });
      await expect(service.removeMember('w1', 'm1', Role.ADMIN)).resolves.toBeDefined();
      expect(prisma.teamMember.delete).toHaveBeenCalledWith({ where: { id: 'm1' } });
    });

    it('only lets the owner remove admins', async () => {
      prisma.teamMember.findFirst.mockResolvedValue({ id: 'm1', role: Role.ADMIN });
      await expect(service.removeMember('w1', 'm1', Role.ADMIN)).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.teamMember.delete).not.toHaveBeenCalled();
    });
  });
});
