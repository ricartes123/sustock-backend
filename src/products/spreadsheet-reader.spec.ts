import { Workbook } from 'exceljs';
import { readSpreadsheetRows } from './spreadsheet-reader';

describe('readSpreadsheetRows', () => {
  it('reads an .xlsx sheet keyed by its header row, resolving formulas and skipping blank rows', async () => {
    const workbook = new Workbook();
    const sheet = workbook.addWorksheet('Productos');
    sheet.addRow(['Nombre', 'Precio de Venta', 'Stock']);
    sheet.addRow(['Yerba', 1234.5, 3]);
    sheet.addRow([]);
    sheet.addRow(['Té', { formula: 'B2*2', result: 2469 }, 1]);

    const rows = await readSpreadsheetRows(Buffer.from(await workbook.xlsx.writeBuffer()));

    expect(rows).toEqual([
      { Nombre: 'Yerba', 'Precio de Venta': 1234.5, Stock: 3 },
      { Nombre: 'Té', 'Precio de Venta': 2469, Stock: 1 },
    ]);
  });

  it('reads a Spanish-locale CSV separated by semicolons, keeping amounts as text', async () => {
    const csv = '\uFEFFNombre;Precio de Venta;Stock\r\nYerba;1.234,56;3\r\n';

    expect(await readSpreadsheetRows(Buffer.from(csv, 'utf8'))).toEqual([
      { Nombre: 'Yerba', 'Precio de Venta': '1.234,56', Stock: '3' },
    ]);
  });

  it('reads a comma-separated CSV', async () => {
    const csv = 'Nombre,Precio de Venta\nYerba,"1234.56"\n';
    expect(await readSpreadsheetRows(Buffer.from(csv))).toEqual([{ Nombre: 'Yerba', 'Precio de Venta': '1234.56' }]);
  });

  it('rejects legacy .xls files', async () => {
    const xls = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    await expect(readSpreadsheetRows(xls)).rejects.toThrow();
  });
});
