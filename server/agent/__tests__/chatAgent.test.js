import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildChatSystemPrompt, CHAT_TOOLS, runChatAgent } from '../chatAgent.js';

const ITIN = {
  version: 1, booking_id: 'X', token: 'tok',
  member: { first_name: 'A', member_number: '1' },
  stay: { check_in: '2026-06-25', check_out: '2026-06-26', nights: 1, room_type: 'Suite', party_size: 1, add_ons: [] },
  resort: { slug: 't', name: 'T', town: 'T', region: 'T', hero_image: '/img/resorts/t.jpg', summary: '' },
  preferences: { party_kind: 'solo', dietary: null, pace: 'balanced', interests: [] },
  summary: { highlights: [] },
  days: [
    { id: 'day-1', date: '2026-06-25', label: 'Thu 25 Jun', weather: { condition: 'Clear', precip_pct: 0 }, blocks: [{ id: 'blk-101', kind: 'arrival', time_of_day: 'afternoon', icon: '🛬', title: 'Arrival', description: '', venue: null, source_url: null, pinned: false }] },
    { id: 'day-2', date: '2026-06-26', label: 'Fri 26 Jun', weather: { condition: 'Clear', precip_pct: 0 }, blocks: [{ id: 'blk-102', kind: 'departure', time_of_day: 'morning', icon: '🛫', title: 'Departure', description: '', venue: null, source_url: null, pinned: false }] },
  ],
};

test('CHAT_TOOLS includes the 7 mutation tools by name', () => {
  const names = CHAT_TOOLS.map(t => t.name);
  for (const n of ['add_activity','swap_activity','remove_activity','reorder_day','set_preference','regenerate_day','pin_block']) {
    assert.ok(names.includes(n), `missing tool ${n}`);
  }
});

test('CHAT_TOOLS includes the 5 read-only tools', () => {
  const names = CHAT_TOOLS.map(t => t.name);
  for (const n of ['member_lookup','get_booking','get_resort_knowledge','get_events','get_weather']) {
    assert.ok(names.includes(n), `missing tool ${n}`);
  }
});

test('buildChatSystemPrompt embeds the current itinerary JSON', () => {
  const prompt = buildChatSystemPrompt({ itinerary: ITIN, userMessage: 'change dinner' });
  assert.ok(prompt.includes('Thu 25 Jun'));
  assert.ok(prompt.includes('ui_hint'));
});

test('runChatAgent parses a final-text JSON response and returns reply + ui_hint', async () => {
  const fakeAnthropic = {
    messages: {
      async create() {
        return {
          stop_reason: 'end_turn',
          content: [{ type: 'text', text: '{"reply":"Done.","ui_hint":{"type":"chips","options":["A","B"]}}' }],
        };
      },
    },
  };
  const fakeSupabase = { from: () => ({
    select() { return this; }, eq() { return this; },
    maybeSingle: async () => ({ data: { doc: ITIN, version: 1 }, error: null }),
  }) };
  const out = await runChatAgent({
    token: 'tok', messages: [{ role: 'user', content: 'hi' }],
    supabase: fakeSupabase, anthropic: fakeAnthropic, model: 'glm-test',
  });
  assert.equal(out.reply, 'Done.');
  assert.equal(out.ui_hint.type, 'chips');
  assert.deepEqual(out.ui_hint.options, ['A','B']);
});

test('runChatAgent falls back to chips when ui_hint is absent', async () => {
  const fakeAnthropic = { messages: { async create() { return { stop_reason: 'end_turn', content: [{ type: 'text', text: '{"reply":"OK."}' }] }; } } };
  const fakeSupabase = { from: () => ({ select() { return this; }, eq() { return this; }, maybeSingle: async () => ({ data: { doc: ITIN, version: 1 }, error: null }) }) };
  const out = await runChatAgent({ token: 'tok', messages: [{ role: 'user', content: 'hi' }], supabase: fakeSupabase, anthropic: fakeAnthropic, model: 'glm-test' });
  assert.equal(out.ui_hint.type, 'chips');
  assert.ok(Array.isArray(out.ui_hint.options));
});
