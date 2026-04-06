import {
  comparePasswords,
  generateAccessToken,
  generatePasswordResetExpiry,
  generatePasswordResetToken,
  generateRefreshToken,
  generateTwoFactorCode,
  generateTwoFactorExpiry,
  hashPassword,
  isPasswordResetTokenExpired,
  isTwoFactorCodeExpired,
  verifyToken,
} from '../../../../src/utils/auth.utils'

describe('auth.utils', () => {
  it('hashes and compares passwords', async () => {
    const hash = await hashPassword('Password123!')

    expect(hash).not.toBe('Password123!')
    await expect(comparePasswords('Password123!', hash)).resolves.toBe(true)
    await expect(comparePasswords('wrong-password', hash)).resolves.toBe(false)
  })

  it('generates and verifies jwt tokens', () => {
    const payload = { userId: 'user-1', email: 'user@example.com', twoFactorVerified: true }

    const accessToken = generateAccessToken(payload)
    const refreshToken = generateRefreshToken(payload)

    expect(verifyToken(accessToken)).toMatchObject(payload)
    expect(verifyToken(refreshToken)).toMatchObject(payload)
  })

  it('generates 2fa and password reset values', () => {
    const code = generateTwoFactorCode()
    const twoFactorExpiry = generateTwoFactorExpiry()
    const passwordResetToken = generatePasswordResetToken()
    const passwordResetExpiry = generatePasswordResetExpiry()

    expect(code).toMatch(/^\d{6}$/)
    expect(twoFactorExpiry.getTime()).toBeGreaterThan(Date.now())
    expect(passwordResetToken).toMatch(/^[a-f0-9]{64}$/)
    expect(passwordResetExpiry.getTime()).toBeGreaterThan(Date.now())
  })

  it('detects expired 2fa and password reset tokens', () => {
    expect(isTwoFactorCodeExpired(null)).toBe(true)
    expect(isTwoFactorCodeExpired(undefined)).toBe(true)
    expect(isTwoFactorCodeExpired(new Date(Date.now() + 60_000))).toBe(false)
    expect(isTwoFactorCodeExpired(new Date(Date.now() - 60_000))).toBe(true)

    expect(isPasswordResetTokenExpired(null)).toBe(true)
    expect(isPasswordResetTokenExpired(undefined)).toBe(true)
    expect(isPasswordResetTokenExpired(new Date(Date.now() + 60_000))).toBe(false)
    expect(isPasswordResetTokenExpired(new Date(Date.now() - 60_000))).toBe(true)
  })
})
