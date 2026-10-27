import type { CookieOptions, Request } from 'express'

export const AUTH_COOKIE = 'access_token'
export const AUTH_SESSION_TTL_SECONDS = 24 * 60 * 60

export function authCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    // Same-site only: production traffic goes through the Vercel /api rewrite
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  }
}

export function readAuthCookie(request: Request): string | null {
  const header = request.headers.cookie
  if (!header) return null

  for (const pair of header.split(';')) {
    const separator = pair.indexOf('=')
    if (separator === -1) continue
    if (pair.slice(0, separator).trim() === AUTH_COOKIE) {
      return decodeURIComponent(pair.slice(separator + 1).trim())
    }
  }

  return null
}
