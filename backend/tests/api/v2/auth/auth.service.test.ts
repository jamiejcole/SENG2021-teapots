import { sha256 } from '../../../../src/models/hash'
import { HttpError } from '../../../../src/errors/HttpError'
import * as authService from '../../../../src/api/v2/auth/auth.service'
import UserModel from '../../../../src/models/user.model'
import * as authUtils from '../../../../src/utils/auth.utils'
import * as mailgun from '../../../../src/utils/mailgun.service'

jest.mock('../../../../src/models/user.model', () => {
  const userModel: any = jest.fn()
  userModel.findOne = jest.fn()
  userModel.findById = jest.fn()
  userModel.findByIdAndDelete = jest.fn()
  return {
    __esModule: true,
    default: userModel,
  }
})

jest.mock('../../../../src/utils/auth.utils', () => {
  const actual = jest.requireActual('../../../../src/utils/auth.utils')
  return {
    ...actual,
    hashPassword: jest.fn(),
    comparePasswords: jest.fn(),
    generateAccessToken: jest.fn(() => 'access-token'),
    generateRefreshToken: jest.fn(() => 'refresh-token'),
    generateTwoFactorCode: jest.fn(() => '123456'),
    generateTwoFactorExpiry: jest.fn(() => new Date('2026-01-01T00:10:00.000Z')),
    isTwoFactorCodeExpired: jest.fn(() => false),
    verifyToken: jest.fn(),
    generatePasswordResetToken: jest.fn(() => 'reset-token'),
    generatePasswordResetExpiry: jest.fn(() => new Date('2026-01-01T01:00:00.000Z')),
    isPasswordResetTokenExpired: jest.fn(() => false),
  }
})

jest.mock('../../../../src/utils/mailgun.service', () => ({
  sendTwoFactorCode: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}))

describe('auth.service', () => {
  const mockedUserModel = UserModel as jest.MockedFunction<any> & {
    findOne: jest.Mock
    findById: jest.Mock
    findByIdAndDelete: jest.Mock
  }

  const mockedAuthUtils = authUtils as jest.Mocked<typeof authUtils>
  const mockedMailgun = mailgun as jest.Mocked<typeof mailgun>

  function createUser(overrides: Partial<any> = {}) {
    const user: any = {
      _id: 'user-1',
      email: 'user@example.com',
      password: 'hashed-password',
      firstName: 'Jamie',
      lastName: 'Cole',
      phone: null,
      company: null,
      twoFactor: {
        code: '123456',
        expiresAt: new Date('2026-01-01T00:10:00.000Z'),
        isVerified: false,
      },
      passwordReset: {
        tokenHash: null,
        expiresAt: null,
      },
      save: jest.fn().mockImplementation(async () => user),
      ...overrides,
    }

    return user
  }

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.PUBLIC_APP_URL = 'https://example.com/'
    mockedAuthUtils.hashPassword.mockResolvedValue('hashed-password')
    mockedAuthUtils.comparePasswords.mockResolvedValue(true)
    mockedAuthUtils.verifyToken.mockReturnValue({
      userId: 'user-1',
      email: 'user@example.com',
      twoFactorVerified: true,
    })
  })

  it('signupUser validates required fields', async () => {
    await expect(authService.signupUser('', 'Password123!', 'Jamie', 'Cole')).rejects.toBeInstanceOf(HttpError)
    await expect(authService.signupUser('user@example.com', '', 'Jamie', 'Cole')).rejects.toBeInstanceOf(HttpError)
  })

  it('signupUser validates password length', async () => {
    await expect(authService.signupUser('user@example.com', 'short', 'Jamie', 'Cole')).rejects.toMatchObject({
      statusCode: 400,
      message: 'Password must be at least 8 characters',
    })
  })

  it('signupUser rejects duplicate users', async () => {
    mockedUserModel.findOne.mockResolvedValue(createUser())

    await expect(authService.signupUser('user@example.com', 'Password123!', 'Jamie', 'Cole')).rejects.toMatchObject({
      statusCode: 400,
      message: 'User already exists with this email',
    })
  })

  it('signupUser creates a user and sends 2FA email', async () => {
    const savedUser = createUser({ _id: 'new-user-1', email: 'new@example.com', firstName: 'New', lastName: 'User' })
    mockedUserModel.findOne.mockResolvedValue(null)
    mockedUserModel.mockImplementation(() => savedUser)
    mockedMailgun.sendTwoFactorCode.mockResolvedValue(undefined)

    const result = await authService.signupUser('NEW@example.com', 'Password123!', 'New', 'User')

    expect(result).toEqual({
      userId: 'new-user-1',
      email: 'new@example.com',
      message: 'Signup successful. Check your email for 2FA verification code.',
    })
    expect(mockedMailgun.sendTwoFactorCode).toHaveBeenCalledWith('new@example.com', '123456', 'New')
    expect(savedUser.save).toHaveBeenCalled()
  })

  it('signupUser deletes the user if 2FA email sending fails', async () => {
    const savedUser = createUser({ _id: 'new-user-2', email: 'new@example.com', firstName: 'New', lastName: 'User' })
    mockedUserModel.findOne.mockResolvedValue(null)
    mockedUserModel.mockImplementation(() => savedUser)
    mockedMailgun.sendTwoFactorCode.mockRejectedValue(new Error('mail failed'))
    mockedUserModel.findByIdAndDelete.mockResolvedValue(savedUser)

    await expect(authService.signupUser('new@example.com', 'Password123!', 'New', 'User')).rejects.toThrow('mail failed')
    expect(mockedUserModel.findByIdAndDelete).toHaveBeenCalledWith('new-user-2')
  })

  it('loginUser validates credentials and returns tokens', async () => {
    const user = createUser({ twoFactor: { ...createUser().twoFactor, isVerified: true } })
    mockedUserModel.findOne.mockResolvedValue(user)

    const result = await authService.loginUser('user@example.com', 'Password123!')

    expect(result).toEqual(
      expect.objectContaining({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        message: 'Login successful',
      }),
    )
    expect(authUtils.generateAccessToken).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        email: 'user@example.com',
        twoFactorVerified: true,
      }),
    )
  })

  it('loginUser rejects invalid credentials and unverified users', async () => {
    mockedUserModel.findOne.mockResolvedValue(null)
    await expect(authService.loginUser('missing@example.com', 'Password123!')).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid email or password',
    })

    mockedUserModel.findOne.mockResolvedValue(createUser())
    mockedAuthUtils.comparePasswords.mockResolvedValue(false)
    await expect(authService.loginUser('user@example.com', 'bad')).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid email or password',
    })

    mockedAuthUtils.comparePasswords.mockResolvedValue(true)
    await expect(authService.loginUser('user@example.com', 'Password123!')).rejects.toMatchObject({
      statusCode: 403,
      message: 'Please complete signup 2FA verification before signing in',
    })
  })

  it('verify2FACode validates inputs and returns tokens', async () => {
    const user = createUser()
    mockedUserModel.findById.mockResolvedValue(user)

    const result = await authService.verify2FACode('user-1', '123456')

    expect(result).toEqual(
      expect.objectContaining({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        message: '2FA verification successful',
      }),
    )
    expect(user.twoFactor.isVerified).toBe(true)
    expect(user.twoFactor.code).toBeNull()
    expect(user.twoFactor.expiresAt).toBeNull()
  })

  it('verify2FACode rejects invalid cases', async () => {
    await expect(authService.verify2FACode('', '123456')).rejects.toMatchObject({
      statusCode: 400,
      message: 'userId and code are required',
    })

    await expect(authService.verify2FACode('user-1', 'abc')).rejects.toMatchObject({
      statusCode: 400,
      message: 'Code must be a 6-digit number',
    })

    mockedUserModel.findById.mockResolvedValue(null)
    await expect(authService.verify2FACode('missing', '123456')).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid user',
    })

    mockedUserModel.findById.mockResolvedValue(createUser({ twoFactor: { code: '654321', expiresAt: new Date('2026-01-01T00:10:00.000Z'), isVerified: false } }))
    await expect(authService.verify2FACode('user-1', '123456')).rejects.toMatchObject({
      statusCode: 400,
      message: 'Invalid 2FA code',
    })

    mockedAuthUtils.isTwoFactorCodeExpired.mockReturnValue(true)
    mockedUserModel.findById.mockResolvedValue(createUser())
    await expect(authService.verify2FACode('user-1', '123456')).rejects.toMatchObject({
      statusCode: 400,
      message: '2FA code has expired',
    })
  })

  it('refreshAccessToken validates token, user lookup, and returns new access token', async () => {
    const user = createUser({ twoFactor: { ...createUser().twoFactor, isVerified: true } })
    mockedUserModel.findById.mockResolvedValue(user)

    const result = await authService.refreshAccessToken('refresh-token')

    expect(result).toEqual({
      accessToken: 'access-token',
      message: 'Access token refreshed',
    })
    expect(authUtils.verifyToken).toHaveBeenCalledWith('refresh-token')
  })

  it('refreshAccessToken rejects invalid inputs and users', async () => {
    await expect(authService.refreshAccessToken('')).rejects.toMatchObject({
      statusCode: 400,
      message: 'Refresh token is required',
    })

    mockedAuthUtils.verifyToken.mockImplementation(() => {
      throw new Error('bad token')
    })
    await expect(authService.refreshAccessToken('bad')).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid refresh token',
    })

    mockedAuthUtils.verifyToken.mockReturnValue({ userId: 'user-1', email: 'user@example.com', twoFactorVerified: true })
    mockedUserModel.findById.mockResolvedValue(null)
    await expect(authService.refreshAccessToken('refresh-token')).rejects.toMatchObject({
      statusCode: 401,
      message: 'User not found',
    })
  })

  it('getUserProfile validates and returns the user profile', async () => {
    const user = createUser({ phone: '123', company: 'Tea Co' })
    mockedUserModel.findById.mockResolvedValue(user)

    const result = await authService.getUserProfile('user-1')

    expect(result).toEqual(
      expect.objectContaining({
        email: 'user@example.com',
        phone: '123',
        company: 'Tea Co',
        message: 'User profile retrieved successfully',
      }),
    )
  })

  it('getUserProfile rejects invalid input and missing user', async () => {
    await expect(authService.getUserProfile('')).rejects.toMatchObject({
      statusCode: 400,
      message: 'User ID is required',
    })

    mockedUserModel.findById.mockResolvedValue(null)
    await expect(authService.getUserProfile('user-1')).rejects.toMatchObject({
      statusCode: 404,
      message: 'User not found',
    })
  })

  it('updateUserProfile validates, trims fields, and returns the updated profile', async () => {
    const user = createUser()
    mockedUserModel.findById.mockResolvedValue(user)

    const result = await authService.updateUserProfile('user-1', '  New  ', ' Last ', ' 123 ', '  Tea Co  ')

    expect(result).toEqual(
      expect.objectContaining({
        firstName: 'New',
        lastName: 'Last',
        phone: '123',
        company: 'Tea Co',
        message: 'Profile updated successfully',
      }),
    )
  })

  it('updateUserProfile rejects invalid input and missing user', async () => {
    await expect(authService.updateUserProfile('', 'A')).rejects.toMatchObject({
      statusCode: 400,
      message: 'User ID is required',
    })

    mockedUserModel.findById.mockResolvedValue(null)
    await expect(authService.updateUserProfile('user-1', 'A')).rejects.toMatchObject({
      statusCode: 404,
      message: 'User not found',
    })
  })

  it('requestPasswordReset validates input, stores hash, and sends email', async () => {
    const user = createUser()
    mockedUserModel.findOne.mockResolvedValue(user)
    mockedMailgun.sendPasswordResetEmail.mockResolvedValue(undefined)
    mockedAuthUtils.generatePasswordResetToken.mockReturnValue('reset-token')

    const result = await authService.requestPasswordReset('  user@example.com  ')

    expect(result).toEqual({
      message: 'If an account exists, a password reset link has been sent.',
    })
    expect(user.passwordReset.tokenHash).toBe(sha256('reset-token'))
    expect(user.passwordReset.expiresAt).toBeInstanceOf(Date)
    expect(mockedMailgun.sendPasswordResetEmail).toHaveBeenCalledWith(
      'user@example.com',
      expect.objectContaining({
        firstName: 'Jamie',
        resetLink: 'https://example.com/auth/reset-password?token=reset-token',
        expiresInMinutes: 60,
      }),
    )
  })

  it('requestPasswordReset handles missing user and send failures', async () => {
    await expect(authService.requestPasswordReset('')).rejects.toMatchObject({
      statusCode: 400,
      message: 'Email is required',
    })

    mockedUserModel.findOne.mockResolvedValue(null)
    await expect(authService.requestPasswordReset('missing@example.com')).resolves.toEqual({
      message: 'If an account exists, a password reset link has been sent.',
    })

    const user = createUser()
    mockedUserModel.findOne.mockResolvedValue(user)
    mockedMailgun.sendPasswordResetEmail.mockRejectedValue(new Error('mail failed'))
    await expect(authService.requestPasswordReset('user@example.com')).rejects.toThrow('mail failed')
    expect(user.passwordReset).toEqual({ tokenHash: null, expiresAt: null })
  })

  it('resetPassword validates input and resets the password', async () => {
    const user = createUser({ passwordReset: { tokenHash: sha256('reset-token'), expiresAt: new Date('2026-01-01T01:00:00.000Z') } })
    mockedUserModel.findOne.mockResolvedValue(user)

    const result = await authService.resetPassword('reset-token', 'Password123!')

    expect(result).toEqual({
      message: 'Password reset successful',
    })
    expect(authUtils.hashPassword).toHaveBeenCalledWith('Password123!')
    expect(user.passwordReset).toEqual({ tokenHash: null, expiresAt: null })
  })

  it('resetPassword rejects invalid inputs and expired links', async () => {
    await expect(authService.resetPassword('', 'Password123!')).rejects.toMatchObject({
      statusCode: 400,
      message: 'Reset token is required',
    })

    await expect(authService.resetPassword('reset-token', '')).rejects.toMatchObject({
      statusCode: 400,
      message: 'Password is required',
    })

    await expect(authService.resetPassword('reset-token', 'short')).rejects.toMatchObject({
      statusCode: 400,
      message: 'Password must be at least 8 characters',
    })

    mockedUserModel.findOne.mockResolvedValue(null)
    await expect(authService.resetPassword('reset-token', 'Password123!')).rejects.toMatchObject({
      statusCode: 400,
      message: 'Invalid or expired password reset link',
    })

    mockedUserModel.findOne.mockResolvedValue(createUser({ passwordReset: { tokenHash: sha256('reset-token'), expiresAt: new Date('2020-01-01T00:00:00.000Z') } }))
    mockedAuthUtils.isPasswordResetTokenExpired.mockReturnValue(true)
    await expect(authService.resetPassword('reset-token', 'Password123!')).rejects.toMatchObject({
      statusCode: 400,
      message: 'Invalid or expired password reset link',
    })
  })
})
