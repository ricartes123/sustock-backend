import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { SalesService } from './sales.service';
import { PrismaService } from '../prisma/prisma.service';

function product(id: string, price: string, stock = 10) {
  return {
    id,
    name: `Product ${id}`,
    price: new Prisma.Decimal(price),
    costPrice: new Prisma.Decimal('1.00'),
    stock,
  };
}

describe('SalesService', () => {
  const tx = {
    $executeRaw: jest.fn(),
    product: { findMany: jest.fn(), update: jest.fn() },
    client: { findFirst: jest.fn() },
    sale: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    movement: { create: jest.fn(), createMany: jest.fn() },
  };
  const prisma = { $transaction: jest.fn((fn: (t: typeof tx) => unknown) => fn(tx)) };
  const service = new SalesService(prisma as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
    tx.sale.create.mockImplementation(({ data }) => Promise.resolve({ id: 's1', ...data }));
  });

  describe('create', () => {
    it('rejects the same product twice in one sale', async () => {
      await expect(
        service.create({ items: [{ productId: 'a', quantity: 1 }, { productId: 'a', quantity: 2 }] }, 'w1', 'u1'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('locks products in a stable order regardless of payload order', async () => {
      tx.product.findMany.mockResolvedValue([product('a', '10.00'), product('b', '10.00')]);

      await service.create({ items: [{ productId: 'b', quantity: 1 }, { productId: 'a', quantity: 1 }] }, 'w1', 'u1');

      const lockedIds = tx.$executeRaw.mock.calls.map((call) => call[1]);
      expect(lockedIds).toEqual(['a', 'b']);
    });

    it('computes totals with exact decimal arithmetic', async () => {
      tx.product.findMany.mockResolvedValue([product('a', '0.10'), product('b', '0.20')]);

      const sale = await service.create(
        { items: [{ productId: 'a', quantity: 1 }, { productId: 'b', quantity: 1 }] },
        'w1',
        'u1',
      );

      expect((sale.totalAmount as Prisma.Decimal).toString()).toBe('0.3');
    });

    it('does not create the sale when stock is insufficient', async () => {
      tx.product.findMany.mockResolvedValue([product('a', '10.00', 1)]);

      await expect(
        service.create({ items: [{ productId: 'a', quantity: 5 }] }, 'w1', 'u1'),
      ).rejects.toThrow('Stock insuficiente');
      expect(tx.sale.create).not.toHaveBeenCalled();
    });
  });
});
