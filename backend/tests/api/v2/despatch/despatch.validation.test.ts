import { assertCreateDespatchPayload } from '../../../../src/api/v2/despatch/despatch.validation';
import { HttpError } from '../../../../src/errors/HttpError';

const party = {
  name: 'Co',
  address: { street: 's', city: 'c', postalCode: '1', country: 'AU' },
};

const base = {
  orderId: 'ORD-1',
  despatchDate: '2026-03-01',
  supplierParty: party,
  deliveryParty: party,
  lines: [{ lineId: '1', description: 'Box', quantity: 2 }],
};

describe('despatch.validation', () => {
  it('accepts valid payload', () => {
    expect(() => assertCreateDespatchPayload(base)).not.toThrow();
  });

  it('rejects invalid root and required fields', () => {
    expect(() => assertCreateDespatchPayload(null)).toThrow(HttpError);
    expect(() => assertCreateDespatchPayload({ ...base, orderId: ' ' })).toThrow(HttpError);
    expect(() => assertCreateDespatchPayload({ ...base, despatchDate: '' })).toThrow(HttpError);
  });

  it('rejects party and lines problems', () => {
    expect(() => assertCreateDespatchPayload({ ...base, supplierParty: null })).toThrow(HttpError);
    expect(() => assertCreateDespatchPayload({ ...base, lines: [] })).toThrow(HttpError);
    expect(() =>
      assertCreateDespatchPayload({
        ...base,
        lines: [{ lineId: '', description: 'x', quantity: 1 }],
      })
    ).toThrow(HttpError);
    expect(() =>
      assertCreateDespatchPayload({
        ...base,
        lines: [{ lineId: '1', description: '', quantity: 1 }],
      })
    ).toThrow(HttpError);
    expect(() =>
      assertCreateDespatchPayload({
        ...base,
        lines: [{ lineId: '1', description: 'x', quantity: 0 }],
      })
    ).toThrow(HttpError);
  });
});
