import { MovementType } from '@prisma/client';
import { MovementsService } from './movements.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MovementsService', () => {
  const tx = {
    $executeRaw: jest.fn(),
    product: { findFirst: jest.fn(), update: jest.fn() },
    movement: { create: jest.fn() },
  };
  const prisma = { $transaction: jest.fn((fn: (t: typeof tx) => unknown) => fn(tx)) };
  const service = new MovementsService(prisma as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
    tx.product.findFirst.mockResolvedValue({ id: 'p1', name: 'P1', stock: 5 });
    tx.movement.create.mockImplementation(({ data }) => Promise.resolve(data));
  });

  it('locks the product scoped to the workspace', async () => {
    await service.create({ productId: 'p1', type: MovementType.IN, quantity: 1 }, 'w1', 'u1');

    const [strings, productId, workspaceId] = tx.$executeRaw.mock.calls[0];
    expect(strings.join('?')).toContain('"workspaceId"');
    expect([productId, workspaceId]).toEqual(['p1', 'w1']);
  });

  it('rejects OUT movements larger than the current stock', async () => {
    await expect(
      service.create({ productId: 'p1', type: MovementType.OUT, quantity: 6 }, 'w1', 'u1'),
    ).rejects.toThrow('Stock insuficiente');
    expect(tx.product.update).not.toHaveBeenCalled();
  });
});
