import { parseForwardedFor } from '../../src/utils/parseForwardedFor';

describe('parseForwardedFor', () => {
  it('returns the first IP from a comma-separated string', () => {
    expect(parseForwardedFor('203.0.113.1, 10.0.0.1')).toBe('203.0.113.1');
  });

  it('trims the value from a single string entry', () => {
    expect(parseForwardedFor('  198.51.100.2  ')).toBe('198.51.100.2');
  });

  it('uses the first entry when the header is an array', () => {
    expect(parseForwardedFor(['198.51.100.3, 10.0.0.2'])).toBe('198.51.100.3');
  });

  it('returns undefined for empty or missing values', () => {
    expect(parseForwardedFor(undefined)).toBeUndefined();
    expect(parseForwardedFor('')).toBeUndefined();
    expect(parseForwardedFor('   ')).toBeUndefined();
    expect(parseForwardedFor([])).toBeUndefined();
  });
});
