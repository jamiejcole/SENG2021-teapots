import { HttpError } from '../../../../src/errors/HttpError'

jest.mock('../../../../src/utils/auth.utils', () => ({
  verifyToken: jest.fn(),
}))

import { authMiddleware, optionalAuthMiddleware } from '../../../../src/middleware/auth.middleware'
import { requestContextMiddleware } from '../../../../src/middleware/requestContext.middleware'
import { verifyToken } from '../../../../src/utils/auth.utils'

describe('middleware', () => {
  const mockedVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>

  function createRequest(overrides: any = {}) {
    return {
      headers: {},
      requestId: undefined,
      user: undefined,
      get: jest.fn(),
      ...overrides,
    } as any
  }

  function createResponse() {
    const response: any = {}
    response.setHeader = jest.fn()
    response.on = jest.fn((event, callback) => {
      if (event === 'finish') {
        response._finishCallback = callback
      }
    })
    response.statusCode = 200
    return response
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('authMiddleware rejects missing and invalid authorization headers', () => {
    const next = jest.fn()

    authMiddleware(createRequest(), {} as any, next)
    expect(next).toHaveBeenCalledWith(expect.any(HttpError))

    next.mockClear()
    authMiddleware(createRequest({ headers: { authorization: 'Token abc' } }), {} as any, next)
    expect(next).toHaveBeenCalledWith(expect.any(HttpError))
  })

  it('authMiddleware rejects invalid and unverified tokens, then attaches a verified user', () => {
    const next = jest.fn()

    mockedVerifyToken.mockImplementation(() => {
      throw new Error('bad token')
    })
    authMiddleware(createRequest({ headers: { authorization: 'Bearer bad' } }), {} as any, next)
    expect(next).toHaveBeenCalledWith(expect.any(HttpError))

    next.mockClear()
    mockedVerifyToken.mockReturnValue({ userId: 'user-1', email: 'user@example.com', twoFactorVerified: false })
    authMiddleware(createRequest({ headers: { authorization: 'Bearer token' } }), {} as any, next)
    expect(next).toHaveBeenCalledWith(expect.any(HttpError))

    next.mockClear()
    mockedVerifyToken.mockReturnValue({ userId: 'user-1', email: 'user@example.com', twoFactorVerified: true })
    const req = createRequest({ headers: { authorization: 'Bearer token' } })
    authMiddleware(req, {} as any, next)

    expect(req.user).toEqual({ userId: 'user-1', email: 'user@example.com', twoFactorVerified: true })
    expect(next).toHaveBeenCalledWith()
  })

  it('optionalAuthMiddleware ignores invalid tokens and accepts valid ones', () => {
    const next = jest.fn()

    optionalAuthMiddleware(createRequest(), {} as any, next)
    expect(next).toHaveBeenCalledWith()

    next.mockClear()
    mockedVerifyToken.mockImplementation(() => {
      throw new Error('bad token')
    })
    const reqWithBadToken = createRequest({ headers: { authorization: 'Bearer bad' } })
    optionalAuthMiddleware(reqWithBadToken, {} as any, next)
    expect(reqWithBadToken.user).toBeUndefined()
    expect(next).toHaveBeenCalledWith()

    next.mockClear()
    mockedVerifyToken.mockReturnValue({ userId: 'user-1', email: 'user@example.com', twoFactorVerified: true })
    const reqWithToken = createRequest({ headers: { authorization: 'Bearer token' } })
    optionalAuthMiddleware(reqWithToken, {} as any, next)
    expect(reqWithToken.user).toEqual({ userId: 'user-1', email: 'user@example.com', twoFactorVerified: true })
    expect(next).toHaveBeenCalledWith()
  })

  it('requestContextMiddleware uses incoming request ids when present', () => {
    const req = createRequest({ headers: { 'x-request-id': 'request-123' } })
    const res = createResponse()
    const next = jest.fn()

    requestContextMiddleware(req, res, next)

    expect(req.requestId).toBe('request-123')
    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', 'request-123')
    expect(next).toHaveBeenCalledWith()
  })

  it('requestContextMiddleware generates a request id when missing', () => {
    const req = createRequest()
    const res = createResponse()
    const next = jest.fn()

    requestContextMiddleware(req, res, next)

    expect(req.requestId).toMatch(/[0-9a-f-]{36}/)
    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', expect.any(String))
    expect(next).toHaveBeenCalledWith()
  })

  it('errorMiddleware returns the correct status and logs in production mode', () => {
    jest.resetModules()
    const originalNodeEnv = process.env.NODE_ENV
    const originalWorkerId = process.env.JEST_WORKER_ID
    delete process.env.JEST_WORKER_ID
    process.env.NODE_ENV = 'production'

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    const { HttpError: IsolatedHttpError } = require('../../../../src/errors/HttpError')
    const { errorMiddleware } = require('../../../../src/middleware/error.middleware')

    const response: any = { status: jest.fn().mockReturnThis(), json: jest.fn() }
    const request: any = {
      requestId: 'request-1',
      method: 'GET',
      originalUrl: '/api/test',
      route: { path: '/test' },
      ip: '127.0.0.1',
      headers: { origin: 'http://example.com', 'x-forwarded-for': '10.0.0.1, 10.0.0.2' },
      get: jest.fn().mockReturnValue('jest'),
      user: { userId: 'user-1', email: 'user@example.com', twoFactorVerified: true },
    }

    errorMiddleware(new IsolatedHttpError(404, 'Missing'), request, response, jest.fn())

    expect(response.status).toHaveBeenCalledWith(404)
    expect(response.json).toHaveBeenCalledWith({ error: 'Not Found', message: 'Missing' })
    expect(consoleErrorSpy).toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
    process.env.NODE_ENV = originalNodeEnv
    if (originalWorkerId === undefined) {
      delete process.env.JEST_WORKER_ID
    } else {
      process.env.JEST_WORKER_ID = originalWorkerId
    }
    jest.resetModules()
  })

  it('errorMiddleware handles generic errors in test mode', () => {
    jest.resetModules()
    const { errorMiddleware } = require('../../../../src/middleware/error.middleware')
    const response: any = { status: jest.fn().mockReturnThis(), json: jest.fn() }

    errorMiddleware(new Error('boom'), { headers: {}, get: jest.fn() } as any, response, jest.fn())

    expect(response.status).toHaveBeenCalledWith(500)
    expect(response.json).toHaveBeenCalledWith({ error: 'Internal Server Error', message: 'boom' })
    jest.resetModules()
  })
})
