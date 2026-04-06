import * as authController from '../../../../src/api/v2/auth/auth.controller';
import * as authService from '../../../../src/api/v2/auth/auth.service';

jest.mock('../../../../src/api/v2/auth/auth.service', () => ({
  signupUser: jest.fn(),
  loginUser: jest.fn(),
  verify2FACode: jest.fn(),
  refreshAccessToken: jest.fn(),
  getUserProfile: jest.fn(),
  updateUserProfile: jest.fn(),
  requestPasswordReset: jest.fn(),
  resetPassword: jest.fn(),
}));

function flushPromises() {
  return new Promise<void>((resolve) => setImmediate(resolve));
}

function res() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as any;
}

describe('auth.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('signup', async () => {
    (authService.signupUser as jest.Mock).mockResolvedValue({ ok: 1 });
    const r = res();
    authController.signup(
      { body: { email: 'a@b.com', password: 'x', firstName: 'a', lastName: 'b' } } as any,
      r,
      jest.fn()
    );
    await flushPromises();
    expect(r.status).toHaveBeenCalledWith(201);
  });

  it('getUser 401 without user', async () => {
    const r = res();
    authController.getUser({} as any, r, jest.fn());
    await flushPromises();
    expect(r.status).toHaveBeenCalledWith(401);
  });

  it('getUser 200', async () => {
    (authService.getUserProfile as jest.Mock).mockResolvedValue({ email: 'e' });
    const r = res();
    authController.getUser({ user: { userId: 'u1' } } as any, r, jest.fn());
    await flushPromises();
    expect(r.status).toHaveBeenCalledWith(200);
  });

  it('updateUser and password reset handlers', async () => {
    (authService.updateUserProfile as jest.Mock).mockResolvedValue({});
    const r = res();
    authController.updateUser(
      { user: { userId: 'u' }, body: { firstName: 'a' } } as any,
      r,
      jest.fn()
    );
    await flushPromises();
    expect(authService.updateUserProfile).toHaveBeenCalled();

    (authService.requestPasswordReset as jest.Mock).mockResolvedValue({ message: 'ok' });
    const r2 = res();
    authController.requestPasswordReset({ body: { email: 'e@e.com' } } as any, r2, jest.fn());
    await flushPromises();
    expect(r2.status).toHaveBeenCalledWith(200);

    (authService.resetPassword as jest.Mock).mockResolvedValue({ message: 'ok' });
    const r3 = res();
    authController.resetPassword({ body: { token: 't', password: 'pw12345678' } } as any, r3, jest.fn());
    await flushPromises();
    expect(r3.status).toHaveBeenCalledWith(200);
  });
});
