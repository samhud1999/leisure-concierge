import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateGenerated,
  validateFull,
  softRepair,
  BLOCK_KINDS,
  TIMES_OF_DAY,
} from '../schema.js';

const VALID_GENERATED = {
  preferences: { party_kind: 'couple', dietary: null, pace: 'balanced', interests: [] },
  summary: { highlights: ['Good food', 'Quiet beach'] },
  days: [
    {
      id: 'day-1',
      date: '2026-06-25',
      label: 'Thu 25 Jun',
      weather: { condition: 'Clear', temp_max_c: 20, temp_min_c: 12, precip_pct: 10 },
      blocks: [
        {
          id: 'blk-101',
          kind: 'arrival',
          time_of_day: 'afternoon',
          icon: '🛬',
          title: 'Arrival & check-in',
          description: 'Settle in.',
          venue: null,
          source_url: null,
          pinned: false,
        },
      ],
    },
    {
      id: 'day-2',
      date: '2026-06-26',
      label: 'Fri 26 Jun',
      weather: { condition: 'Sunny', temp_max_c: 22, temp_min_c: 14, precip_pct: 0 },
      blocks: [
        {
          id: 'blk-102',
          kind: 'activity',
          time_of_day: 'morning',
          icon: '🥾',
          title: 'Beach walk',
          description: 'Morning stroll.',
          venue: null,
          source_url: null,
          pinned: false,
        },
      ],
    },
    {
      id: 'day-3',
      date: '2026-06-27',
      label: 'Sat 27 Jun',
      weather: { condition: 'Clear', temp_max_c: 23, temp_min_c: 15, precip_pct: 5 },
      blocks: [
        {
          id: 'blk-103',
          kind: 'dining',
          time_of_day: 'evening',
          icon: '🍽',
          title: 'Dinner',
          description: 'Fine dining.',
          venue: null,
          source_url: null,
          pinned: false,
        },
      ],
    },
    {
      id: 'day-4',
      date: '2026-06-28',
      label: 'Sun 28 Jun',
      weather: { condition: 'Cloudy', temp_max_c: 21, temp_min_c: 13, precip_pct: 20 },
      blocks: [
        {
          id: 'blk-104',
          kind: 'departure',
          time_of_day: 'morning',
          icon: '🛫',
          title: 'Checkout',
          description: 'Farewell.',
          venue: null,
          source_url: null,
          pinned: false,
        },
      ],
    },
  ],
};

const WRAPPER = {
  version: 1,
  updated_at: '2026-06-23T10:00:00Z',
  booking_id: 'RACV-TQ-3001',
  token: 'abc123xyz',
  member: { first_name: 'Eleanor', member_number: '100201' },
  stay: { check_in: '2026-06-25', check_out: '2026-06-28', nights: 3, room_type: 'Suite', party_size: 2, add_ons: [] },
  resort: { slug: 'torquay', name: 'RACV Torquay Resort', town: 'Torquay', region: 'Great Ocean Road', hero_image: '/img/resorts/torquay.jpg', summary: '' },
};

test('validateGenerated accepts a well-formed subset', () => {
  const r = validateGenerated(VALID_GENERATED);
  assert.equal(r.ok, true);
  assert.deepEqual(r.errors, []);
});

test('validateGenerated rejects missing preferences', () => {
  const bad = { summary: { highlights: [] }, days: [] };
  const r = validateGenerated(bad);
  assert.equal(r.ok, false);
  assert.ok(r.errors.some(e => /preferences/.test(e)));
});

test('validateGenerated rejects an unknown block kind', () => {
  const bad = structuredClone(VALID_GENERATED);
  bad.days[0].blocks[0].kind = 'underwater';
  const r = validateGenerated(bad);
  assert.equal(r.ok, false);
  assert.ok(r.errors.some(e => /kind/.test(e)));
});

test('validateGenerated rejects duplicate block IDs', () => {
  const bad = structuredClone(VALID_GENERATED);
  bad.days[0].blocks.push({ ...bad.days[0].blocks[0] });
  const r = validateGenerated(bad);
  assert.equal(r.ok, false);
  assert.ok(r.errors.some(e => /duplicate/.test(e)));
});

test('validateFull accepts wrapper + generated merged', () => {
  const full = { ...WRAPPER, ...VALID_GENERATED };
  const r = validateFull(full);
  assert.equal(r.ok, true);
});

test('validateFull rejects when day count != nights + 1', () => {
  const badGenerated = { ...VALID_GENERATED, days: [VALID_GENERATED.days[0]] };  // 3 nights → expects 4 days, only has 1
  const full = { ...WRAPPER, ...badGenerated };
  const r = validateFull(full);
  assert.equal(r.ok, false);
  assert.ok(r.errors.some(e => /day count/i.test(e)));
});

test('softRepair fills missing icon from kind', () => {
  const partial = structuredClone(VALID_GENERATED);
  delete partial.days[0].blocks[0].icon;
  const repaired = softRepair(partial, { weather: { days: [] } });
  assert.ok(repaired.days[0].blocks[0].icon);
});

test('softRepair truncates description over 140 chars', () => {
  const partial = structuredClone(VALID_GENERATED);
  partial.days[0].blocks[0].description = 'x'.repeat(200);
  const repaired = softRepair(partial, { weather: { days: [] } });
  assert.equal(repaired.days[0].blocks[0].description.length, 140);
  assert.ok(repaired.days[0].blocks[0].description.endsWith('…'));
});

test('softRepair defaults block.kind to "activity" when missing', () => {
  const partial = structuredClone(VALID_GENERATED);
  delete partial.days[0].blocks[0].kind;
  const repaired = softRepair(partial, { weather: { days: [] } });
  assert.equal(repaired.days[0].blocks[0].kind, 'activity');
});

test('BLOCK_KINDS exposes the 7 documented kinds', () => {
  assert.deepEqual([...BLOCK_KINDS].sort(), ['activity','arrival','departure','dining','event','free','spa']);
});

test('TIMES_OF_DAY exposes the 4 documented slots', () => {
  assert.deepEqual([...TIMES_OF_DAY].sort(), ['afternoon','evening','midday','morning']);
});
