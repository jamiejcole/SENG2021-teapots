import * as authService from '../../../../src/api/v2/auth/auth.service';
import UserModel from '../../../../src/models/user.model';
import * as mailgun from '../../../../src/utils/mailgun.service';
import * as authUtils from '../../../../src/utils/auth.utils';
import { sha256 } from '../../../../src/models/hash';

const mockSave = jest.fn();

jest.mock('../../../../src/models/user.model', () => {
  function MockUser(this: any, doc: any) {
    Object.assign(this, doc);
    this._id = { toString: () => '507f191e810c19729de860ea' };
    this.save = mockSave;
  }
  (MockUser as any).findOne = jest.fn();
  (MockUser as any).findById = jest.fn();
  (MockUser as any).findByIdAndDelete = jest.fn();
  return { __esModule: true, default: MockUser as any };
});

jest.mock('../../../../src/utils/mailgun.service', () => ({
  sendTwoFactorCode: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}));

const uid = '507f191e810c19729de860ea';

describe('auth.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSave.mockResolvedValue({
      _id: { toString: () => uid },
      email: 'u@example.com',
      firstName: 'F',
    });
  });

  describe('signupUser', () => {
    it('validates fields', async () => {
      await expect(authService.signupUser('', 'x', 'a', 'b')).rejects.toMatchObject({ statusCode: 400 });
      await expect(
        authService.signupUser('a@b.com', 'short', 'a', 'b')
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('rejects duplicate email', async () => {
      (UserModel.findOne as jest.Mock).mockResolvedValue({ _id: 'x' });
      await expect(
        authService.signupUser('a@b.com', 'password123', 'a', 'b')
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('rolls back user when email send fails', async () => {
      (UserModel.findOne as jest.Mock).mockResolvedValue(null);
      (mailgun.sendTwoFactorCode as jest.Mock).mockRejectedValue(new Error('mail'));
      await expect(
        authService.signupUser('a@b.com', 'password123', 'a', 'b')
      ).rejects.toThrow('mail');
      expect(UserModel.findByIdAndDelete).toHaveBeenCalled();
    });

    it('creates user when email sends', async () => {
      (UserModel.findOne as jest.Mock).mockResolvedValue(null);
      (mailgun.sendTwoFactorCode as jest.Mock).mockResolvedValue(undefined);
      const out = await authService.signupUser('new@example.com', 'password123', 'F', 'L');
      expect(out.userId).toBe(uid);
      expect(mockSave).toHaveBeenCalled();
    });
  });

  describe('loginUser', () => {
    it('validates and rejects unknown user', async () => {
      await expect(authService.loginUser('', '')).rejects.toMatchObject({ statusCode: 400 });
      (UserModel.findOne as jest.Mock).mockResolvedValue(null);
      await expect(authService.loginUser('a@b.com', 'x')).rejects.toMatchObject({ statusCode: 401 });
    });

    it('rejects bad password and unverified 2FA', async () => {
      const user = {
        password: 'hash',
        twoFactor: { isVerified: true },
      };
      (UserModel.findOne as jest.Mock).mockResolvedValue(user);
      jest.spyOn(authUtils, 'comparePasswords').mockResolvedValueOnce(false);
      await expect(authService.loginUser('a@b.com', 'x')).rejects.toMatchObject({ statusCode: 401 });

      jest.spyOn(authUtils, 'comparePasswords').mockResolvedValueOnce(true);
      (UserModel.findOne as jest.Mock).mockResolvedValue({
        ...user,
        twoFactor: { isVerified: false },
        _id: { toString: () => uid },
        email: 'a@b.com',
        firstName: 'F',
        lastName: 'L',
      });
      await expect(authService.loginUser('a@b.com', 'x')).rejects.toMatchObject({ statusCode: 403 });
    });

    it('returns tokens when ok', async () => {
      jest.spyOn(authUtils, 'comparePasswords').mockResolvedValue(true);
      jest.spyOn(authUtils, 'generateAccessToken').mockReturnValue('a');
      jest.spyOn(authUtils, 'generateRefreshToken').mockReturnValue('r');
      (UserModel.findOne as jest.Mock).mockResolvedValue({
        _id: { toString: () => uid },
        email: 'a@b.com',
        password: 'h',
        firstName: 'F',
        lastName: 'L',
        twoFactor: { isVerified: true },
        phone: null,
        company: null,
      });
      const out = await authService.loginUser('a@b.com', 'password123');
      expect(out.accessToken).toBe('a');
      jest.restoreAllMocks();
    });
  });

  describe('verify2FACode', () => {
    it('validates format and user', async () => {
      await expect(authService.verify2FACode('', '')).rejects.toMatchObject({ statusCode: 400 });
      await expect(authService.verify2FACode(uid, '12')).rejects.toMatchObject({ statusCode: 400 });
      (UserModel.findById as jest.Mock).mockResolvedValue(null);
      await expect(authService.verify2FACode(uid, '123456')).rejects.toMatchObject({ statusCode: 401 });
    });

    it('rejects wrong or expired code', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue({
        _id: { toString: () => uid },
        email: 'e',
        twoFactor: { code: '111111', expiresAt: new Date(Date.now() + 60000) },
        save: jest.fn().mockResolvedValue(undefined),
      });
      await expect(authService.verify2FACode(uid, '999999')).rejects.toMatchObject({ statusCode: 400 });
      jest.spyOn(authUtils, 'isTwoFactorCodeExpired').mockReturnValueOnce(true);
      (UserModel.findById as jest.Mock).mockResolvedValue({
        _id: { toString: () => uid },
        email: 'e',
        twoFactor: { code: '123456', expiresAt: new Date(0) },
      });
      await expect(authService.verify2FACode(uid, '123456')).rejects.toMatchObject({ statusCode: 400 });
      jest.restoreAllMocks();
    });

    it('success path', async () => {
      const save = jest.fn().mockResolvedValue(undefined);
      (UserModel.findById as jest.Mock).mockResolvedValue({
        _id: { toString: () => uid },
        email: 'e',
        twoFactor: { code: '654321', expiresAt: new Date(Date.now() + 60000), isVerified: false },
        save,
      });
      jest.spyOn(authUtils, 'generateAccessToken').mockReturnValue('a');
      jest.spyOn(authUtils, 'generateRefreshToken').mockReturnValue('r');
      await expect(authService.verify2FACode(uid, '654321')).resolves.toMatchObject({
        message: '2FA verification successful',
      });
      expect(save).toHaveBeenCalled();
      jest.restoreAllMocks();
    });
  });

  describe('refreshAccessToken', () => {
    it('400 when missing token', async () => {
      await expect(authService.refreshAccessToken('')).rejects.toMatchObject({ statusCode: 400 });
    });

    it('401 on bad jwt', async () => {
      await expect(authService.refreshAccessToken('bad')).rejects.toMatchObject({ statusCode: 401 });
    });

    it('success', async () => {
      jest.spyOn(authUtils, 'verifyToken').mockReturnValue({ userId: uid, email: 'e', twoFactorVerified: true });
      (UserModel.findById as jest.Mock).mockResolvedValue({
        _id: { toString: () => uid },
        email: 'e',
      });
      jest.spyOn(authUtils, 'generateAccessToken').mockReturnValue('new');
      await expect(authService.refreshAccessToken('tok')).resolves.toMatchObject({
        accessToken: 'new',
      });
      jest.restoreAllMocks();
    });
  });

  describe('profiles', () => {
    it('getUserProfile', async () => {
      await expect(authService.getUserProfile('')).rejects.toMatchObject({ statusCode: 400 });
      (UserModel.findById as jest.Mock).mockResolvedValue(null);
      await expect(authService.getUserProfile(uid)).rejects.toMatchObject({ statusCode: 404 });
      (UserModel.findById as jest.Mock).mockResolvedValue({
        email: 'e',
        firstName: 'a',
        lastName: 'b',
        phone: null,
        company: null,
      });
      await expect(authService.getUserProfile(uid)).resolves.toMatchObject({
        email: 'e',
      });
    });

    it('updateUserProfile', async () => {
      const save = jest.fn().mockResolvedValue({
        email: 'e',
        firstName: 'n',
        lastName: 'l',
        phone: null,
        company: null,
      });
      (UserModel.findById as jest.Mock).mockResolvedValue({
        firstName: 'o',
        lastName: 'o',
        save,
      });
      await expect(
        authService.updateUserProfile(uid, 'n', 'l', '  ', undefined)
      ).resolves.toMatchObject({ message: 'Profile updated successfully' });
    });
  });

  describe('password reset', () => {
    it('requestPasswordReset validates email', async () => {
      await expect(authService.requestPasswordReset('')).rejects.toMatchObject({ statusCode: 400 });
    });

    it('requestPasswordReset noop when user missing', async () => {
      (UserModel.findOne as jest.Mock).mockResolvedValue(null);
      await expect(authService.requestPasswordReset('no@one.com')).resolves.toMatchObject({
        message: expect.stringContaining('If an account exists'),
      });
    });

    it('requestPasswordReset clears token when email fails', async () => {
      const save = jest.fn().mockResolvedValue(undefined);
      (UserModel.findOne as jest.Mock).mockResolvedValue({
        email: 'e@e.com',
        firstName: 'F',
        passwordReset: {},
        save,
      });
      (mailgun.sendPasswordResetEmail as jest.Mock).mockRejectedValueOnce(new Error('mg'));
      await expect(authService.requestPasswordReset('e@e.com')).rejects.toThrow('mg');
      expect(save).toHaveBeenCalled();
    });

    it('resetPassword validates and completes', async () => {
      await expect(authService.resetPassword('', 'pw')).rejects.toMatchObject({ statusCode: 400 });
      await expect(authService.resetPassword('t', '')).rejects.toMatchObject({ statusCode: 400 });
      await expect(authService.resetPassword('t', 'short')).rejects.toMatchObject({ statusCode: 400 });
      (UserModel.findOne as jest.Mock).mockResolvedValue(null);
      await expect(authService.resetPassword('tok', 'password123')).rejects.toMatchObject({
        statusCode: 400,
      });
      const token = 'good-token';
      const save = jest.fn().mockResolvedValue(undefined);
      (UserModel.findOne as jest.Mock).mockResolvedValue({
        passwordReset: { tokenHash: sha256(token), expiresAt: new Date(Date.now() + 60000) },
        save,
      });
      jest.spyOn(authUtils, 'hashPassword').mockResolvedValue('newhash');
      await expect(authService.resetPassword(token, 'password123')).resolves.toMatchObject({
        message: 'Password reset successful',
      });
      jest.restoreAllMocks();
    });
  });
});
