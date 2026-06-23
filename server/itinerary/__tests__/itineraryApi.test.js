import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { mountItineraryApi } from '../../routes/itineraryApi.js';

function makeApp(generateImpl) {
  const app = express();
  app.use(express.json());
  mountItineraryApi(app, {
    supabase: null, anthropic: null, model: 'glm-test',
    generateItinerary: generateImpl,                 // inject for testing
  });
  return app;
}

async function request(app, method, path, body) {
  const port = 0;
  return new Promise((resolve, reject) => {
    const server = app.listen(port, async () => {
      const { port: p } = server.address();
      try {
        const r = await fetch(`http://127.0.0.1:${p}${path}`, {
          method, headers: { 'Content-Type': 'application/json' },
          body: body ? JSON.stringify(body) : undefined,
        });
        const text = await r.text();
        let json = null; try { json = JSON.parse(text); } catch {}
        resolve({ status: r.status, body: json ?? text });
      } catch (e) { reject(e); }
      finally { server.close(); }
    });
  });
}

test('POST /api/itinerary/:token/generate returns the built itinerary', async () => {
  const fake = async ({ token }) => ({ token, version: 1, days: [] });
  const app = makeApp(fake);
  const r = await request(app, 'POST', '/api/itinerary/abc/generate');
  assert.equal(r.status, 200);
  assert.equal(r.body.itinerary.token, 'abc');
});

test('returns 404 when generator throws itinerary_not_found', async () => {
  const fake = async () => { throw Object.assign(new Error('itinerary_not_found'), { httpStatus: 404 }); };
  const app = makeApp(fake);
  const r = await request(app, 'POST', '/api/itinerary/missing/generate');
  assert.equal(r.status, 404);
});

test('returns 502 when generator throws generator_unparseable', async () => {
  const fake = async () => { throw Object.assign(new Error('generator_unparseable'), { httpStatus: 502 }); };
  const app = makeApp(fake);
  const r = await request(app, 'POST', '/api/itinerary/abc/generate');
  assert.equal(r.status, 502);
});
