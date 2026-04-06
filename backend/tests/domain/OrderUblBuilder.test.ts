import { buildOrderFromPayload } from '../../src/domain/OrderUblBuilder';
import type { CreateOrderPayload } from '../../src/types/order.dto';

const baseParty = {
  name: 'Acme',
  id: 'urn:party:1',
  email: 'a@example.com',
  address: { street: '1 Main St', city: 'Sydney', postalCode: '2000', country: 'AU' },
};

function payload(over?: Partial<CreateOrderPayload>): CreateOrderPayload {
  return {
    orderId: 'ORD-1',
    issueDate: '2026-03-15',
    currency: 'aud',
    buyer: baseParty,
    seller: { ...baseParty, name: 'Seller Co' },
    lines: [{ description: 'Tea', quantity: 2, unitPrice: 10 }],
    ...over,
  };
}

describe('OrderUblBuilder', () => {
  it('builds XML and orderData for a minimal payload', () => {
    const { orderXml, orderData } = buildOrderFromPayload(payload());
    expect(orderXml).toContain('<Order ');
    expect(orderXml).toContain('ORD-1');
    expect((orderData.ID as { value?: string })?.value).toBe('ORD-1');
    expect((orderData.DocumentCurrencyCode as { value?: string })?.value).toBe('AUD');
  });

  it('applies taxRate when provided', () => {
    const { orderXml } = buildOrderFromPayload(payload({ taxRate: 0.1 }));
    expect(orderXml).toBeDefined();
  });

  it('supports multiple lines and lineId', () => {
    const { orderData } = buildOrderFromPayload(
      payload({
        lines: [
          { lineId: 'A', description: 'One', quantity: 1, unitPrice: 5 },
          { description: 'Two', quantity: 2, unitPrice: 3, unitCode: 'KGM' },
        ],
      })
    );
    const lines = Array.isArray(orderData.OrderLine) ? orderData.OrderLine : [orderData.OrderLine];
    expect(lines.length).toBe(2);
  });

  it('includes note, delivery, and deliveryTerms when set', () => {
    const { orderXml } = buildOrderFromPayload(
      payload({
        note: 'Handle with care',
        deliveryTerms: 'DAP',
        delivery: {
          address: { street: '9 Wharf Rd', city: 'Sydney', postalCode: '2000', country: 'AU' },
          requestedDeliveryStart: '2026-04-01',
          requestedDeliveryEnd: '2026-04-05',
        },
      })
    );
    expect(orderXml).toContain('Handle with care');
    expect(orderXml).toContain('cac:Delivery');
    expect(orderXml).toContain('DAP');
  });

  it('splits street into street name and building number when multiple tokens', () => {
    const { orderData } = buildOrderFromPayload(
      payload({
        buyer: {
          ...baseParty,
          address: { street: '10 George Street', city: 'Syd', postalCode: '2000', country: 'AU' },
        },
      })
    );
    const party = orderData.BuyerCustomerParty?.Party as any;
    expect(party.PostalAddress.StreetName).toContain('George');
  });
});
