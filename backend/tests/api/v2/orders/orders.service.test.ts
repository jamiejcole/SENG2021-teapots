import mongoose from 'mongoose';
import * as ordersService from '../../../../src/api/v2/orders/orders.service';
import { OrderModel } from '../../../../src/models/order.model';

jest.mock('../../../../src/models/order.model', () => ({
  OrderModel: {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    updateOne: jest.fn(() => ({ exec: jest.fn().mockResolvedValue({}) })),
    deleteOne: jest.fn(() => ({ exec: jest.fn().mockResolvedValue({}) })),
    findById: jest.fn(),
  },
}));

jest.mock('../../../../src/api/v2/invoices/invoices.validation', () => ({
  validateUBL: jest.fn(),
}));

const uid = new mongoose.Types.ObjectId().toString();

const body = {
  orderId: 'ORD-SVC-1',
  issueDate: '2026-03-20',
  currency: 'AUD',
  buyer: {
    name: 'Buyer',
    address: { street: '1 St', city: 'Syd', postalCode: '2000', country: 'AU' },
  },
  seller: {
    name: 'Seller',
    address: { street: '2 Rd', city: 'Mel', postalCode: '3000', country: 'AU' },
  },
  lines: [{ description: 'Item', quantity: 1, unitPrice: 9.99 }],
};

describe('orders.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (OrderModel.findOne as jest.Mock).mockReset();
    (OrderModel.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
  });

  it('resolveOrderForUser returns null for invalid user id', async () => {
    await expect(ordersService.resolveOrderForUser('k1', 'bad')).resolves.toBeNull();
  });

  it('resolveOrderForUser finds by Mongo id', async () => {
    const oid = new mongoose.Types.ObjectId();
    const doc = { _id: oid, orderId: 'O' };
    (OrderModel.findOne as jest.Mock).mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(doc) });
    await expect(ordersService.resolveOrderForUser(String(oid), uid)).resolves.toBe(doc);
  });

  it('resolveOrderForUser finds by orderId when key is not an ObjectId', async () => {
    const doc = { _id: 'i1', orderId: 'BY-ORDER' };
    (OrderModel.findOne as jest.Mock).mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(doc) });
    await expect(ordersService.resolveOrderForUser('BY-ORDER', uid)).resolves.toBe(doc);
  });

  it('listOrdersForUser returns [] for invalid user', async () => {
    await expect(ordersService.listOrdersForUser('nope')).resolves.toEqual([]);
  });

  it('listOrdersForUser queries with user filter', async () => {
    const chain = {
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([{ orderId: 'A' }]),
    };
    (OrderModel.find as jest.Mock).mockReturnValue(chain);
    const rows = await ordersService.listOrdersForUser(uid);
    expect(OrderModel.find).toHaveBeenCalledWith({ createdBy: expect.any(mongoose.Types.ObjectId) });
    expect(rows).toEqual([{ orderId: 'A' }]);
  });

  it('createOrderFromPayload throws 409 when orderId exists', async () => {
    (OrderModel.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: '1' }) });
    await expect(ordersService.createOrderFromPayload(uid, body)).rejects.toMatchObject({
      statusCode: 409,
    });
    (OrderModel.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
  });

  it('createOrderFromPayload creates document', async () => {
    (OrderModel.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
    const toObject = jest.fn().mockReturnValue({ orderId: body.orderId, orderXml: '<x/>' });
    (OrderModel.create as jest.Mock).mockResolvedValue({ toObject });
    const out = await ordersService.createOrderFromPayload(uid, body);
    expect(OrderModel.create).toHaveBeenCalled();
    expect(out.orderId).toBe(body.orderId);
  });

  it('updateOrderFromPayload returns null when not found', async () => {
    (OrderModel.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
    await expect(ordersService.updateOrderFromPayload(uid, 'key', body)).resolves.toBeNull();
  });

  it('updateOrderFromPayload throws on orderId clash', async () => {
    const existing = { _id: 'e1', orderId: 'ORD-SVC-1' };
    (OrderModel.findOne as jest.Mock)
      .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(existing) })
      .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue({ _id: 'other' }) });
    const otherBody = { ...body, orderId: 'NEW-ID' };
    await expect(ordersService.updateOrderFromPayload(uid, 'key', otherBody)).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it('updateOrderFromPayload applies update', async () => {
    const existing = { _id: 'e1', orderId: body.orderId };
    (OrderModel.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(existing) });
    (OrderModel.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ orderId: body.orderId }),
    });
    const out = await ordersService.updateOrderFromPayload(uid, 'key', body);
    expect(OrderModel.updateOne).toHaveBeenCalled();
    expect(out).toEqual({ orderId: body.orderId });
  });

  it('deleteOrderForUser', async () => {
    (OrderModel.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
    await expect(ordersService.deleteOrderForUser(uid, 'k')).resolves.toBeNull();
    (OrderModel.findOne as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue({ _id: 'e1' }),
    });
    await expect(ordersService.deleteOrderForUser(uid, 'k')).resolves.toEqual({ deleted: true });
  });

  it('getOrderDetail and getOrderXmlString', async () => {
    (OrderModel.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
    await expect(ordersService.getOrderDetail(uid, 'k', false)).resolves.toBeNull();

    const mockDoc = {
      _id: 'e1',
      orderXml: ' <xml/> ',
      toObject: jest.fn().mockReturnValue({ orderXml: ' <xml/> ' }),
    };
    (OrderModel.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(mockDoc) });
    await expect(ordersService.getOrderDetail(uid, 'k', true)).resolves.toEqual(mockDoc.toObject());

    (OrderModel.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ orderId: '1' }),
    });
    await expect(ordersService.getOrderDetail(uid, 'k', false)).resolves.toEqual({ orderId: '1' });

    await expect(ordersService.getOrderXmlString(uid, 'k')).resolves.toBe(' <xml/> ');

    const noXml = { _id: 'e2', toObject: jest.fn() };
    (OrderModel.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(noXml) });
    await expect(ordersService.getOrderXmlString(uid, 'k')).resolves.toBeNull();
  });
});
