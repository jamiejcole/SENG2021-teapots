import mongoose from 'mongoose';
import * as service from '../../../../src/api/v1/invoices/invoices.service';
import { InvoiceModel } from '../../../../src/models/invoice.model';
import type { OrderData } from '../../../../src/types/order.types';
import type { InvoiceSupplement } from '../../../../src/types/invoice.types';

jest.mock('../../../../src/models/invoice.model', () => ({
  InvoiceModel: {
    findByIdAndDelete: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

describe('invoices.service', () => {
  const orderData = {
    ID: 'ORDER-1',
    IssueDate: '2026-03-15',
    DocumentCurrencyCode: 'AUD',
    BuyerCustomerParty: { Party: { PartyName: { Name: { value: 'Buyer' } } } },
    SellerSupplierParty: { Party: { PartyName: { Name: { value: 'Seller' } } } },
    OrderLine: [
      {
        LineItem: {
          ID: { value: '1' },
          Quantity: { value: '2', '@unitCode': 'EA' },
          Price: { PriceAmount: { value: '10.00' } },
          Item: { Name: { value: 'Tea Pot' } },
        },
      },
    ],
  } as unknown as OrderData;

  const supplement = {
    currencyCode: 'AUD',
    taxRate: 0.1,
    taxScheme: { id: 'GST', taxTypeCode: 'GST' },
    paymentMeans: { payeeFinancialAccount: { id: 'A1', name: 'Main' }, code: '30' },
  } as InvoiceSupplement;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('createFullUblObject parses XML and maps root name/data', async () => {
    const result = await service.createFullUblObject('<Order><ID>1</ID></Order>');
    expect(result.rootName).toBe('Order');
    expect(result.data.ID).toBe('1');
  });

  it('convertJsonToUblInvoice builds invoice XML', () => {
    const xml = service.convertJsonToUblInvoice(orderData, supplement);
    expect(xml).toContain('<Invoice');
    expect(xml).toContain('<cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>');
  });

  it('deleteInvoiceById returns null for invalid object id', async () => {
    const isValidSpy = jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false);

    const result = await service.deleteInvoiceById('bad-id');

    expect(result).toBeNull();
    expect(InvoiceModel.findByIdAndDelete).not.toHaveBeenCalled();
    isValidSpy.mockRestore();
  });

  it('deleteInvoiceById deletes and returns result for valid object id', async () => {
    const deleted = { _id: '507f1f77bcf86cd799439011' };
    const isValidSpy = jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
    (InvoiceModel.findByIdAndDelete as jest.Mock).mockResolvedValue(deleted);

    const result = await service.deleteInvoiceById('507f1f77bcf86cd799439011');

    expect(InvoiceModel.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    expect(result).toBe(deleted);
    isValidSpy.mockRestore();
  });

  it('getInvoiceById returns null for invalid object id and a result for valid ids', async () => {
    const isValidSpy = jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false);

    await expect(service.getInvoiceById('bad-id')).resolves.toBeNull();
    expect(InvoiceModel.findById).not.toHaveBeenCalled();

    isValidSpy.mockReturnValue(true);
    (InvoiceModel.findById as jest.Mock).mockResolvedValue({ _id: '507f1f77bcf86cd799439012' });

    await expect(service.getInvoiceById('507f1f77bcf86cd799439012')).resolves.toEqual({ _id: '507f1f77bcf86cd799439012' });
    expect(InvoiceModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
    isValidSpy.mockRestore();
  });

  it('getAllInvoices returns the invoices collection', async () => {
    (InvoiceModel.find as jest.Mock).mockResolvedValue([{ _id: 'invoice-1' }]);

    await expect(service.getAllInvoices()).resolves.toEqual([{ _id: 'invoice-1' }]);
    expect(InvoiceModel.find).toHaveBeenCalled();
  });

  it('updateInvoiceById returns null for invalid ids and updates valid ids', async () => {
    const isValidSpy = jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false);

    await expect(
      service.updateInvoiceById('bad-id', '<Order />', { id: 'order-1' } as any, '<Invoice />', { currencyCode: 'AUD' } as any),
    ).resolves.toBeNull();

    isValidSpy.mockReturnValue(true);
    (InvoiceModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({ _id: 'invoice-2' });

    await expect(
      service.updateInvoiceById('507f1f77bcf86cd799439013', '<Order />', { id: 'order-1' } as any, '<Invoice />', { currencyCode: 'AUD' } as any),
    ).resolves.toEqual({ _id: 'invoice-2' });
    expect(InvoiceModel.findByIdAndUpdate).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439013',
      expect.objectContaining({ orderXml: '<Order />', invoiceXml: '<Invoice />' }),
      { new: true },
    );
    isValidSpy.mockRestore();
  });
});
