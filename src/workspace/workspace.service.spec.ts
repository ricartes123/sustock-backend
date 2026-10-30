import { ForbiddenException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { WorkspaceService } from './workspace.service';
import { UpdateCurrencyDto } from './dto/update-currency.dto';
import { PrismaService } from '../prisma/prisma.service';

describe('WorkspaceService.updateCurrency', () => {
  const tx = {
    workspace: { update: jest.fn() },
    product: { updateMany: jest.fn() },
  };
  const prisma = {
    workspace: { findUnique: jest.fn() },
    $transaction: jest.fn((fn: (client: typeof tx) => unknown) => fn(tx)),
  };
  const service = new WorkspaceService(prisma as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.workspace.findUnique.mockResolvedValue({ id: 'w1', ownerId: 'u1' });
    tx.workspace.update.mockResolvedValue({ id: 'w1', currency: 'USD' });
  });

  it('converts both price and cost so margins stay in one currency', async () => {
    await service.updateCurrency('w1', 'USD', 'u1', 0.001);

    expect(tx.product.updateMany).toHaveBeenCalledWith({
      where: { workspaceId: 'w1' },
      data: { price: { multiply: 0.001 }, costPrice: { multiply: 0.001 } },
    });
  });

  it('leaves products untouched when no rate is given', async () => {
    await service.updateCurrency('w1', 'USD', 'u1');
    expect(tx.product.updateMany).not.toHaveBeenCalled();
  });

  it('only lets the owner change the currency', async () => {
    await expect(service.updateCurrency('w1', 'USD', 'u2', 2)).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects codes that are not ISO 4217', async () => {
    const invalid = await validate(plainToInstance(UpdateCurrencyDto, { newCurrency: 'PESOS' }));
    const valid = await validate(plainToInstance(UpdateCurrencyDto, { newCurrency: 'ARS' }));
    expect(invalid).toHaveLength(1);
    expect(valid).toHaveLength(0);
  });
});
