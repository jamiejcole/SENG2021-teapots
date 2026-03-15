import { asyncHandler } from './asyncHandler';

describe('asyncHandler', () => {
  it('forwards resolved handlers without calling next with error', async () => {
    const next = jest.fn();
    const handler = asyncHandler(async () => Promise.resolve('ok'));

    handler({} as any, {} as any, next);
    await new Promise<void>((resolve) => setImmediate(resolve));

    expect(next).not.toHaveBeenCalled();
  });

  it('forwards rejected handlers to next', async () => {
    const next = jest.fn();
    const err = new Error('fail');
    const handler = asyncHandler(async () => Promise.reject(err));

    handler({} as any, {} as any, next);
    await new Promise<void>((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(err);
  });
});
