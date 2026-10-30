import { loginTracker } from './auth-throttle'

describe('loginTracker', () => {
  it('counts attempts per account regardless of case or spacing', () => {
    expect(loginTracker({ body: { email: ' Juan@Mail.com ' }, ip: '1.1.1.1' })).toBe('email:juan@mail.com')
    expect(loginTracker({ body: { email: 'juan@mail.com' }, ip: '2.2.2.2' })).toBe('email:juan@mail.com')
  })

  it('falls back to the IP when there is no email', () => {
    expect(loginTracker({ body: {}, ip: '1.1.1.1' })).toBe('ip:1.1.1.1')
    expect(loginTracker({ body: { email: 42 }, ip: '1.1.1.1' })).toBe('ip:1.1.1.1')
  })
})
