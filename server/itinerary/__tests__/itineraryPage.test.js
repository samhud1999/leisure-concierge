import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mountItineraryPage } from '../../routes/itineraryPage.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, '..', '..', '..', 'public');

function makeSupabase(row) {
  return { from() { return {
    select() { return this; }, eq() { return this; },
    maybeSingle: async () => ({ data: row, error: null }),
  }; } };
}

async function get(app, path) {
  return new Promise((resolve) => {
    const server = app.listen(0, async () => {
      const { port } = server.address();
      const r = await fetch(`http://127.0.0.1:${port}${path}`);
      const text = await r.text();
      server.close();
      resolve({ status: r.status, body: text });
    });
  });
}

test('serves itinerary.html with ready doc inlined', async () => {
  const app = express();
  mountItineraryPage(app, { supabase: makeSupabase({ status: 'ready', doc: { token: 'abc', days: [] } }), publicDir: PUBLIC });
  const r = await get(app, '/i/abc');
  assert.equal(r.status, 200);
  assert.ok(r.body.includes('"token":"abc"'));
});

test('serves the loading shell with pending status', async () => {
  const app = express();
  mountItineraryPage(app, { supabase: makeSupabase({ status: 'pending', doc: {} }), publicDir: PUBLIC });
  const r = await get(app, '/i/xyz');
  assert.equal(r.status, 200);
  assert.ok(r.body.includes('"status":"pending"'));
});

test('returns 404 for an unknown token', async () => {
  const app = express();
  mountItineraryPage(app, { supabase: makeSupabase(null), publicDir: PUBLIC });
  const r = await get(app, '/i/nope');
  assert.equal(r.status, 404);
});
