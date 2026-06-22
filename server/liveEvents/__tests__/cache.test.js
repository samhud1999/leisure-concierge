import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTtlCache } from '../cache.js';

test('returns the compute result on miss', async () => {
  const cache = createTtlCache({ ttlMs: 1000 });
  let calls = 0;
  const value = await cache.getOrCompute('k1', async () => { calls++; return 42; });
  assert.equal(value, 42);
  assert.equal(calls, 1);
});

test('returns the cached result on second call within TTL', async () => {
  const cache = createTtlCache({ ttlMs: 1000 });
  let calls = 0;
  await cache.getOrCompute('k1', async () => { calls++; return 'first'; });
  const second = await cache.getOrCompute('k1', async () => { calls++; return 'second'; });
  assert.equal(second, 'first');
  assert.equal(calls, 1);
});

test('recomputes after TTL expires', async () => {
  const now = { v: 0 };
  const cache = createTtlCache({ ttlMs: 100, now: () => now.v });
  let calls = 0;
  await cache.getOrCompute('k1', async () => { calls++; return 'a'; });
  now.v = 200;
  const second = await cache.getOrCompute('k1', async () => { calls++; return 'b'; });
  assert.equal(second, 'b');
  assert.equal(calls, 2);
});

test('does NOT store on compute rejection', async () => {
  const cache = createTtlCache({ ttlMs: 1000 });
  await assert.rejects(
    cache.getOrCompute('k1', async () => { throw new Error('boom'); }),
    /boom/
  );
  let calls = 0;
  const value = await cache.getOrCompute('k1', async () => { calls++; return 'ok'; });
  assert.equal(value, 'ok');
  assert.equal(calls, 1);
});
