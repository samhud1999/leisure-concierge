import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { extract as torquayCowrieMarket } from '../extractors/torquayCowrieMarket.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixture = (name) =>
  readFile(path.join(__dirname, 'fixtures', name), 'utf8');

test('torquayCowrieMarket extracts both upcoming market dates', async () => {
  const html = await fixture('torquayCowrieMarket.html');
  const out = torquayCowrieMarket(html);
  assert.equal(out.length, 2);
  assert.equal(out[0].name, 'Torquay Cowrie Market');
  assert.equal(out[0].start_date, '2026-06-27');
  assert.equal(out[0].event_time, '9am to 1pm');
  assert.equal(out[0].location, 'Elephant Walk Reserve');
  assert.equal(out[0].category, 'market');
  assert.equal(out[0].environment, 'outdoor');
});

test('torquayCowrieMarket returns [] if no dates found', () => {
  const out = torquayCowrieMarket('<html><body><p>Closed for winter.</p></body></html>');
  assert.deepEqual(out, []);
});
