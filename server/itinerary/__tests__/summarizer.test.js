import { test } from 'node:test';
import assert from 'node:assert/strict';
import { regenerateHighlights } from '../summarizer.js';

function blk(kind, title) {
  return { id: 'blk-x', kind, time_of_day: 'morning', icon: '●', title, description: '', pinned: false };
}

test('counts spa treatments across the stay', () => {
  const doc = { days: [
    { weather: { precip_pct: 10 }, blocks: [blk('spa', 'One Spa')] },
    { weather: { precip_pct: 10 }, blocks: [blk('spa', 'One Spa')] },
  ]};
  const hl = regenerateHighlights(doc);
  assert.ok(hl.some(h => /2 spa treatments/i.test(h)));
});

test('reports markets and other events with date', () => {
  const doc = { days: [
    { date: '2026-06-28', label: 'Sat 28 Jun', weather: { precip_pct: 0 }, blocks: [blk('event', 'Torquay Farmers Market')] },
  ]};
  const hl = regenerateHighlights(doc);
  assert.ok(hl.some(h => /farmers market/i.test(h) && /sat 28/i.test(h)));
});

test('characterises weather across the trip', () => {
  const doc = { days: [
    { weather: { precip_pct: 5 }, blocks: [] },
    { weather: { precip_pct: 5 }, blocks: [] },
    { weather: { precip_pct: 70 }, blocks: [] },
  ]};
  const hl = regenerateHighlights(doc);
  assert.ok(hl.some(h => /weather/i.test(h)));
});

test('returns at most 4 highlights', () => {
  const blocks = ['spa','spa','dining','dining','event','event','activity','activity'].map(k => blk(k, k));
  const doc = { days: [{ weather: { precip_pct: 0 }, blocks }] };
  const hl = regenerateHighlights(doc);
  assert.ok(hl.length <= 4);
});

test('returns [] when days is empty or missing', () => {
  assert.deepEqual(regenerateHighlights({}), []);
  assert.deepEqual(regenerateHighlights({ days: [] }), []);
});
