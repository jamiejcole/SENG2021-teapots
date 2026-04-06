import { validateOrder } from '../../../../src/api/v2/orders/orders.controller';
import * as invValidation from '../../../../src/api/v2/invoices/invoices.validation';
import { HttpError } from '../../../../src/errors/HttpError';

jest.mock('../../../../src/api/v2/invoices/invoices.validation', () => ({
  validateUBL: jest.fn(),
}));

function flushPromises() {
  return new Promise<void>((resolve) => setImmediate(resolve));
}

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
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
});
