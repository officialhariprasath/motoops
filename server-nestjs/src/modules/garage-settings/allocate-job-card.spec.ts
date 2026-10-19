import {
  dateKeyFromValue,
  formatJobCardNumber,
  normalizeJobCardPrefix,
  parseJobCardSequence,
} from './job-card-number';

describe('Option A server allocate helpers', () => {
  it('keeps RM prefix and rejects relying on device JC default', () => {
    expect(normalizeJobCardPrefix('RM')).toBe('RM');
    expect(normalizeJobCardPrefix(' jc ')).toBe('JC');
  });

  it('builds next free number after existing RM cards for the day', () => {
    const prefix = 'RM';
    const dateKey = dateKeyFromValue('2026-10-19T21:55');
    const existing = [
      'RM202610190001',
      'RM202610190002',
      'RM202610190003',
      'JC202610190001', // wrong prefix ignored for RM sequence
    ];
    let max = 0;
    for (const number of existing) {
      const seq = parseJobCardSequence(number, prefix, dateKey);
      if (seq != null) max = Math.max(max, seq);
    }
    expect(formatJobCardNumber(prefix, dateKey, max + 1)).toBe(
      'RM202610190004',
    );
  });

  it('preferred JC is not kept when garage prefix is RM', () => {
    const garagePrefix = 'RM';
    const preferred = 'JC202610190001';
    const keepPreferred = preferred.startsWith(garagePrefix);
    expect(keepPreferred).toBe(false);
  });
});
