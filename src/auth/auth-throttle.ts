import type { ThrottlerOptions } from '@nestjs/throttler'

export const LOGIN_THROTTLER = 'login'
export const REGISTER_THROTTLER = 'register'

const ONE_MINUTE_MS = 60_000

// Login attempts are counted per account: behind Vercel's rewrite and Render's proxy the client IP
// is either shared by every user or spoofable, while the email is what a brute-force attack targets
export function loginTracker(req: { body?: { email?: unknown }; ip?: string }): string {
  const email = req.body?.email
  return typeof email === 'string' && email.trim() ? `email:${email.trim().toLowerCase()}` : `ip:${req.ip}`
}

export const AUTH_THROTTLERS: ThrottlerOptions[] = [
  { name: LOGIN_THROTTLER, ttl: ONE_MINUTE_MS, limit: 5, getTracker: loginTracker },
  { name: REGISTER_THROTTLER, ttl: ONE_MINUTE_MS, limit: 5 },
]
