function createSpotCache(ttlMs = 5 * 60 * 1000) {
  const store = new Map();

  function normalizedKey(city) {
    return String(city || 'all').trim().toLowerCase();
  }

  return {
    set(city, data) {
      store.set(normalizedKey(city), {
        createdAt: Date.now(),
        ttlMs,
        data,
      });
    },
    get(city) {
      const key = normalizedKey(city);
      const found = store.get(key);
      if (!found) return null;

      const isExpired = Date.now() - found.createdAt > found.ttlMs;
      if (isExpired) {
        store.delete(key);
        return null;
      }

      return found.data;
    },
    clear(city) {
      if (city) {
        store.delete(normalizedKey(city));
        return;
      }
      store.clear();
    },
  };
}

async function withCachedSnapshot(city, readFn, cache, ttlMs = 5 * 60 * 1000) {
  const existing = cache.get(city);
  if (existing) {
    return existing;
  }

  try {
    const fresh = await readFn();
    cache.set(city, fresh);
    return fresh;
  } catch (error) {
    const fallback = cache.get(city);
    if (fallback) {
      return fallback;
    }

    throw error;
  }
}

module.exports = {
  createSpotCache,
  withCachedSnapshot,
};
