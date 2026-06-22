export function createTtlCache({ ttlMs, now = () => Date.now() }) {
  const store = new Map();
  return {
    async getOrCompute(key, compute) {
      const entry = store.get(key);
      if (entry && now() - entry.storedAt < ttlMs) {
        return entry.value;
      }
      const value = await compute();
      store.set(key, { value, storedAt: now() });
      return value;
    },
  };
}
