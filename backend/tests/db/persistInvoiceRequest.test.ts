import { persistInvoiceRequest } from '../../src/db/persistInvoiceRequest';
import { OrderModel } from '../../src/models/order.model';
import { InvoiceModel } from '../../src/models/invoice.model';
import type { OrderData } from '../../src/types/order.types';
import type { InvoiceSupplement } from '../../src/types/invoice.types';

jest.mock('../../src/models/order.model', () => ({
  OrderModel: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('../../src/models/invoice.model', () => ({
  InvoiceModel: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

describe('persistInvoiceRequest', () => {
  const invoiceXml = `
    <Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
      xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
      <cbc:ID>INV-123</cbc:ID>
      <cbc:IssueDate>2026-03-15</cbc:IssueDate>
      <cbc:DocumentCurrencyCode>AUD</cbc:DocumentCurrencyCode>
    </Invoice>
  `;

  const invoiceSupplement: InvoiceSupplement = {
    currencyCode: 'AUD',
    taxRate: 0.1,
    taxScheme: { id: 'GST', taxTypeCode: 'GST' },
    paymentMeans: {
      code: '30',
      payeeFinancialAccount: { id: 'ACC-1', name: 'Main Account' },
    },
    paymentTerms: { note: 'Net 14' },
  };

  const orderObj: OrderData = {
    ID: { value: 'ORDER-1' },
    IssueDate: { value: '2026-03-14' },
    DocumentCurrencyCode: { value: 'AUD' },
    BuyerCustomerParty: {
      Party: {
        EndpointID: { value: 'BUYER-1' },
        PartyName: { Name: { value: 'Buyer Pty' } },
        Contact: { ElectronicMail: { value: 'buyer@example.com' } },
        PostalAddress: {
          StreetName: { value: 'Buyer' },
          BuildingNumber: { value: '1' },
          CityName: { value: 'Sydney' },
          PostalZone: { value: '2000' },
          Country: { IdentificationCode: { value: 'AU' } },
        },
      },
    },
    SellerSupplierParty: {
      Party: {
        EndpointID: { value: 'SELLER-1' },
        PartyName: { Name: { value: 'Seller Pty' } },
        Contact: { ElectronicMail: { value: 'seller@example.com' } },
        PostalAddress: {
          StreetName: { value: 'Seller' },
          BuildingNumber: { value: '2' },
          CityName: { value: 'Melbourne' },
          PostalZone: { value: '3000' },
          Country: { IdentificationCode: { value: 'AU' } },
        },
      },
    },
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

  beforeEach(() => {
    jest.clearAllMocks();
    (OrderModel.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
    (InvoiceModel.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
  });

  it('creates order and invoice docs when hashes do not exist', async () => {
    await persistInvoiceRequest({
      orderXml: '<Order></Order>',
      orderObj,
      invoiceXml,
      invoiceSupplement,
    });

    expect(OrderModel.findOne).toHaveBeenCalled();
    expect(OrderModel.create).toHaveBeenCalledWith(expect.objectContaining({
      status: 'RECEIVED',
      orderId: 'ORDER-1',
      buyer: expect.objectContaining({ name: 'Buyer Pty' }),
      seller: expect.objectContaining({ name: 'Seller Pty' }),
      totals: expect.objectContaining({ payableAmount: expect.any(Number) }),
    }));

    expect(InvoiceModel.findOne).toHaveBeenCalled();
    expect(InvoiceModel.create).toHaveBeenCalledWith(expect.objectContaining({
      status: 'GENERATED',
      invoiceId: 'INV-123',
      orderReference: { orderId: 'ORDER-1' },
      paymentTerms: 'Net 14',
    }));
  });

  it('skips create calls when docs already exist', async () => {
    (OrderModel.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'existing-order' }) });
    (InvoiceModel.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'existing-invoice' }) });

    await persistInvoiceRequest({
      orderXml: '<Order></Order>',
      orderObj,
      invoiceXml,
      invoiceSupplement,
    });

    expect(OrderModel.create).not.toHaveBeenCalled();
    expect(InvoiceModel.create).not.toHaveBeenCalled();
  });

  it('falls back to UNKNOWN defaults when party data is sparse', async () => {
    const sparseOrder = {
      ...orderObj,
      BuyerCustomerParty: { Party: {} },
      SellerSupplierParty: { Party: {} },
      OrderLine: {
        LineItem: {
          ID: { value: '1' },
          Quantity: { value: '1' },
          Price: { PriceAmount: { value: '1.00' } },
          Item: { Name: { value: 'Item' } },
        },
      },
    } as unknown as OrderData;

    await persistInvoiceRequest({
      orderXml: '<Order></Order>',
      orderObj: sparseOrder,
      invoiceXml,
      invoiceSupplement,
    });

    expect(OrderModel.create).toHaveBeenCalledWith(expect.objectContaining({
      buyer: expect.objectContaining({
        name: 'Buyer',
        address: expect.objectContaining({ country: 'XX' }),
      }),
      seller: expect.objectContaining({
        name: 'Seller',
        address: expect.objectContaining({ country: 'XX' }),
      }),
    }));
  });
});
