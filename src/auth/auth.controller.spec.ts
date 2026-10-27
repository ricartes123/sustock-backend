import type { Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AUTH_COOKIE } from './auth-cookie';

describe('AuthController', () => {
  const profile = { id: 'u1', email: 'a@b.com', firstName: 'A', lastName: 'B', workspaces: [], teamMemberships: [] };
  const authService = {
    login: jest.fn().mockResolvedValue({ userId: 'u1', accessToken: 'jwt-token' }),
    register: jest.fn().mockResolvedValue({ userId: 'u1', accessToken: 'jwt-token' }),
    getProfile: jest.fn().mockResolvedValue(profile),
  };
  const controller = new AuthController(authService as unknown as AuthService);
  const res = { cookie: jest.fn(), clearCookie: jest.fn() };

  beforeEach(() => jest.clearAllMocks());

  it('sets an httpOnly strict cookie on login and never returns the token', async () => {
    const body = await controller.login({ email: 'a@b.com', password: 'secret1' }, res as unknown as Response);

    expect(res.cookie).toHaveBeenCalledWith(
      AUTH_COOKIE,
      'jwt-token',
      expect.objectContaining({ httpOnly: true, sameSite: 'strict', maxAge: 86_400_000 }),
    );
    expect(body).toEqual(profile);
    expect(JSON.stringify(body)).not.toContain('jwt-token');
  });

  it('returns the public profile on register', async () => {
    const body = await controller.register(
      { email: 'a@b.com', password: 'secret1', firstName: 'A', lastName: 'B', workspaceName: 'W' },
      res as unknown as Response,
    );

    expect(res.cookie).toHaveBeenCalled();
    expect(body).toEqual(profile);
  });

  it('clears the cookie on logout', () => {
    controller.logout(res as unknown as Response);
    expect(res.clearCookie).toHaveBeenCalledWith(AUTH_COOKIE, expect.objectContaining({ httpOnly: true }));
  });
});
