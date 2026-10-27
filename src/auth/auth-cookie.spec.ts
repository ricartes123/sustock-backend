import type { Request } from 'express';
import { AUTH_COOKIE, readAuthCookie } from './auth-cookie';

function requestWithCookie(cookie?: string): Request {
  return { headers: cookie === undefined ? {} : { cookie } } as Request;
}

describe('readAuthCookie', () => {
  it('extracts the session token among other cookies', () => {
    const request = requestWithCookie(`theme=dark; ${AUTH_COOKIE}=abc.def.ghi; other=1`);
    expect(readAuthCookie(request)).toBe('abc.def.ghi');
  });

  it('returns null when the cookie is missing', () => {
    expect(readAuthCookie(requestWithCookie())).toBeNull();
    expect(readAuthCookie(requestWithCookie('theme=dark'))).toBeNull();
  });

  it('does not match cookies whose name only starts with the session name', () => {
    expect(readAuthCookie(requestWithCookie(`${AUTH_COOKIE}_old=stale`))).toBeNull();
  });
});
