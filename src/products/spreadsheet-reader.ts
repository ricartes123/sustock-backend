import { Readable } from 'stream'
import { Workbook, type CellValue } from 'exceljs'

// .xlsx files are zip archives; legacy .xls files are OLE documents, which exceljs cannot read
const isZip = (buffer: Buffer) => buffer[0] === 0x50 && buffer[1] === 0x4b
const isLegacyXls = (buffer: Buffer) => buffer.subarray(0, 4).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0]))

/**
 * Reads the first sheet of an .xlsx or .csv file into objects keyed by the header row.
 * Blank rows are skipped. CSV values are kept as text so the import parsers decide how to
 * read amounts like "1.234,56"; Spanish-locale Excel exports CSV separated by ";".
 */
export async function readSpreadsheetRows(buffer: Buffer): Promise<Record<string, unknown>[]> {
  if (isLegacyXls(buffer)) {
    throw new Error('Legacy .xls files are not supported')
  }

  const workbook = new Workbook()

  if (isZip(buffer)) {
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer)
  } else {
    const text = buffer.toString('utf8').replace(/^\uFEFF/, '')
    await workbook.csv.read(Readable.from([text]), {
      parserOptions: { delimiter: detectDelimiter(text) },
      map: (value: unknown) => value,
    })
  }

  const sheet = workbook.worksheets[0]
  if (!sheet) return []

  const headers: string[] = []
  sheet.getRow(1).eachCell((cell, column) => {
    headers[column] = String(plainValue(cell.value)).trim()
  })

  const rows: Record<string, unknown>[] = []
  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
    const row = sheet.getRow(rowNumber)
    const record: Record<string, unknown> = {}
    let hasValues = false

    headers.forEach((header, column) => {
      if (!header) return
      const value = plainValue(row.getCell(column).value)
      if (value !== '') hasValues = true
      record[header] = value
    })

    if (hasValues) rows.push(record)
  }

  return rows
}

function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0]
  return (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ';' : ','
}

function plainValue(value: CellValue): unknown {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value.toISOString()
  if (typeof value !== 'object') return value

  if ('result' in value) return plainValue((value.result ?? '') as CellValue)
  if ('richText' in value) return value.richText.map((part) => part.text).join('')
  if ('text' in value) return value.text
  return ''
}
