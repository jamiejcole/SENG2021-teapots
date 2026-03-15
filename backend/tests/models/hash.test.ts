import { sha256 } from '../../src/models/hash';

describe('sha256', () => {
  it('returns a deterministic hash for same input', () => {
    const a = sha256('hello');
    const b = sha256('hello');

    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });

  it('returns different hashes for different input', () => {
    expect(sha256('hello')).not.toBe(sha256('world'));
  });
});
