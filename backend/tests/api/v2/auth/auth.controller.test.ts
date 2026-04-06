import * as authController from '../../../../src/api/v2/auth/auth.controller'
import * as authService from '../../../../src/api/v2/auth/auth.service'

jest.mock('../../../../src/api/v2/auth/auth.service', () => ({
  signupUser: jest.fn(),
  loginUser: jest.fn(),
  verify2FACode: jest.fn(),
  refreshAccessToken: jest.fn(),
  getUserProfile: jest.fn(),
  updateUserProfile: jest.fn(),
  requestPasswordReset: jest.fn(),
  resetPassword: jest.fn(),
}))

describe('auth.controller', () => {
  const mockedAuthService = authService as jest.Mocked<typeof authService>

  function createResponse() {
    const response: any = {}
    response.status = jest.fn().mockReturnValue(response)
    response.json = jest.fn().mockReturnValue(response)
    response.set = jest.fn().mockReturnValue(response)
    response.send = jest.fn().mockReturnValue(response)
    return response
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('signup delegates to the service', async () => {
    mockedAuthService.signupUser.mockResolvedValue({ message: 'ok' } as any)
    const response = createResponse()
    const next = jest.fn()

    await authController.signup({ body: { email: 'user@example.com', password: 'Password123!', firstName: 'Jamie', lastName: 'Cole' } } as any, response, next)

    expect(mockedAuthService.signupUser).toHaveBeenCalledWith('user@example.com', 'Password123!', 'Jamie', 'Cole')
    expect(response.status).toHaveBeenCalledWith(201)
  })

  it('login delegates to the service', async () => {
    mockedAuthService.loginUser.mockResolvedValue({ accessToken: 'a' } as any)
    const response = createResponse()
    const next = jest.fn()

    await authController.login({ body: { email: 'user@example.com', password: 'Password123!' } } as any, response, next)

    expect(mockedAuthService.loginUser).toHaveBeenCalledWith('user@example.com', 'Password123!')
    expect(response.json).toHaveBeenCalledWith({ accessToken: 'a' })
  })

  it('verify2FA delegates to the service', async () => {
    mockedAuthService.verify2FACode.mockResolvedValue({ accessToken: 'a' } as any)
    const response = createResponse()
    const next = jest.fn()

    await authController.verify2FA({ body: { userId: 'user-1', code: '123456' } } as any, response, next)

    expect(mockedAuthService.verify2FACode).toHaveBeenCalledWith('user-1', '123456')
    expect(response.status).toHaveBeenCalledWith(200)
  })

  it('refreshToken delegates to the service', async () => {
    mockedAuthService.refreshAccessToken.mockResolvedValue({ accessToken: 'a' } as any)
    const response = createResponse()
    const next = jest.fn()

    await authController.refreshToken({ body: { refreshToken: 'refresh-token' } } as any, response, next)

    expect(mockedAuthService.refreshAccessToken).toHaveBeenCalledWith('refresh-token')
    expect(response.json).toHaveBeenCalledWith({ accessToken: 'a' })
  })

  it('getUser returns 401 when there is no authenticated user', async () => {
    const response = createResponse()
    const next = jest.fn()

    await authController.getUser({} as any, response, next)

    expect(response.status).toHaveBeenCalledWith(401)
    expect(response.json).toHaveBeenCalledWith({ message: 'Not authenticated' })
  })

  it('getUser delegates to the service when authenticated', async () => {
    mockedAuthService.getUserProfile.mockResolvedValue({ email: 'user@example.com' } as any)
    const response = createResponse()
    const next = jest.fn()

    await authController.getUser({ user: { userId: 'user-1' } } as any, response, next)

    expect(mockedAuthService.getUserProfile).toHaveBeenCalledWith('user-1')
    expect(response.json).toHaveBeenCalledWith({ email: 'user@example.com' })
  })

  it('updateUser returns 401 when there is no authenticated user', async () => {
    const response = createResponse()
    const next = jest.fn()

    await authController.updateUser({ body: { firstName: 'New' } } as any, response, next)

    expect(response.status).toHaveBeenCalledWith(401)
    expect(response.json).toHaveBeenCalledWith({ message: 'Not authenticated' })
  })

  it('updateUser delegates to the service when authenticated', async () => {
    mockedAuthService.updateUserProfile.mockResolvedValue({ message: 'Profile updated successfully' } as any)
    const response = createResponse()
    const next = jest.fn()

    await authController.updateUser({ user: { userId: 'user-1' }, body: { firstName: 'New', lastName: 'Name' } } as any, response, next)

    expect(mockedAuthService.updateUserProfile).toHaveBeenCalledWith('user-1', 'New', 'Name', undefined, undefined)
    expect(response.json).toHaveBeenCalledWith({ message: 'Profile updated successfully' })
  })

  it('requestPasswordReset delegates to the service', async () => {
    mockedAuthService.requestPasswordReset.mockResolvedValue({ message: 'sent' } as any)
    const response = createResponse()
    const next = jest.fn()

    await authController.requestPasswordReset({ body: { email: 'user@example.com' } } as any, response, next)

    expect(mockedAuthService.requestPasswordReset).toHaveBeenCalledWith('user@example.com')
    expect(response.json).toHaveBeenCalledWith({ message: 'sent' })
  })

  it('resetPassword delegates to the service', async () => {
    mockedAuthService.resetPassword.mockResolvedValue({ message: 'done' } as any)
    const response = createResponse()
    const next = jest.fn()

    await authController.resetPassword({ body: { token: 'reset-token', password: 'Password123!' } } as any, response, next)

    expect(mockedAuthService.resetPassword).toHaveBeenCalledWith('reset-token', 'Password123!')
    expect(response.json).toHaveBeenCalledWith({ message: 'done' })
  })
})
