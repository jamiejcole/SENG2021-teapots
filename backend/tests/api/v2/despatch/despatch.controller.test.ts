import * as controller from '../../../../src/api/v2/despatch/despatch.controller';
import * as service from '../../../../src/api/v2/despatch/despatch.service';
import { HttpError } from '../../../../src/errors/HttpError';

jest.mock('../../../../src/api/v2/despatch/despatch.service', () => ({
  createDespatch: jest.fn(),
  listDespatches: jest.fn(),
  getDespatch: jest.fn(),
  cancelOrderForUser: jest.fn(),
  listCancelledOrders: jest.fn(),
  cancelFulfilment: jest.fn(),
  listFulfilmentCancelled: jest.fn(),
  emailDespatchAdviceForUser: jest.fn(),
}));

function flushPromises() {
  return new Promise<void>((resolve) => setImmediate(resolve));
}

function res() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  } as any;
}

const uid = '507f191e810c19729de860ea';

describe('despatch.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('createDespatch', async () => {
    (service.createDespatch as jest.Mock).mockResolvedValue({ id: 1 });
    const r = res();
    controller.createDespatch({ user: { userId: uid }, body: {} } as any, r, jest.fn());
    await flushPromises();
    expect(r.status).toHaveBeenCalledWith(201);
  });

  it('listDespatch respects active query', async () => {
    (service.listDespatches as jest.Mock).mockResolvedValue([]);
    const r = res();
    controller.listDespatch({ user: { userId: uid }, query: { active: 'true' } } as any, r, jest.fn());
    await flushPromises();
    expect(service.listDespatches).toHaveBeenCalledWith(uid, { activeOnly: true });
  });

  it('retrieveDespatch 400/404', async () => {
    const next = jest.fn();
    controller.retrieveDespatch({ user: { userId: uid }, params: {} } as any, res(), next);
    await flushPromises();
    expect(next.mock.calls[0][0]).toBeInstanceOf(HttpError);
    (service.getDespatch as jest.Mock).mockResolvedValue(null);
    controller.retrieveDespatch(
      { user: { userId: uid }, params: { despatchId: 'd1' } } as any,
      res(),
      next
    );
    await flushPromises();
    expect(next.mock.calls[1][0].statusCode).toBe(404);
  });

  it('cancelOrderPost', async () => {
    const next = jest.fn();
    controller.cancelOrderPost({ user: { userId: uid }, body: {} } as any, res(), next);
    await flushPromises();
    expect(next.mock.calls[0][0]).toBeInstanceOf(HttpError);
    (service.cancelOrderForUser as jest.Mock).mockResolvedValue({ ok: 1 });
    const r = res();
    controller.cancelOrderPost({ user: { userId: uid }, body: { orderId: 'O1' } } as any, r, jest.fn());
    await flushPromises();
    expect(r.status).toHaveBeenCalledWith(200);
  });

  it('emailDespatch validates email', async () => {
    const next = jest.fn();
    controller.emailDespatch(
      { user: { userId: uid }, body: { despatchId: 'd', to: 'bad' } } as any,
      res(),
      next
    );
    await flushPromises();
    expect(next.mock.calls[0][0].statusCode).toBe(400);
  });
});
