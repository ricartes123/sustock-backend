import { Transform } from 'class-transformer'
import type { PrismaService } from '../prisma/prisma.service'

export const normalizeEmail = (value: unknown) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value

export const NormalizeEmail = () => Transform(({ value }) => normalizeEmail(value))

// Accounts created before emails were normalized may still have uppercase letters,
// so an exact match is tried first and a case-insensitive one as a fallback
export async function findUserByEmail(prisma: PrismaService, email: string) {
  return (
    (await prisma.user.findUnique({ where: { email } })) ??
    prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } })
  )
}
