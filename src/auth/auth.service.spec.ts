import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService.getProfile', () => {
  const prisma = { user: { findUnique: jest.fn() } };
  const service = new AuthService(prisma as unknown as PrismaService, {} as JwtService);

  it('returns the profile of an existing user', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.com' });
    await expect(service.getProfile('u1')).resolves.toMatchObject({ id: 'u1' });
  });

  it('rejects a token whose user no longer exists', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.getProfile('gone')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
