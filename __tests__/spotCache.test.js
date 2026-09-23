const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createSpotCache,
  withCachedSnapshot,
} = require('../utils/spotCache');

test('createSpotCache stores a city payload by key and returns a TTL-safe cached value', () => {
  const cache = createSpotCache(1000);
  cache.set('athens', [{ id: 'a', title: 'Alpha' }]);

  assert.deepEqual(cache.get('athens'), [{ id: 'a', title: 'Alpha' }]);
});

test('withCachedSnapshot falls back to cache if Firestore reader is unavailable', async () => {
  const cache = createSpotCache(1000);
  cache.set('athens', [{ id: 'a', title: 'Alpha' }]);

  const value = await withCachedSnapshot(
    'athens',
    () => Promise.reject(new Error('offline')),
    cache,
    600000
  );

  assert.equal(value.length, 1);
  assert.equal(value[0].id, 'a');
});
