import {
  dateKeyFromValue,
  formatJobCardNumber,
  normalizeJobCardPrefix,
  parseJobCardSequence,
} from './job-card-number';

describe('job-card-number helpers', () => {
  it('normalizes prefixes', () => {
    expect(normalizeJobCardPrefix(' rm ')).toBe('RM');
    expect(normalizeJobCardPrefix('')).toBe('JC');
    expect(normalizeJobCardPrefix(undefined)).toBe('JC');
  });

  it('builds date keys from local datetime strings without timezone drift', () => {
    expect(dateKeyFromValue('2026-10-19T21:55')).toBe('20261019');
    expect(dateKeyFromValue('20261019')).toBe('20261019');
  });

  it('formats and parses sequences', () => {
    expect(formatJobCardNumber('RM', '20261019', 4)).toBe('RM202610190004');
    expect(parseJobCardSequence('RM202610190004', 'RM', '20261019')).toBe(4);
    expect(parseJobCardSequence('JC202610190001', 'RM', '20261019')).toBeNull();
  });
});
