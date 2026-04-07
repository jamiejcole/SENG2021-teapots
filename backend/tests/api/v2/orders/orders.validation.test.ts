import { assertCreateOrderPayload } from '../../../../src/api/v2/orders/orders.validation';
import { HttpError } from '../../../../src/errors/HttpError';

const validParty = {
  name: 'P',
  address: { street: 's', city: 'c', postalCode: '1', country: 'AU' },
};

const base = {
  orderId: 'O1',
  issueDate: '2026-01-01',
  currency: 'AUD',
  buyer: validParty,
  seller: validParty,
  lines: [{ description: 'L', quantity: 1, unitPrice: 1 }],
};

describe('orders.validation', () => {
  it('accepts a valid payload', () => {
    expect(() => assertCreateOrderPayload(base)).not.toThrow();
  });

  it('rejects non-object body', () => {
    expect(() => assertCreateOrderPayload(null)).toThrow(HttpError);
  });

  it('rejects bad orderId, issueDate, currency', () => {
    expect(() => assertCreateOrderPayload({ ...base, orderId: '  ' })).toThrow(HttpError);
    expect(() => assertCreateOrderPayload({ ...base, issueDate: '' })).toThrow(HttpError);
    expect(() => assertCreateOrderPayload({ ...base, currency: '' })).toThrow(HttpError);
  });

  it('rejects invalid buyer/seller', () => {
    expect(() => assertCreateOrderPayload({ ...base, buyer: null })).toThrow(HttpError);
    expect(() =>
      assertCreateOrderPayload({ ...base, buyer: { ...validParty, name: '' } })
    ).toThrow(HttpError);
    expect(() =>
      assertCreateOrderPayload({ ...base, buyer: { name: 'x', address: null } })
    ).toThrow(HttpError);
  });

  it('rejects lines array issues', () => {
    expect(() => assertCreateOrderPayload({ ...base, lines: [] })).toThrow(HttpError);
    expect(() =>
      assertCreateOrderPayload({ ...base, lines: [{ description: '', quantity: 1, unitPrice: 1 }] })
    ).toThrow(HttpError);
    expect(() =>
      assertCreateOrderPayload({ ...base, lines: [{ description: 'x', quantity: 0, unitPrice: 1 }] })
    ).toThrow(HttpError);
    expect(() =>
      assertCreateOrderPayload({ ...base, lines: [{ description: 'x', quantity: 1, unitPrice: -1 }] })
    ).toThrow(HttpError);
  });

  it('rejects bad taxRate and orderStatus', () => {
    expect(() => assertCreateOrderPayload({ ...base, taxRate: 'x' as any })).toThrow(HttpError);
    expect(() => assertCreateOrderPayload({ ...base, orderStatus: 'bad' as any })).toThrow(HttpError);
  });
});
