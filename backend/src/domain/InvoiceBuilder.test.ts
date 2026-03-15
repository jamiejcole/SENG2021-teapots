import { InvoiceBuilder } from './InvoiceBuilder';
import type { OrderData } from '../types/order.types';
import type { InvoiceSupplement } from '../types/invoice.types';

function makeOrder(overrides: Partial<OrderData> = {}): OrderData {
  return {
    ID: 'ORDER-1',
    IssueDate: '2026-03-15',
    DocumentCurrencyCode: 'AUD',
    BuyerCustomerParty: {
      Party: {
        EndpointID: { value: 'BUYER-001' },
        PartyName: { Name: { value: 'Buyer Pty Ltd' } },
        PostalAddress: {
          StreetName: { value: 'Buyer St' },
          BuildingNumber: { value: '10' },
          CityName: { value: 'Sydney' },
          PostalZone: { value: '2000' },
          Country: { IdentificationCode: { value: 'AU' } },
        },
      },
    },
    SellerSupplierParty: {
      Party: {
        EndpointID: { value: 'SELLER-001' },
        PartyName: { Name: { value: 'Seller Pty Ltd' } },
        PostalAddress: {
          StreetName: { value: 'Seller St' },
          BuildingNumber: { value: '20' },
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
    ...overrides,
  } as OrderData;
}

function makeSupplement(overrides: Partial<InvoiceSupplement> = {}): InvoiceSupplement {
  return {
    invoiceNumber: '123',
    issueDate: '2026-03-16',
    dueDate: '2026-03-30',
    note: 'Thanks for your business',
    currencyCode: 'AUD',
    taxRate: 0.1,
    taxScheme: { id: 'GST', taxTypeCode: 'GST' },
    supplierPartyTaxScheme: { companyId: 'SUP-ABN', taxSchemeId: 'GST' },
    customerPartyTaxScheme: { companyId: 'CUST-ABN', taxSchemeId: 'GST' },
    paymentMeans: {
      code: '30',
      payeeFinancialAccount: {
        id: 'ACC-1',
        name: 'Operating Account',
        branchId: 'BR-1',
      },
    },
    paymentTerms: { note: 'Pay in 14 days' },
    ...overrides,
  } as InvoiceSupplement;
}

describe('InvoiceBuilder', () => {
  it('builds a complete invoice XML with optional sections', () => {
    const xml = new InvoiceBuilder(makeOrder(), makeSupplement())
      .addHeader()
      .addOrderReference()
      .addParties()
      .addPaymentMeans()
      .addPaymentTerms()
      .addTaxTotal()
      .addLegalMonetaryTotal()
      .addInvoiceLines()
      .build();

    expect(xml).toContain('<cbc:ID>INV-123</cbc:ID>');
    expect(xml).toContain('<cbc:DueDate>2026-03-30</cbc:DueDate>');
    expect(xml).toContain('<cbc:DocumentCurrencyCode>AUD</cbc:DocumentCurrencyCode>');
    expect(xml).toContain('<cac:PaymentMeans>');
    expect(xml).toContain('<cbc:PaymentMeansCode>30</cbc:PaymentMeansCode>');
    expect(xml).toContain('<cac:PaymentTerms>');
    expect(xml).toContain('<cbc:Percent>10</cbc:Percent>');
    expect(xml).toContain('<cac:InvoiceLine>');
  });

  it('handles missing optional fields and single order line object', () => {
    const order = makeOrder({
      ID: '' as unknown as string,
      DocumentCurrencyCode: undefined,
      OrderLine: {
        LineItem: {
          ID: { value: '1' },
          Quantity: { value: '1', '@unitCode': 'EA' },
          Price: { PriceAmount: { value: '3.00' } },
          Item: { Name: { value: 'Cup' } },
        },
      } as any,
    });

    const supplement = makeSupplement({
      invoiceNumber: undefined,
      dueDate: undefined,
      note: undefined,
      currencyCode: 'NZD',
      paymentTerms: undefined,
      paymentMeans: {
        code: '10',
        payeeFinancialAccount: {
          id: 'ACC-2',
          name: 'Fallback Account',
        },
      },
    });

    const xml = new InvoiceBuilder(order, supplement)
      .addHeader()
      .addOrderReference()
      .addParties()
      .addPaymentMeans()
      .addPaymentTerms()
      .addTaxTotal()
      .addLegalMonetaryTotal()
      .addInvoiceLines()
      .build();

    expect(xml).toContain('<cbc:DocumentCurrencyCode>NZD</cbc:DocumentCurrencyCode>');
    expect(xml).not.toContain('<cbc:DueDate>');
    expect(xml).not.toContain('<cbc:Note>Thanks for your business</cbc:Note>');
    expect(xml).not.toContain('<cac:OrderReference>');
    expect(xml).not.toContain('<cac:PaymentTerms>');
  });
});
