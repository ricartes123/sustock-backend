import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { findUserByEmail } from './user-email';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from '../prisma/prisma.service';

describe('user email', () => {
  const prisma = { user: { findUnique: jest.fn(), findFirst: jest.fn() } };
  const db = prisma as unknown as PrismaService;

  beforeEach(() => jest.resetAllMocks());

  it('normalizes the email received by the DTOs', () => {
    expect(plainToInstance(LoginDto, { email: '  Juan@Mail.COM ', password: 'x' }).email).toBe('juan@mail.com');
  });

  it('uses the exact match when there is one', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
    await expect(findUserByEmail(db, 'juan@mail.com')).resolves.toEqual({ id: 'u1' });
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });

  it('still finds accounts stored with uppercase letters', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.findFirst.mockResolvedValue({ id: 'legacy' });

    await expect(findUserByEmail(db, 'juan@mail.com')).resolves.toEqual({ id: 'legacy' });
    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { email: { equals: 'juan@mail.com', mode: 'insensitive' } },
    });
  });
});
