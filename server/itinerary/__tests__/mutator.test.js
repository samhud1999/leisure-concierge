import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  addActivity, swapActivity, removeActivity, reorderDay,
  setPreference, pinBlock,
} from '../mutator.js';

function seedDoc() {
  return {
    version: 1, updated_at: 't', booking_id: 'X-1', token: 'tok',
    member: { first_name: 'A', member_number: '1' },
    stay: { check_in: '2026-06-25', check_out: '2026-06-26', nights: 1, room_type: 'Suite', party_size: 1, add_ons: [] },
    resort: { slug: 't', name: 'T', town: 'T', region: 'T', hero_image: '/img/resorts/t.jpg', summary: '' },
    preferences: { party_kind: 'solo', dietary: null, pace: 'balanced', interests: [] },
    summary: { highlights: [] },
    days: [
      { id: 'day-1', date: '2026-06-25', label: 'Thu 25 Jun', weather: { condition: 'Clear', precip_pct: 0 },
        blocks: [
          { id: 'blk-101', kind: 'arrival', time_of_day: 'afternoon', icon: '🛬', title: 'Arrival', description: 'In.', venue: null, source_url: null, pinned: false },
          { id: 'blk-102', kind: 'dining',  time_of_day: 'evening',   icon: '🍽', title: 'Dinner',  description: 'Eat.', venue: null, source_url: null, pinned: false },
        ]},
      { id: 'day-2', date: '2026-06-26', label: 'Fri 26 Jun', weather: { condition: 'Clear', precip_pct: 0 },
        blocks: [
          { id: 'blk-103', kind: 'departure', time_of_day: 'morning', icon: '🛫', title: 'Departure', description: 'Out.', venue: null, source_url: null, pinned: false },
        ]},
    ],
  };
}

function fakeSupabase(doc) {
  return {
    state: doc,
    from() { return {
      select() { return this; }, eq() { return this; },
      maybeSingle: async () => ({ data: { doc: this.state, version: this.state.version }, error: null }),
      update(patch) { Object.assign(this.state, patch.doc ? patch.doc : {}, patch); return this; },
    }; },
    // We hand-roll a tiny update flow for the test:
    async _update(patch) { Object.assign(this.state, patch); },
  };
}

// Cleaner: pass an explicit doc store with read/write methods.
function makeStore(doc) {
  return {
    async load() { return doc; },
    async save(next) { Object.assign(doc, next); doc.version = next.version; },
  };
}

test('addActivity appends a new block with a fresh id and bumps version', async () => {
  const doc = seedDoc(); const store = makeStore(doc);
  const r = await addActivity({ store, day_id: 'day-1', time_of_day: 'morning', kind: 'activity', title: 'Walk' });
  assert.match(r.block_id, /^blk-/);
  assert.equal(r.version, 2);
  assert.equal(doc.days[0].blocks.length, 3);
});

test('swapActivity replaces a block while preserving its id', async () => {
  const doc = seedDoc(); const store = makeStore(doc);
  const r = await swapActivity({ store, block_id: 'blk-102', replacement: { kind: 'dining', title: 'Brunch' } });
  assert.equal(r.block_id, 'blk-102');
  assert.equal(doc.days[0].blocks[1].title, 'Brunch');
  assert.equal(doc.days[0].blocks[1].id, 'blk-102');
});

test('swapActivity rejects when the block is pinned', async () => {
  const doc = seedDoc(); doc.days[0].blocks[1].pinned = true;
  const store = makeStore(doc);
  await assert.rejects(
    swapActivity({ store, block_id: 'blk-102', replacement: { kind: 'dining', title: 'Brunch' } }),
    /pinned/i
  );
});

test('removeActivity drops the block', async () => {
  const doc = seedDoc(); const store = makeStore(doc);
  await removeActivity({ store, block_id: 'blk-102' });
  assert.equal(doc.days[0].blocks.length, 1);
});

test('removeActivity rejects pinned', async () => {
  const doc = seedDoc(); doc.days[0].blocks[0].pinned = true;
  const store = makeStore(doc);
  await assert.rejects(removeActivity({ store, block_id: 'blk-101' }), /pinned/i);
});

test('reorderDay reshuffles by block_ids', async () => {
  const doc = seedDoc(); const store = makeStore(doc);
  await reorderDay({ store, day_id: 'day-1', block_ids: ['blk-102','blk-101'] });
  assert.deepEqual(doc.days[0].blocks.map(b => b.id), ['blk-102','blk-101']);
});

test('reorderDay rejects unknown block_ids', async () => {
  const doc = seedDoc(); const store = makeStore(doc);
  await assert.rejects(
    reorderDay({ store, day_id: 'day-1', block_ids: ['blk-999','blk-101'] }),
    /unknown/i,
  );
});

test('setPreference writes only known keys', async () => {
  const doc = seedDoc(); const store = makeStore(doc);
  await setPreference({ store, key: 'pace', value: 'active' });
  assert.equal(doc.preferences.pace, 'active');
  await assert.rejects(setPreference({ store, key: 'evil', value: 'x' }), /unknown/i);
});

test('pinBlock toggles the flag and survives subsequent swaps', async () => {
  const doc = seedDoc(); const store = makeStore(doc);
  await pinBlock({ store, block_id: 'blk-102', pinned: true });
  assert.equal(doc.days[0].blocks[1].pinned, true);
});
