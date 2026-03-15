import { errorMiddleware } from './error.middleware';
import { HttpError } from '../errors/HttpError';

describe('errorMiddleware', () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('responds with HttpError status and message', () => {
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();
    const res = { status, json } as any;

    errorMiddleware(new HttpError(404, 'Not found'), {} as any, res, jest.fn());

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      error: 'Not Found',
      message: 'Not found',
    });
  });

  it('falls back to 500 for unknown errors', () => {
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();
    const res = { status, json } as any;

    errorMiddleware(new Error('Boom'), {} as any, res, jest.fn());

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      error: 'Internal Server Error',
      message: 'Boom',
    });
  });
});
