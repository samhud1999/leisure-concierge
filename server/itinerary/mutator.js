import { validateFull, softRepair, BLOCK_KINDS, TIMES_OF_DAY, PREF_KEYS } from './schema.js';
import { regenerateHighlights } from './summarizer.js';

// --- Store abstraction ---
// Tests inject a `store` directly. Production handlers wrap a Supabase
// client with `loadStore(supabase, token)`.

export function loadStore(supabase, token) {
  return {
    async load() {
      const { data, error } = await supabase
        .from('itineraries').select('doc, version').eq('token', token).maybeSingle();
      if (error || !data?.doc) throw Object.assign(new Error('itinerary_not_found'), { httpStatus: 404 });
      return data.doc;
    },
    async save(doc) {
      await supabase.from('itineraries')
        .update({ doc, version: doc.version, updated_at: new Date().toISOString() })
        .eq('token', token);
    },
  };
}

// --- Helpers ---
function nextBlockId(doc) {
  let max = 100;
  for (const d of doc.days) for (const b of d.blocks) {
    const n = parseInt(String(b.id).replace(/^blk-/, ''), 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `blk-${max + 1}`;
}

function findBlock(doc, block_id) {
  for (const d of doc.days) {
    const i = d.blocks.findIndex(b => b.id === block_id);
    if (i >= 0) return { day: d, block: d.blocks[i], index: i };
  }
  return null;
}

function findDay(doc, day_id) { return doc.days.find(d => d.id === day_id) || null; }

async function commit(store, doc) {
  doc.version = (doc.version || 0) + 1;
  doc.updated_at = new Date().toISOString();
  doc.summary.highlights = regenerateHighlights(doc);
  const v = validateFull(doc);
  if (!v.ok) throw Object.assign(new Error('mutation_invalid'), { httpStatus: 422, errors: v.errors });
  await store.save(doc);
  return doc.version;
}

// --- Operations ---

export async function addActivity({ store, day_id, time_of_day, kind, title, description = null, venue = null, source_url = null }) {
  const doc = await store.load();
  const day = findDay(doc, day_id);
  if (!day) throw Object.assign(new Error('unknown day_id'), { httpStatus: 422 });
  if (!BLOCK_KINDS.has(kind)) throw Object.assign(new Error(`unknown kind "${kind}"`), { httpStatus: 422 });
  if (!TIMES_OF_DAY.has(time_of_day)) throw Object.assign(new Error(`unknown time_of_day`), { httpStatus: 422 });

  const block = softRepair(
    { days: [{ blocks: [{ id: nextBlockId(doc), kind, time_of_day, title, description, venue, source_url, pinned: false }] }] },
    { weather: { days: [] } }
  ).days[0].blocks[0];
  day.blocks.push(block);
  const version = await commit(store, doc);
  return { block_id: block.id, version };
}

export async function swapActivity({ store, block_id, replacement }) {
  const doc = await store.load();
  const ref = findBlock(doc, block_id);
  if (!ref) throw Object.assign(new Error(`unknown block_id "${block_id}"`), { httpStatus: 422 });
  if (ref.block.pinned) throw Object.assign(new Error('cannot swap pinned block'), { httpStatus: 422 });
  if (!BLOCK_KINDS.has(replacement.kind)) throw Object.assign(new Error(`unknown kind "${replacement.kind}"`), { httpStatus: 422 });

  const repaired = softRepair(
    { days: [{ blocks: [{ ...ref.block, ...replacement, id: block_id }] }] },
    { weather: { days: [] } }
  ).days[0].blocks[0];
  ref.day.blocks[ref.index] = repaired;
  const version = await commit(store, doc);
  return { block_id, version };
}

export async function removeActivity({ store, block_id }) {
  const doc = await store.load();
  const ref = findBlock(doc, block_id);
  if (!ref) throw Object.assign(new Error(`unknown block_id "${block_id}"`), { httpStatus: 422 });
  if (ref.block.pinned) throw Object.assign(new Error('cannot remove pinned block'), { httpStatus: 422 });
  ref.day.blocks.splice(ref.index, 1);
  const version = await commit(store, doc);
  return { version };
}

export async function reorderDay({ store, day_id, block_ids }) {
  const doc = await store.load();
  const day = findDay(doc, day_id);
  if (!day) throw Object.assign(new Error('unknown day_id'), { httpStatus: 422 });
  if (block_ids.length !== day.blocks.length) {
    throw Object.assign(new Error('block_ids count mismatch'), { httpStatus: 422 });
  }
  const map = new Map(day.blocks.map(b => [b.id, b]));
  const next = [];
  for (const id of block_ids) {
    if (!map.has(id)) throw Object.assign(new Error(`unknown block_id "${id}"`), { httpStatus: 422 });
    next.push(map.get(id));
  }
  day.blocks = next;
  const version = await commit(store, doc);
  return { version };
}

export async function setPreference({ store, key, value }) {
  if (!PREF_KEYS.has(key)) throw Object.assign(new Error(`unknown preference key "${key}"`), { httpStatus: 422 });
  const doc = await store.load();
  doc.preferences[key] = value;
  const version = await commit(store, doc);
  return { version };
}

export async function pinBlock({ store, block_id, pinned }) {
  const doc = await store.load();
  const ref = findBlock(doc, block_id);
  if (!ref) throw Object.assign(new Error(`unknown block_id "${block_id}"`), { httpStatus: 422 });
  ref.block.pinned = Boolean(pinned);
  const version = await commit(store, doc);
  return { version };
}

// `regenerateDay` is model-driven; implemented but not unit-tested here.
// See Phase 4 Task 15 for the chat agent that wires it up.
export async function regenerateDay({ store, llm, model, day_id, reason }) {
  const doc = await store.load();
  const day = findDay(doc, day_id);
  if (!day) throw Object.assign(new Error('unknown day_id'), { httpStatus: 422 });
  const prompt = buildRegenerateDayPrompt(doc, day_id, reason);
  const resp = await llm.chat.completions.create({
    model,
    max_completion_tokens: 2000,
    messages: [
      { role: 'system', content: prompt },
      { role: 'user',   content: 'Produce the JSON now.' },
    ],
    response_format: { type: 'json_object' },
  });
  const text = resp.choices?.[0]?.message?.content ?? '';
  const cleaned = String(text).replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  let parsed;
  try { parsed = JSON.parse(cleaned); }
  catch { throw Object.assign(new Error('regenerate_day_unparseable'), { httpStatus: 502 }); }
  if (!parsed.day || parsed.day.id !== day_id) throw Object.assign(new Error('regenerate_day_invalid'), { httpStatus: 502 });

  // softRepair the model-returned blocks before merging (fills missing icons, trims overlong strings, etc.)
  const repairedParsed = softRepair({ days: [parsed.day] }, { weather: { days: day.weather ? [day.weather] : [] } });
  parsed.day = repairedParsed.days[0];

  // Preserve pinned blocks at their original indices.
  const originalPinned = day.blocks
    .map((b, i) => b.pinned ? { index: i, block: b } : null)
    .filter(Boolean);
  const freshFromModel = (parsed.day.blocks || []).filter(b => !originalPinned.some(p => p.block.id === b.id));

  const merged = [];
  let freshIdx = 0;
  const targetLen = originalPinned.length + freshFromModel.length;
  for (let i = 0; i < targetLen; i++) {
    const pinHere = originalPinned.find(p => p.index === i);
    if (pinHere) {
      merged.push(pinHere.block);
    } else if (freshIdx < freshFromModel.length) {
      merged.push(freshFromModel[freshIdx++]);
    }
  }
  // Append any pinned blocks whose original index is out of range for the new length.
  for (const p of originalPinned) {
    if (p.index >= targetLen) {
      console.warn(`[regenerate_day] pinned block ${p.block.id} position ${p.index} out of range; appending to end`);
      merged.push(p.block);
    }
  }
  day.blocks = merged;
  day.weather = parsed.day.weather || day.weather;
  day.label = parsed.day.label || day.label;
  const version = await commit(store, doc);
  return { version, day_id };
}

function buildRegenerateDayPrompt(doc, day_id, reason) {
  return [
    "You are RACV's concierge regenerating ONE day of an existing itinerary.",
    '',
    'CURRENT ITINERARY (full JSON):',
    JSON.stringify(doc, null, 2),
    '',
    `DAY TO REGENERATE: ${day_id}`,
    `REASON: ${reason || '(no reason provided)'}`,
    '',
    'CONSTRAINTS:',
    `- Return ONLY a JSON object: { "day": { "id": "${day_id}", "date": "...", "label": "...", "weather": {...}, "blocks": [{...}] } }`,
    '- Preserve every block in the input day whose `pinned` field is true, unchanged, in its current position.',
    '- Honour the V1 hard and soft rules (activity counts by stay length, weather steering, etc.).',
    '- Reuse the IDs of pinned blocks. Mint new IDs (`blk-NNN`, incrementing past the current max) for new blocks.',
    '',
    'WRITING STYLE (apply to every title and description):',
    '- Plain confident concierge English. Treat the reader as a guest, not a query.',
    "- Never use AI-style filler phrases. Avoid: \"I'll help you\", \"Let me assist\", \"I can help with\", \"As an AI\".",
    '- Never use em dashes (the long dash character). Use a period, comma, or "and" instead. Hyphens in compound words are fine.',
    '- No emojis in text. Active voice. Short sentences.',
    '',
    'Return ONLY the JSON. No prose.',
  ].join('\n');
}
