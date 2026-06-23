import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { mountLoginRoute } from '../../routes/login.js';

function fakeSupabase({ memberRow, itineraryRows }) {
  // itineraryRows may be an array (new multi-booking path) or a single object
  // (legacy single-row shorthand for existing tests).
  return {
    from(t) {
      const chain = {
        select() { return this; },
        eq() { return this; },
        ilike() { return this; },
        order() { return this; },
        limit() { return this; },
        // .maybeSingle() used by the members table lookup.
        maybeSingle: async () => t === 'members'
          ? { data: memberRow, error: null }
          : { data: Array.isArray(itineraryRows) ? (itineraryRows[0] ?? null) : itineraryRows, error: null },
        // Direct array resolution — returned by login's itinerary query (no .maybeSingle()).
        then: undefined,
      };
      // Make the chain itself thenable so `await supabase.from(...).select(...).eq(...).order(...).limit(...)` works.
      chain[Symbol.toStringTag] = 'FakeChain';
      // Attach a custom .then so the chain resolves as { data: [...] } when awaited directly.
      Object.defineProperty(chain, 'then', {
        get() {
          return (resolve) => {
            const data = t === 'members'
              ? memberRow  // members path always uses .maybeSingle(), never direct await
              : (Array.isArray(itineraryRows) ? itineraryRows : (itineraryRows ? [itineraryRows] : []));
            resolve({ data, error: null });
          };
        },
      });
      return chain;
    },
  };
}

async function post(app, path, body) {
  return new Promise((resolve) => {
    const server = app.listen(0, async () => {
      const { port } = server.address();
      const r = await fetch(`http://127.0.0.1:${port}${path}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await r.json();
      server.close();
      resolve({ status: r.status, body: json });
    });
  });
}

test('valid creds return token + redirect', async () => {
  const app = express(); app.use(express.json());
  mountLoginRoute(app, { supabase: fakeSupabase({
    memberRow: { id: 1 },
    itineraryRows: [{ token: 'abc123xyz', created_at: '2026-06-20' }],
  }) });
  const r = await post(app, '/api/login', { member_number: '100201', surname: 'Whitman' });
  assert.equal(r.status, 200);
  assert.equal(r.body.token, 'abc123xyz');
  assert.equal(r.body.redirect, '/i/abc123xyz');
});

test('wrong surname returns 401 with generic message', async () => {
  const app = express(); app.use(express.json());
  mountLoginRoute(app, { supabase: fakeSupabase({ memberRow: null, itineraryRows: [] }) });
  const r = await post(app, '/api/login', { member_number: '100201', surname: 'Wrong' });
  assert.equal(r.status, 401);
  assert.equal(r.body.error, 'no_match');
  // MUST NOT reveal which field failed:
  assert.ok(!/surname|member/i.test(JSON.stringify(r.body)));
});

test('missing fields → 400', async () => {
  const app = express(); app.use(express.json());
  mountLoginRoute(app, { supabase: fakeSupabase({ memberRow: null, itineraryRows: [] }) });
  const r = await post(app, '/api/login', { member_number: '100201' });
  assert.equal(r.status, 400);
});

test('multi-booking member returns most-recent itinerary (C3)', async () => {
  const app = express(); app.use(express.json());
  mountLoginRoute(app, { supabase: fakeSupabase({
    memberRow: { id: 1 },
    itineraryRows: [
      { token: 'tokA', created_at: '2026-06-25' },
      { token: 'tokB', created_at: '2026-06-20' },
    ],
  }) });
  const r = await post(app, '/api/login', { member_number: '100214', surname: 'Andersson' });
  assert.equal(r.status, 200);
  assert.equal(r.body.token, 'tokA');
  assert.equal(r.body.redirect, '/i/tokA');
});
