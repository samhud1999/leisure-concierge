import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { extract as torquayCowrieMarket } from '../extractors/torquayCowrieMarket.js';
import { extract as visitGreatOceanRoad } from '../extractors/visitGreatOceanRoad.js';
import { extract as surfCoastEvents } from '../extractors/surfCoastEvents.js';

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

test('visitGreatOceanRoad extracts both event cards', async () => {
  const html = await fixture('visitGreatOceanRoad.html');
  const out = visitGreatOceanRoad(html);
  assert.equal(out.length, 2);
  assert.equal(out[0].name, 'Torquay Sunset Sessions');
  assert.equal(out[0].start_date, '2026-06-26');
  assert.equal(out[0].event_time, '5pm – 8pm');
  assert.equal(out[0].location, 'Torquay Foreshore');
  assert.equal(out[0].category, 'music');
  assert.equal(out[0].environment, 'outdoor');
  assert.equal(out[0].description, 'Live acoustic sets at sunset on the foreshore.');
  assert.equal(out[1].end_date, '2026-06-28');
  assert.equal(out[1].category, 'culture');
});

test('visitGreatOceanRoad returns [] when no cards present', () => {
  const out = visitGreatOceanRoad('<html><body><p>No events.</p></body></html>');
  assert.deepEqual(out, []);
});

test('surfCoastEvents extracts from JSON-LD with date splitting', async () => {
  const html = await fixture('surfCoastEvents.html');
  const out = surfCoastEvents(html);
  assert.equal(out.length, 2);
  assert.equal(out[0].name, 'Torquay Twilight Run');
  assert.equal(out[0].start_date, '2026-06-29');
  assert.equal(out[0].end_date, '2026-06-29');
  assert.equal(out[0].event_time, '17:30');
  assert.equal(out[0].location, 'Torquay Esplanade');
  assert.equal(out[1].name, 'Indoor Trivia Night');
  assert.equal(out[1].event_time, '19:00');
});

test('surfCoastEvents returns [] if no JSON-LD present', () => {
  const out = surfCoastEvents('<html><body><p>Nothing.</p></body></html>');
  assert.deepEqual(out, []);
});

test('surfCoastEvents tolerates malformed JSON-LD', () => {
  const out = surfCoastEvents('<html><body><script type="application/ld+json">{ not json</script></body></html>');
  assert.deepEqual(out, []);
});
