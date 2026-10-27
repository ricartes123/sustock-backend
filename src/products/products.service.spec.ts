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
    product: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
  };
  const service = new ProductsService(prisma as unknown as PrismaService);

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.product.create.mockImplementation(({ data }) => Promise.resolve(data));
    prisma.product.update.mockImplementation(({ data }) => Promise.resolve(data));
  });

  describe('create', () => {
    it('rejects a SKU already used by an active product', async () => {
      prisma.product.findFirst.mockResolvedValue({ name: 'Otro', sku: 'A1', barcode: null });

      await expect(
        service.create({ name: 'Nuevo', sku: 'A1', price: 10, stock: 1 }, 'w1'),
      ).rejects.toThrow(ConflictException);
      expect(prisma.product.create).not.toHaveBeenCalled();
    });

    it('stores blank codes as null without checking uniqueness', async () => {
      const product = await service.create({ name: 'Nuevo', sku: '  ', barcode: '', price: 10, stock: 1 }, 'w1');

      expect(prisma.product.findFirst).not.toHaveBeenCalled();
      expect(product).toMatchObject({ sku: null, barcode: null });
    });
  });

  describe('update', () => {
    it('does not re-check codes that did not change', async () => {
      prisma.product.findFirst.mockResolvedValueOnce({ id: 'p1', sku: 'A1', barcode: 'B1' });

      await service.update('p1', { name: 'Renombrado', sku: 'A1', barcode: 'B1' }, 'w1');

      expect(prisma.product.findFirst).toHaveBeenCalledTimes(1);
      expect(prisma.product.update).toHaveBeenCalled();
    });

    it('rejects changing the SKU to one in use', async () => {
      prisma.product.findFirst
        .mockResolvedValueOnce({ id: 'p1', sku: 'A1', barcode: null })
        .mockResolvedValueOnce({ name: 'Otro', sku: 'A2', barcode: null });

      await expect(service.update('p1', { sku: 'A2' }, 'w1')).rejects.toThrow('A2');
      expect(prisma.product.findFirst.mock.calls[1][0].where.id).toEqual({ not: 'p1' });
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

      const result = await service.importProducts(buffer, 'w1');

      expect(result.created).toBe(1);
      expect(result.errors.map((e) => e.row)).toEqual([3, 4]);
      expect(prisma.product.create.mock.calls[0][0].data.price.toString()).toBe('1234.56');
    });
  });
});
