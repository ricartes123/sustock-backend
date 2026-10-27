import { BadRequestException, NotFoundException } from '@nestjs/common';
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

    it('accepts discounts down to zero', async () => {
      tx.product.findMany.mockResolvedValue([product('a', '10.00')]);

      const sale = await service.create({ items: [{ productId: 'a', quantity: 2, unitPrice: 0 }] }, 'w1', 'u1');

      expect((sale.totalAmount as Prisma.Decimal).toString()).toBe('0');
    });

    it('rejects prices above the list price', async () => {
      tx.product.findMany.mockResolvedValue([product('a', '10.00')]);

      await expect(
        service.create({ items: [{ productId: 'a', quantity: 1, unitPrice: 10.01 }] }, 'w1', 'u1'),
      ).rejects.toThrow('no puede superar el precio de lista');
      expect(tx.sale.create).not.toHaveBeenCalled();
    });

    it('rejects clients from another workspace', async () => {
      tx.client.findFirst.mockResolvedValue(null);

      await expect(
        service.create({ clientId: 'foreign', items: [{ productId: 'a', quantity: 1 }] }, 'w1', 'u1'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(tx.client.findFirst.mock.calls[0][0].where).toMatchObject({ id: 'foreign', workspaceId: 'w1' });
      expect(tx.sale.create).not.toHaveBeenCalled();
    });

    it('does not create the sale when stock is insufficient', async () => {
      tx.product.findMany.mockResolvedValue([product('a', '10.00', 1)]);

      await expect(
        service.create({ items: [{ productId: 'a', quantity: 5 }] }, 'w1', 'u1'),
      ).rejects.toThrow('Stock insuficiente');
      expect(tx.sale.create).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('locks the sale before reading its status', async () => {
      tx.sale.findFirst.mockResolvedValue({ id: 's1', status: 'CANCELLED', items: [] });

      await expect(service.remove('s1', 'w1', 'u1')).rejects.toThrow('already cancelled');

      const [strings, saleId, workspaceId] = tx.$executeRaw.mock.calls[0];
      expect(strings.join('?')).toContain('FROM "Sale"');
      expect(strings.join('?')).toContain('FOR UPDATE');
      expect([saleId, workspaceId]).toEqual(['s1', 'w1']);
      expect(tx.$executeRaw.mock.invocationCallOrder[0]).toBeLessThan(tx.sale.findFirst.mock.invocationCallOrder[0]);
    });

    it('restores stock scoped to the workspace', async () => {
      tx.sale.findFirst.mockResolvedValue({
        id: 's1',
        status: 'ACTIVE',
        items: [{ productId: 'b', quantity: 2 }, { productId: 'a', quantity: 1 }],
      });

      await service.remove('s1', 'w1', 'u1');

      expect(tx.product.update.mock.calls.map((call) => call[0].where)).toEqual([
        { id: 'a', workspaceId: 'w1' },
        { id: 'b', workspaceId: 'w1' },
      ]);
    });
  });
});
