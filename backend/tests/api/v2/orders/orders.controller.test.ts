import {
  validateOrder,
  listOrders,
  createOrder,
  getOrder,
  getOrderXml,
  updateOrder,
  deleteOrder,
} from '../../../../src/api/v2/orders/orders.controller';
import * as invValidation from '../../../../src/api/v2/invoices/invoices.validation';
import * as ordersService from '../../../../src/api/v2/orders/orders.service';
import { HttpError } from '../../../../src/errors/HttpError';

jest.mock('../../../../src/api/v2/invoices/invoices.validation', () => ({
  validateUBL: jest.fn(),
}));

jest.mock('../../../../src/api/v2/orders/orders.service', () => ({
  listOrdersForUser: jest.fn(),
  createOrderFromPayload: jest.fn(),
  getOrderDetail: jest.fn(),
  getOrderXmlString: jest.fn(),
  updateOrderFromPayload: jest.fn(),
  deleteOrderForUser: jest.fn(),
}));

function flushPromises() {
  return new Promise<void>((resolve) => setImmediate(resolve));
}

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    contentType: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  } as any;
}

describe('orders.controller (v2)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validateOrder: accepts orderXml and returns success', async () => {
    const req = { body: { orderXml: '<Order />' } } as any;
    const res = createResponse();
    const next = jest.fn();

    validateOrder(req, res, next);
    await flushPromises();

    expect(invValidation.validateUBL).toHaveBeenCalledWith('<Order />', 'Order');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'UBL Order is valid!' });
    expect(next).not.toHaveBeenCalled();
  });

  it('validateOrder: invalid body forwards HttpError to next', async () => {
    const req = { body: {} } as any;
    const res = createResponse();
    const next = jest.fn();

    validateOrder(req, res, next);
    await flushPromises();

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(HttpError);
    expect((err as HttpError).statusCode).toBe(400);
  });

  it('CRUD handlers use service', async () => {
    const uid = '507f191e810c19729de860ea';
    (ordersService.listOrdersForUser as jest.Mock).mockResolvedValue([]);
    const r1 = createResponse();
    listOrders({ user: { userId: uid } } as any, r1, jest.fn());
    await flushPromises();
    expect(r1.status).toHaveBeenCalledWith(200);

    (ordersService.createOrderFromPayload as jest.Mock).mockResolvedValue({ orderXml: 'x', orderId: '1' });
    const r2 = createResponse();
    createOrder({ user: { userId: uid }, body: {} } as any, r2, jest.fn());
    await flushPromises();
    expect(r2.status).toHaveBeenCalledWith(201);

    (ordersService.getOrderDetail as jest.Mock).mockResolvedValue({ orderId: '1' });
    const r3 = createResponse();
    getOrder({ user: { userId: uid }, params: { orderKey: '1' } } as any, r3, jest.fn());
    await flushPromises();
    expect(r3.status).toHaveBeenCalledWith(200);

    (ordersService.getOrderXmlString as jest.Mock).mockResolvedValue('<Order/>');
    const r4 = createResponse();
    getOrderXml({ user: { userId: uid }, params: { orderKey: '1' } } as any, r4, jest.fn());
    await flushPromises();
    expect(r4.send).toHaveBeenCalledWith('<Order/>');

    (ordersService.updateOrderFromPayload as jest.Mock).mockResolvedValue({});
    const r5 = createResponse();
    updateOrder({ user: { userId: uid }, params: { orderKey: '1' }, body: {} } as any, r5, jest.fn());
    await flushPromises();
    expect(r5.status).toHaveBeenCalledWith(200);

    (ordersService.deleteOrderForUser as jest.Mock).mockResolvedValue({ deleted: true });
    const r6 = createResponse();
    deleteOrder({ user: { userId: uid }, params: { orderKey: '1' } } as any, r6, jest.fn());
    await flushPromises();
    expect(r6.status).toHaveBeenCalledWith(204);
  });
});
