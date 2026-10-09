/**
 * Catalog uniqueness message helpers (logic mirror of CatalogService.assertUniqueName).
 * Run: npx --yes tsx src/modules/catalog/catalog-unique.test.ts
 */

function kindLabel(kind: 'GENERAL' | 'PROFIT') {
  return kind === 'PROFIT' ? 'Profit items' : 'General items';
}

function uniquenessMessage(existingKind: 'GENERAL' | 'PROFIT') {
  return `Item already exists in ${kindLabel(existingKind)}`;
}

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(
  uniquenessMessage('GENERAL') === 'Item already exists in General items',
  'general message',
);
assert(
  uniquenessMessage('PROFIT') === 'Item already exists in Profit items',
  'profit message',
);

function normalizeKind(raw?: string): 'GENERAL' | 'PROFIT' {
  return raw === 'PROFIT' ? 'PROFIT' : 'GENERAL';
}

assert(normalizeKind(undefined) === 'GENERAL', 'default GENERAL');
assert(normalizeKind('PROFIT') === 'PROFIT', 'PROFIT');
assert(normalizeKind('GENERAL') === 'GENERAL', 'GENERAL');
assert(normalizeKind('other') === 'GENERAL', 'unknown → GENERAL');

console.log('catalog-unique.test.ts: all passed');
