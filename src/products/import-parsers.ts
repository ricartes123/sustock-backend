import { Prisma } from '@prisma/client'

const THOUSANDS_DOT = /^\d{1,3}(\.\d{3})+(,\d{1,2})?$/
const THOUSANDS_COMMA = /^\d{1,3}(,\d{3})+(\.\d{1,2})?$/
const PLAIN = /^\d+([.,]\d{1,2})?$/

/**
 * Parses a non-negative amount with at most 2 decimals from a spreadsheet cell.
 * Groups of exactly three digits are thousands separators (es-AR: "1.234,56").
 * Returns null for empty or invalid values instead of silently truncating them.
 */
export function parseMoney(value: unknown): Prisma.Decimal | null {
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value < 0) return null
    const amount = new Prisma.Decimal(value)
    return amount.decimalPlaces() > 2 ? null : amount
  }

  const text = String(value ?? '').replace(/[\s$]/g, '')

  if (THOUSANDS_DOT.test(text)) return new Prisma.Decimal(text.replace(/\./g, '').replace(',', '.'))
  if (THOUSANDS_COMMA.test(text)) return new Prisma.Decimal(text.replace(/,/g, ''))
  if (PLAIN.test(text)) return new Prisma.Decimal(text.replace(',', '.'))

  return null
}

export function parseNonNegativeInt(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isInteger(value) && value >= 0 ? value : null
  }

  const text = String(value ?? '').trim()
  return /^\d+$/.test(text) ? Number(text) : null
}

export function isBlank(value: unknown): boolean {
  return String(value ?? '').trim() === ''
}
