import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapWeather, buildGeneratorPrompt, assembleDoc } from '../generator.js';

test('mapWeather renames Open-Meteo fields to itinerary names', () => {
  const open = {
    available: true,
    days: [
      { date: '2026-06-25', condition: 'Clear', temp_max_c: 20, temp_min_c: 12,
        precipitation_mm: 0.2, precipitation_chance_pct: 10 },
    ],
  };
  const out = mapWeather(open);
  assert.equal(out.length, 1);
  assert.equal(out[0].precip_pct, 10);
  assert.equal(out[0].precip_mm, 0.2);
  assert.equal(out[0].condition, 'Clear');
  assert.equal(out[0].temp_max_c, 20);
});

test('mapWeather returns [] when forecast unavailable', () => {
  assert.deepEqual(mapWeather({ available: false }), []);
  assert.deepEqual(mapWeather(undefined), []);
});

test('buildGeneratorPrompt includes the booking and weather context', () => {
  const prompt = buildGeneratorPrompt({
    member: { first_name: 'Eleanor' },
    booking: { check_in: '2026-06-25', check_out: '2026-06-28', nights: 3, room_type: 'Suite', party_size: 2, add_ons: [] },
    resort: { name: 'RACV Torquay Resort', amenities: [], dining: [], experiences: [], room_types: [], local_guides: [] },
    events: [],
    weather: [{ date: '2026-06-25', precip_pct: 10 }],
  });
  assert.ok(prompt.includes('RACV Torquay Resort'));
  assert.ok(prompt.includes('2026-06-25'));
  assert.ok(prompt.includes('SCHEMA'));
});

test('assembleDoc merges wrapper fields onto generated subset', () => {
  const generated = {
    preferences: { party_kind: 'couple', dietary: null, pace: 'balanced', interests: [] },
    summary: { highlights: [] },
    days: [],
  };
  const wrapper = {
    booking_id: 'X-1', token: 'tok', member: { first_name: 'A', member_number: '1' },
    stay: { check_in: '2026-06-25', check_out: '2026-06-26', nights: 1, room_type: 'Suite', party_size: 1, add_ons: [] },
    resort: { slug: 't', name: 'T', town: 'T', region: 'T', hero_image: '/img/resorts/t.jpg', summary: '' },
  };
  const full = assembleDoc({ generated, wrapper });
  assert.equal(full.booking_id, 'X-1');
  assert.equal(full.member.first_name, 'A');
  assert.equal(full.version, 1);
  assert.ok(full.updated_at);
  assert.deepEqual(full.preferences, generated.preferences);
});
