import mongoose from 'mongoose';
import * as despatchService from '../../../../src/api/v2/despatch/despatch.service';
import { OrderModel } from '../../../../src/models/order.model';
import { DespatchModel } from '../../../../src/models/despatch.model';
import { HttpError } from '../../../../src/errors/HttpError';

jest.mock('../../../../src/models/order.model', () => ({
  OrderModel: {
    findOne: jest.fn(),
    updateOne: jest.fn(() => ({ exec: jest.fn().mockResolvedValue({}) })),
    find: jest.fn(),
    findById: jest.fn(),
  },
}));

jest.mock('../../../../src/models/despatch.model', () => ({
  DespatchModel: {
    findOne: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    updateOne: jest.fn(() => ({ exec: jest.fn().mockResolvedValue({}) })),
  },
}));

jest.mock('../../../../src/utils/mailgun.service', () => ({
  sendDespatchAdviceEmail: jest.fn().mockResolvedValue(undefined),
}));

const uid = new mongoose.Types.ObjectId().toString();

const body = {
  orderId: 'ORD-D1',
  despatchDate: '2026-03-10',
  supplierParty: {
    name: 'S',
    address: { street: '1', city: 'c', postalCode: '1', country: 'AU' },
  },
  deliveryParty: {
    name: 'D',
    address: { street: '2', city: 'c', postalCode: '1', country: 'AU' },
  },
  lines: [{ lineId: 'L1', description: 'Item', quantity: 1 }],
};

function mockOrder(over?: Partial<{ orderStatus: string }>) {
  return { _id: new mongoose.Types.ObjectId(), orderId: body.orderId, orderStatus: 'created', ...over };
}

describe('despatch.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('createDespatch throws 401 for invalid user id', async () => {
    await expect(despatchService.createDespatch('bad-id', body)).rejects.toMatchObject({ statusCode: 401 });
  });

  it('createDespatch 404 when order missing', async () => {
    (OrderModel.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
    await expect(despatchService.createDespatch(uid, body)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('createDespatch 400 for cancelled order', async () => {
    (OrderModel.findOne as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockOrder({ orderStatus: 'cancelled' })),
    });
    await expect(despatchService.createDespatch(uid, body)).rejects.toMatchObject({ statusCode: 400 });
  });

  it('createDespatch 409 on duplicate despatch id', async () => {
    (OrderModel.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(mockOrder()) });
    (DespatchModel.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'x' }) });
    await expect(
      despatchService.createDespatch(uid, { ...body, despatchId: 'DUP' })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('createDespatch sets fulfilled on despatched', async () => {
    (OrderModel.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(mockOrder()) });
    (DespatchModel.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
    const createdId = new mongoose.Types.ObjectId();
    (DespatchModel.create as jest.Mock).mockResolvedValue({ _id: createdId });
    (DespatchModel.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ despatchId: 'DES-1' }),
    });
    const out = await despatchService.createDespatch(uid, { ...body, despatchStatus: 'despatched' });
    expect(OrderModel.updateOne).toHaveBeenCalled();
    expect(out).toEqual({ despatchId: 'DES-1' });
  });

  it('createDespatch sets partially_fulfilled', async () => {
    (OrderModel.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(mockOrder()) });
    (DespatchModel.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
    const createdId = new mongoose.Types.ObjectId();
    (DespatchModel.create as jest.Mock).mockResolvedValue({ _id: createdId });
    (DespatchModel.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ despatchId: 'DES-P' }),
    });
    await despatchService.createDespatch(uid, { ...body, despatchStatus: 'partially_despatched' });
    expect(OrderModel.updateOne).toHaveBeenCalled();
  });

  it('listDespatches and getDespatch', async () => {
    const chain = {
      sort: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    };
    (DespatchModel.find as jest.Mock).mockReturnValue(chain);
    await expect(despatchService.listDespatches('bad')).resolves.toEqual([]);
    await despatchService.listDespatches(uid, { activeOnly: true });
    expect(DespatchModel.find).toHaveBeenCalledWith(
      expect.objectContaining({ despatchStatus: { $ne: 'fulfilment_cancelled' } })
    );

    (DespatchModel.findOne as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ despatchId: '1' }),
    });
    await expect(despatchService.getDespatch(uid, '1')).resolves.toEqual({ despatchId: '1' });
  });

  it('cancelOrderForUser and listCancelledOrders', async () => {
    (OrderModel.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
    await expect(despatchService.cancelOrderForUser(uid, 'x')).resolves.toBeNull();
    (OrderModel.findOne as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue({ _id: 'o1' }),
    });
    (OrderModel.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ orderId: 'x' }),
    });
    await expect(despatchService.cancelOrderForUser(uid, 'x')).resolves.toEqual({ orderId: 'x' });

    const c = {
      sort: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    };
    (OrderModel.find as jest.Mock).mockReturnValue(c);
    await despatchService.listCancelledOrders(uid);
  });

  it('cancelFulfilment and listFulfilmentCancelled', async () => {
    (DespatchModel.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
    await expect(despatchService.cancelFulfilment(uid, 'd')).resolves.toBeNull();
    (DespatchModel.findOne as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue({ _id: 'd1' }),
    });
    (DespatchModel.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ despatchId: 'd' }),
    });
    await expect(despatchService.cancelFulfilment(uid, 'd')).resolves.toEqual({ despatchId: 'd' });

    const chain = {
      sort: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    };
    (DespatchModel.find as jest.Mock).mockReturnValue(chain);
    await despatchService.listFulfilmentCancelled(uid);
  });

  it('emailDespatchAdviceForUser', async () => {
    (DespatchModel.findOne as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(null),
    });
    await expect(despatchService.emailDespatchAdviceForUser(uid, 'd', 'a@b.com')).rejects.toMatchObject({
      statusCode: 404,
    });

    const doc = {
      despatchId: 'D1',
      orderId: 'O1',
      despatchStatus: 'despatched',
      despatchDate: '2026-01-01',
      supplierParty: { name: 'S', address: { street: '1', city: 'c', postalCode: '1', country: 'AU' } },
      deliveryParty: { name: 'D', address: { street: '2', city: 'c', postalCode: '1', country: 'AU' } },
      lines: [{ lineId: '1', description: 'x', quantity: 1, unitCode: 'C62' }],
      notes: 'hello\nworld',
      carrierName: 'C',
      trackingId: 'T',
    };
    (DespatchModel.findOne as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(doc),
    });
    const r = await despatchService.emailDespatchAdviceForUser(uid, 'D1', 'a@b.com');
    expect(r.message).toBe('Despatch email sent');
  });
});
