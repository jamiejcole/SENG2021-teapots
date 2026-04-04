import jwt from 'jsonwebtoken'
import { generateAccessToken } from '../../src/utils/auth.utils'

describe('generateAccessToken', () => {
  it('sets a one week expiry by default', () => {
    const token = generateAccessToken({
      userId: 'user-123',
      email: 'user@example.com',
      twoFactorVerified: true,
    })

    const decoded = jwt.decode(token) as { exp?: number; iat?: number } | null

    expect(decoded).not.toBeNull()
    expect(decoded?.exp).toBeDefined()
    expect(decoded?.iat).toBeDefined()
    expect(decoded!.exp! - decoded!.iat!).toBe(60 * 60 * 24 * 7)
  })
})