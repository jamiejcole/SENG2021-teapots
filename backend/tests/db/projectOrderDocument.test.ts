import { projectOrderDocumentFields } from '../../src/db/projectOrderDocument';
import type { CreateOrderPayload } from '../../src/types/order.dto';
import type { OrderData } from '../../src/types/order.types';
import mongoose from 'mongoose';

const uid = new mongoose.Types.ObjectId().toString();

const payload: CreateOrderPayload = {
  orderId: 'ORD-P',
  issueDate: '2026-01-01',
  currency: 'aud',
  taxRate: 0.1,
  orderStatus: 'draft',
  invoiceStatusNote: 'note',
  buyer: {
    name: 'B',
    address: { street: '1 A St', city: 'Syd', postalCode: '2000', country: 'AU' },
  },
  seller: {
    name: 'S',
    address: { street: '2 B Rd', city: 'Mel', postalCode: '3000', country: 'AU' },
  },
  lines: [{ description: 'Item', quantity: 1, unitPrice: 10 }],
  delivery: {
    address: { street: 'D St', city: 'X', postalCode: '1111', country: 'AU' },
    requestedDeliveryStart: '2026-02-01',
  },
  deliveryTerms: 'FOB ',
};

function orderData(): OrderData {
  return {
    ID: { value: 'ORD-P' },
    IssueDate: { value: '2026-01-01' },
    DocumentCurrencyCode: { value: 'AUD' },
    BuyerCustomerParty: {
      Party: {
        PartyName: { Name: { value: 'B' } },
        PostalAddress: {
          StreetName: { value: '1 A' },
          BuildingNumber: { value: 'St' },
          CityName: { value: 'Syd' },
          PostalZone: { value: '2000' },
          Country: { IdentificationCode: { value: 'AU' } },
        },
      },
    },
    SellerSupplierParty: {
      Party: {
        PartyName: { Name: { value: 'S' } },
        PostalAddress: {
          CityName: { value: 'Mel' },
          PostalZone: { value: '3000' },
          Country: { IdentificationCode: { value: 'AU' } },
        },
      },
    },
    OrderLine: {
      LineItem: {
        ID: { value: '1' },
        Quantity: { value: '1', '@unitCode': 'C62' },
        Price: { PriceAmount: { value: '10' } },
        Item: { Name: { value: 'Item' } },
      },
    },
  } as unknown as OrderData;
}

describe('projectOrderDocumentFields', () => {
  it('projects fields with userId, delivery, and draft status', () => {
    const xml = '<Order />';
    const doc = projectOrderDocumentFields(orderData(), xml, payload, uid);
    expect(doc.orderId).toBe('ORD-P');
    expect(doc.orderStatus).toBe('draft');
    expect(doc.invoiceStatusNote).toBe('note');
    expect(doc.createdBy?.toString()).toBe(uid);
    expect(doc.delivery?.street).toBe('D St');
    expect(doc.deliveryTerms).toBe('FOB');
    expect(doc.lines).toHaveLength(1);
  });

  it('omits createdBy when userId invalid', () => {
    const doc = projectOrderDocumentFields(orderData(), '<Order />', payload, 'not-an-id');
    expect(doc.createdBy).toBeUndefined();
  });

  it('defaults orderStatus to created when not draft', () => {
    const p = { ...payload, orderStatus: 'created' as const };
    const doc = projectOrderDocumentFields(orderData(), '<Order />', p, uid);
    expect(doc.orderStatus).toBe('created');
  });
});
