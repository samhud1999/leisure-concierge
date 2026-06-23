import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { mountLoginRoute } from '../../routes/login.js';

function fakeSupabase({ memberRow, itineraryRow }) {
  return {
    from(t) {
      return {
        select() { return this; },
        eq() { return this; },
        ilike() { return this; },
        maybeSingle: async () => t === 'members'
          ? { data: memberRow, error: null }
          : { data: itineraryRow, error: null },
      };
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
    itineraryRow: { token: 'abc123xyz' },
  }) });
  const r = await post(app, '/api/login', { member_number: '100201', surname: 'Whitman' });
  assert.equal(r.status, 200);
  assert.equal(r.body.token, 'abc123xyz');
  assert.equal(r.body.redirect, '/i/abc123xyz');
});

test('wrong surname returns 401 with generic message', async () => {
  const app = express(); app.use(express.json());
  mountLoginRoute(app, { supabase: fakeSupabase({ memberRow: null, itineraryRow: null }) });
  const r = await post(app, '/api/login', { member_number: '100201', surname: 'Wrong' });
  assert.equal(r.status, 401);
  assert.equal(r.body.error, 'no_match');
  // MUST NOT reveal which field failed:
  assert.ok(!/surname|member/i.test(JSON.stringify(r.body)));
});

test('missing fields → 400', async () => {
  const app = express(); app.use(express.json());
  mountLoginRoute(app, { supabase: fakeSupabase({ memberRow: null, itineraryRow: null }) });
  const r = await post(app, '/api/login', { member_number: '100201' });
  assert.equal(r.status, 400);
});
