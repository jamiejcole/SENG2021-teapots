import { HttpError } from '../../../../src/errors/HttpError';
import { createInvoice, validateInvoice, createPdf, deleteInvoice, updateInvoice, getInvoice, listInvoices } from '../../../../src/api/v1/invoices/invoices.controller';
import * as validation from '../../../../src/api/v1/invoices/invoices.validation';
import * as service from '../../../../src/api/v1/invoices/invoices.service';
import * as persist from '../../../../src/db/persistInvoiceRequest';

jest.mock('../../../../src/api/v1/invoices/invoices.validation', () => ({
  validateUBL: jest.fn(),
  validateCreateInvoiceRequest: jest.fn(),
  generateInvoicePdf: jest.fn(),
}));

jest.mock('../../../../src/api/v1/invoices/invoices.service', () => ({
  createFullUblObject: jest.fn(),
  convertJsonToUblInvoice: jest.fn(),
  deleteInvoiceById: jest.fn(),
  getInvoiceById: jest.fn(),
  getAllInvoices: jest.fn(),
  updateInvoiceById: jest.fn(),
}));

jest.mock('../../../../src/db/persistInvoiceRequest', () => ({
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

  it('validateInvoice returns success for valid invoiceXml', async () => {
    const req = { body: { invoiceXml: '<Invoice />' } } as any;
    const res = {
      contentType: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;

    await validateInvoice(req, res);

    expect(validation.validateUBL).toHaveBeenCalledWith('<Invoice />', 'Invoice');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'UBL Invoice is valid!' });
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

  it('createPdf generates and returns PDF with 201', async () => {
    const req = { body: '<Invoice />' } as any;
    const pdfBuffer = Buffer.from('pdf-binary');
    const res = {
      set: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as any;

    (validation.generateInvoicePdf as jest.Mock).mockResolvedValue(pdfBuffer);

    await createPdf(req, res);

    expect(validation.generateInvoicePdf).toHaveBeenCalledWith('<Invoice />');
    expect(res.set).toHaveBeenCalledWith('Content-Type', 'application/pdf');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith(pdfBuffer);
  });

  it('createPdf propagates error when PDF generation fails', async () => {
    const req = { body: '<Invoice />' } as any;
    const res = {
      set: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as any;

    (validation.generateInvoicePdf as jest.Mock).mockRejectedValue(new Error('PDF generation failed'));

    await expect(createPdf(req, res)).rejects.toThrow('PDF generation failed');
    expect(res.set).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();
  });

  it('updateInvoice validates, updates, and returns XML 200', async () => {
    const req = {
      params: { invoiceId: '507f1f77bcf86cd799439011' },
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

    (service.createFullUblObject as jest.Mock).mockResolvedValue({ data: { ID: 'ORDER-1' } });
    (service.convertJsonToUblInvoice as jest.Mock).mockReturnValue('<Invoice />');
    (service.updateInvoiceById as jest.Mock).mockResolvedValue({ _id: 'invoice-1' });

    await new Promise<void>((resolve, reject) => {
      res.send.mockImplementation(() => {
        resolve();
      });
      updateInvoice(req, res, (err?: unknown) => {
        if (err) reject(err);
      });
    });

    expect(validation.validateCreateInvoiceRequest).toHaveBeenCalledWith(req.body);
    expect(service.updateInvoiceById).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      '<Order></Order>',
      { ID: 'ORDER-1' },
      '<Invoice />',
      req.body.invoiceSupplement,
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith('<Invoice />');
  });

  it('getInvoice returns 404 for missing invoices and 200 for existing ones', async () => {
    (service.getInvoiceById as jest.Mock).mockResolvedValueOnce(null);
    await expect(getInvoice({ params: { invoiceId: 'bad' } } as any, {} as any)).rejects.toThrow('Invoice not found');

    const res = { set: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis(), send: jest.fn() } as any;
    (service.getInvoiceById as jest.Mock).mockResolvedValueOnce({ _id: 'invoice-1' });

    await getInvoice({ params: { invoiceId: '507f1f77bcf86cd799439011' } } as any, res);

    expect(res.set).toHaveBeenCalledWith('Content-Type', 'application/json');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({ _id: 'invoice-1' });
  });

  it('listInvoices returns the full invoice list', async () => {
    const res = { set: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis(), send: jest.fn() } as any;
    (service.getAllInvoices as jest.Mock).mockResolvedValue([{ _id: 'invoice-1' }]);

    await listInvoices({} as any, res);

    expect(res.set).toHaveBeenCalledWith('Content-Type', 'application/json');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith([{ _id: 'invoice-1' }]);
  });
});
