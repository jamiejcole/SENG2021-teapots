import { HttpError } from '../../../errors/HttpError';
import { createInvoice, validateInvoice, deleteInvoice } from './invoices.controller';
import * as validation from './invoices.validation';
import * as service from './invoices.service';
import * as persist from '../../../db/persistInvoiceRequest';

jest.mock('./invoices.validation', () => ({
  validateUBL: jest.fn(),
  validateCreateInvoiceRequest: jest.fn(),
}));

jest.mock('./invoices.service', () => ({
  createFullUblObject: jest.fn(),
  convertJsonToUblInvoice: jest.fn(),
  deleteInvoiceById: jest.fn(),
}));

jest.mock('../../../db/persistInvoiceRequest', () => ({
  persistInvoiceRequest: jest.fn(),
}));

describe('invoices.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('createInvoice validates, generates invoice and returns XML 201', async () => {
    const req = {
      body: {
        orderXml: '<Order></Order>',
        invoiceSupplement: { currencyCode: 'AUD', taxRate: 0.1 },
      },
    } as any;

    const res = {
      contentType: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as any;

    const next = jest.fn();
    (service.createFullUblObject as jest.Mock).mockResolvedValue({ data: { ID: 'ORDER-1' } });
    (service.convertJsonToUblInvoice as jest.Mock).mockReturnValue('<Invoice />');

    await new Promise<void>((resolve, reject) => {
      res.send.mockImplementation(() => {
        resolve();
      });
      createInvoice(req, res, (err?: unknown) => {
        next(err);
        if (err) reject(err);
      });
    });

    expect(validation.validateCreateInvoiceRequest).toHaveBeenCalledWith(req.body);
    expect(validation.validateUBL).toHaveBeenNthCalledWith(1, '<Order></Order>', 'Order');
    expect(validation.validateUBL).toHaveBeenNthCalledWith(2, '<Invoice />', 'Invoice');
    expect(persist.persistInvoiceRequest).toHaveBeenCalled();
    expect(res.contentType).toHaveBeenCalledWith('application/xml');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith('<Invoice />');
    expect(next).not.toHaveBeenCalled();
  });

  it('validateInvoice throws for invalid request body', async () => {
    await expect(validateInvoice({ body: {} } as any, {} as any)).rejects.toThrow(HttpError);
  });

  it('validateInvoice returns success for valid orderXml', async () => {
    const req = { body: { orderXml: '<Order />' } } as any;
    const res = {
      contentType: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;

    await validateInvoice(req, res);

    expect(validation.validateUBL).toHaveBeenCalledWith('<Order />', 'Order');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'UBL Order is valid!' });
  });

  it('deleteInvoice throws 404 when service returns null', async () => {
    (service.deleteInvoiceById as jest.Mock).mockResolvedValue(null);

    await expect(deleteInvoice({ params: { invoiceId: 'id' } } as any, {} as any)).rejects.toThrow('Invoice not found');
  });

  it('deleteInvoice returns 204 on successful deletion', async () => {
    (service.deleteInvoiceById as jest.Mock).mockResolvedValue({ _id: 'id' });
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;

    await deleteInvoice({ params: { invoiceId: 'id' } } as any, res);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });
});
