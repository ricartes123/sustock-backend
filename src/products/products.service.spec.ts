import { ConflictException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';

function workbookBuffer(rows: Record<string, unknown>[]): Buffer {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'Productos');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

describe('ProductsService', () => {
  const prisma = {
    $executeRaw: jest.fn(),
    $transaction: jest.fn(),
    product: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    movement: { create: jest.fn() },
  };
  const service = new ProductsService(prisma as unknown as PrismaService);

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.product.create.mockImplementation(({ data }) => Promise.resolve({ id: 'new', stock: 0, ...data }));
    prisma.product.update.mockImplementation(({ data }) => Promise.resolve(data));
    prisma.$transaction.mockImplementation((fn: (tx: typeof prisma) => unknown) => fn(prisma));
  });

  describe('create', () => {
    it('rejects a SKU already used by an active product', async () => {
      prisma.product.findFirst.mockResolvedValue({ name: 'Otro', sku: 'A1', barcode: null });

      await expect(
        service.create({ name: 'Nuevo', sku: 'A1', price: 10, stock: 1 }, 'w1', 'u1'),
      ).rejects.toThrow(ConflictException);
      expect(prisma.product.create).not.toHaveBeenCalled();
    });

    it('stores blank codes as null without checking uniqueness', async () => {
      const product = await service.create({ name: 'Nuevo', sku: '  ', barcode: '', price: 10, stock: 1 }, 'w1', 'u1');

      expect(prisma.product.findFirst).not.toHaveBeenCalled();
      expect(product).toMatchObject({ sku: null, barcode: null });
    });

    it('records the initial stock as an IN movement', async () => {
      await service.create({ name: 'Nuevo', price: 10, stock: 5 }, 'w1', 'u1');

      expect(prisma.movement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ type: 'IN', quantity: 5, productId: 'new', workspaceId: 'w1', userId: 'u1' }),
      });
    });

    it('records no movement when the product starts without stock', async () => {
      await service.create({ name: 'Nuevo', price: 10, stock: 0 }, 'w1', 'u1');
      expect(prisma.movement.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('does not re-check codes that did not change', async () => {
      prisma.product.findFirst.mockResolvedValueOnce({ id: 'p1', sku: 'A1', barcode: 'B1' });

      await service.update('p1', { name: 'Renombrado', sku: 'A1', barcode: 'B1' }, 'w1', 'u1');

      expect(prisma.product.findFirst).toHaveBeenCalledTimes(1);
      expect(prisma.product.update).toHaveBeenCalled();
    });

    it('rejects changing the SKU to one in use', async () => {
      prisma.product.findFirst
        .mockResolvedValueOnce({ id: 'p1', sku: 'A1', barcode: null })
        .mockResolvedValueOnce({ name: 'Otro', sku: 'A2', barcode: null });

      await expect(service.update('p1', { sku: 'A2' }, 'w1', 'u1')).rejects.toThrow('A2');
      expect(prisma.product.findFirst.mock.calls[1][0].where.id).toEqual({ not: 'p1' });
    });
    it('records an ADJUSTMENT movement when the stock changes', async () => {
      prisma.product.findFirst.mockResolvedValueOnce({ id: 'p1', sku: null, barcode: null, stock: 5 });

      await service.update('p1', { stock: 8 }, 'w1', 'u1');

      expect(prisma.movement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ type: 'ADJUSTMENT', quantity: 8, productId: 'p1', userId: 'u1' }),
      });
    });

    it('does not record a movement when the stock is unchanged', async () => {
      prisma.product.findFirst.mockResolvedValueOnce({ id: 'p1', sku: null, barcode: null, stock: 5 });

      await service.update('p1', { name: 'X', stock: 5 }, 'w1', 'u1');

      expect(prisma.movement.create).not.toHaveBeenCalled();
    });
  });

  describe('restore', () => {
    it('reactivates an archived product', async () => {
      prisma.product.findFirst
        .mockResolvedValueOnce({ id: 'p1', sku: 'A1', barcode: null })
        .mockResolvedValueOnce(null);

      await service.restore('p1', 'w1');

      expect(prisma.product.findFirst.mock.calls[0][0].where).toMatchObject({ id: 'p1', workspaceId: 'w1', isActive: false });
      expect(prisma.product.update).toHaveBeenCalledWith({ where: { id: 'p1' }, data: { isActive: true } });
    });

    it('refuses to restore when its SKU is now used by an active product', async () => {
      prisma.product.findFirst
        .mockResolvedValueOnce({ id: 'p1', sku: 'A1', barcode: null })
        .mockResolvedValueOnce({ name: 'Nuevo', sku: 'A1', barcode: null });

      await expect(service.restore('p1', 'w1')).rejects.toThrow(ConflictException);
      expect(prisma.product.update).not.toHaveBeenCalled();
    });
  });

  describe('importProducts', () => {
    it('reports duplicated codes and keeps decimals', async () => {
      prisma.product.findFirst.mockResolvedValue(null);
      const buffer = workbookBuffer([
        { Nombre: 'Uno', SKU: 'X1', 'Precio de Venta': '1.234,56', Stock: 3 },
        { Nombre: 'Dos', SKU: 'X1', 'Precio de Venta': 10, Stock: 1 },
        { Nombre: 'Tres', 'Precio de Venta': '9,99', Stock: '2.5' },
      ]);

      const result = await service.importProducts(buffer, 'w1', 'u1');

      expect(result.created).toBe(1);
      expect(result.errors.map((e) => e.row)).toEqual([3, 4]);
      expect(prisma.product.create.mock.calls[0][0].data.price.toString()).toBe('1234.56');
      expect(prisma.movement.create).toHaveBeenCalledTimes(1);
      expect(prisma.movement.create.mock.calls[0][0].data).toMatchObject({ type: 'IN', quantity: 3, reason: 'Importación' });
    });
  });
});
