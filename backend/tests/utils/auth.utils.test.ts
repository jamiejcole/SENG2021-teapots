import {
  hashPassword,
  comparePasswords,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  generateTwoFactorCode,
  generateTwoFactorExpiry,
  isTwoFactorCodeExpired,
  generatePasswordResetToken,
  generatePasswordResetExpiry,
  isPasswordResetTokenExpired,
  type JWTPayload,
} from '../../src/utils/auth.utils';

describe('auth.utils', () => {
  const originalSecret = process.env.JWT_SECRET;
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-for-jest';
  });
  afterAll(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  it('hashes and compares passwords', async () => {
    const h = await hashPassword('password123');
    expect(h).not.toBe('password123');
    await expect(comparePasswords('password123', h)).resolves.toBe(true);
    await expect(comparePasswords('wrong', h)).resolves.toBe(false);
  });

  it('JWT round-trip', () => {
    const payload: JWTPayload = {
      userId: 'u1',
      email: 'e@x.com',
      twoFactorVerified: true,
    };
    const access = generateAccessToken(payload);
    const refresh = generateRefreshToken(payload);
    expect(verifyToken(access)).toMatchObject(payload);
    expect(verifyToken(refresh).userId).toBe('u1');
  });

  it('verifyToken throws on bad token', () => {
    expect(() => verifyToken('not.a.jwt')).toThrow();
  });

  it('2FA helpers', () => {
    const code = generateTwoFactorCode();
    expect(code.length).toBe(6);
    expect(/^\d+$/.test(code)).toBe(true);
    const exp = generateTwoFactorExpiry();
    expect(exp.getTime()).toBeGreaterThan(Date.now());
    expect(isTwoFactorCodeExpired(undefined)).toBe(true);
    expect(isTwoFactorCodeExpired(new Date(0))).toBe(true);
  });

  it('password reset helpers', () => {
    const t = generatePasswordResetToken();
    expect(t.length).toBeGreaterThan(10);
    const e = generatePasswordResetExpiry();
    expect(e.getTime()).toBeGreaterThan(Date.now());
    expect(isPasswordResetTokenExpired(null)).toBe(true);
  });
});
