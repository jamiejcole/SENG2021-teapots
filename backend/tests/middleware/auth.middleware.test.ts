import { authMiddleware, optionalAuthMiddleware } from '../../src/middleware/auth.middleware';
import * as authUtils from '../../src/utils/auth.utils';
import { HttpError } from '../../src/errors/HttpError';

describe('auth.middleware', () => {
  const originalSecret = process.env.JWT_SECRET;
  beforeAll(() => {
    process.env.JWT_SECRET = 'mw-test-secret';
  });
  afterAll(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  it('authMiddleware rejects missing header', () => {
    const next = jest.fn();
    authMiddleware({ headers: {} } as any, {} as any, next);
    expect(next.mock.calls[0][0]).toBeInstanceOf(HttpError);
    expect(next.mock.calls[0][0].statusCode).toBe(401);
  });

  it('authMiddleware rejects bad bearer format', () => {
    const next = jest.fn();
    authMiddleware({ headers: { authorization: 'Basic x' } } as any, {} as any, next);
    expect(next.mock.calls[0][0].statusCode).toBe(401);
  });

  it('authMiddleware attaches user when token valid', () => {
    const payload = { userId: 'u', email: 'e@e.com', twoFactorVerified: true };
    const token = authUtils.generateAccessToken(payload);
    const next = jest.fn();
    const req = { headers: { authorization: `Bearer ${token}` } } as any;
    authMiddleware(req, {} as any, next);
    expect(req.user).toMatchObject(payload);
    expect(next).toHaveBeenCalledWith();
  });

  it('authMiddleware 403 when 2FA not verified in token', () => {
    jest.spyOn(authUtils, 'verifyToken').mockReturnValueOnce({
      userId: 'u',
      email: 'e',
      twoFactorVerified: false,
    });
    const next = jest.fn();
    authMiddleware({ headers: { authorization: 'Bearer t' } } as any, {} as any, next);
    expect(next.mock.calls[0][0].statusCode).toBe(403);
    jest.restoreAllMocks();
  });

  it('optionalAuthMiddleware sets user when valid', () => {
    const payload = { userId: 'u2', email: 'e2@e.com', twoFactorVerified: true };
    const token = authUtils.generateAccessToken(payload);
    const next = jest.fn();
    const req = { headers: { authorization: `Bearer ${token}` } } as any;
    optionalAuthMiddleware(req, {} as any, next);
    expect(req.user).toMatchObject(payload);
  });

  it('optionalAuthMiddleware ignores invalid token', () => {
    const next = jest.fn();
    const req = { headers: { authorization: 'Bearer bad' } } as any;
    optionalAuthMiddleware(req, {} as any, next);
    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });
});
