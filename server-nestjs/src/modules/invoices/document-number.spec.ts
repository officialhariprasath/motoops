import {
  documentPrefixFor,
  formatDocumentNumber,
  normalizeGaragePrefix,
  parseDocumentSequence,
} from './document-number';

describe('document-number helpers', () => {
  it('builds RME / RMI from garage prefix RM', () => {
    expect(normalizeGaragePrefix(' rm ')).toBe('RM');
    expect(documentPrefixFor('RM', 'ESTIMATE')).toBe('RME');
    expect(documentPrefixFor('RM', 'BILL')).toBe('RMI');
  });

  it('formats and parses 6-digit serials like existing JMI style', () => {
    expect(formatDocumentNumber('RMI', 1)).toBe('RMI000001');
    expect(formatDocumentNumber('RME', 12)).toBe('RME000012');
    expect(parseDocumentSequence('RMI000003', 'RMI')).toBe(3);
    expect(parseDocumentSequence('JMI000001', 'RMI')).toBeNull();
  });
});
