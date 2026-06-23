# RACV Concierge V2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the chat-only V1 with an itinerary-first interactive HTML artifact: token deep link → auto-generated structured itinerary → chat panel that mutates it via tools and adaptive cards.

**Architecture:** Server stores one canonical itinerary JSON per booking in a new `itineraries` table. A one-shot GLM call generates V1 on first deep-link visit; subsequent chat turns call 7 mutation tools that update the persisted doc. Frontend is vanilla JS, split-screen layout, RACV brand applied verbatim from the design spec.

**Tech Stack:** Node 18+, Express (existing), Supabase (`@supabase/supabase-js`, existing), Z.ai GLM via Anthropic-compatible endpoint (`@anthropic-ai/sdk`, existing), `node:test`, `cheerio` (existing), vanilla HTML/CSS/JS.

**Spec:** `docs/superpowers/specs/2026-06-23-v2-itinerary-first-design.md` (commit `98917c5`).

## Global Constraints

Every task implicitly inherits these. Copy verbatim values, do not paraphrase.

- **Sensitive PII** (`surname`, `email`, `phone`, `member_id_number`, `other_guest_names`) NEVER appears in any API response, the itinerary doc, or client-side state. Members table queries continue to use the existing `MEMBER_SAFE` whitelist.
- **Supabase service role key** stays server-side. `.env` is git-ignored.
- **Z.ai model**: default `ZAI_MODEL=glm-4.7-flash`. The Anthropic SDK is still the client (`baseURL: https://api.z.ai/api/anthropic`).
- **Brand tokens** (verbatim from spec §6):
  - `--racv-blue: #0066CC`, `--racv-blue-2: #004E9E`
  - `--racv-yellow: #FFD600`, `--racv-yellow-2: #E6C100`
  - `--racv-ink: #0A2E5C`, `--racv-text: #1A2B4A`, `--racv-muted: #6B7589`
  - `--racv-line: #E0E5EF`, `--racv-bg: #F4F6FA`, `--racv-card: #FFFFFF`, `--racv-tint: #EAF1FB`
  - Buttons: `border-radius: 999px` (PILL, not square)
  - Cards: 12px radius; inputs: 8px; days: 16px
- **Token URL shape**: `/i/<12-char-base64url>`. Tokens have no expiry. Pre-issued for every seed booking.
- **Itinerary day/block ID format**: days = `day-N` (1-indexed); blocks = `blk-NNN` (monotonically increasing per booking).
- **Activity-count rules per stay length** (verbatim from spec §7):
  - `nights ≤ 3` → 2-4 blocks per day, NO rest/free days
  - `nights 4-6` → 2-3 blocks per day, one rest day if 6 nights
  - `nights ≥ 7` → 1-2 blocks per day, rest day every ~3 days
- **Disclaimer**: "Proof of concept — not affiliated with RACV." remains visible in every page footer.
- **Backward compatibility**: legacy `/api/chat`, `server/systemPrompt.js`, and `public/index.html` stay mounted through Phase 4; removed only in Phase 5.
- **`/api/chat` history contract** stays untouched until Phase 5 deletion.
- **No SSE / WebSockets**. Loading state is a client-side fake-progress animation; chat updates use polling.
- **No new top-level npm dependencies** unless flagged. The plan uses only Node built-ins + already-installed packages (`express`, `@supabase/supabase-js`, `@anthropic-ai/sdk`, `cors`, `dotenv`, `cheerio`).
- **Tests**: `node --test --test-reporter=spec` (already wired in `server/package.json`). Test files under `server/<module>/__tests__/`.
- **Commit cadence**: one commit per task at the task's last step. Use the message specified in each task's final step.
- **Working directory** for all `cd` examples in this plan: `/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app`.

## File Structure

What this plan creates or modifies. Paths relative to repo root.

```
db/v2_itineraries.sql                            NEW   (Phase 1)
DESIGN_NOTES.md                                  MODIFY (Phase 2, overwrite palette)
SETUP.md                                         MODIFY (Phase 2, append §5)
HANDOVER.md                                      MODIFY (Phase 5)
README.md                                        MODIFY (Phase 5)

server/
├─ index.js                                      MODIFY (Phase 1 wiring; Phase 5 cleanup)
├─ systemPrompt.js                               KEEP unchanged; DELETE in Phase 5
├─ routes/                                       NEW directory (Phase 1)
│  ├─ login.js                                   NEW   (Phase 3)
│  ├─ itineraryPage.js                           NEW   (Phase 3)
│  └─ itineraryApi.js                            NEW   (Phase 1; extended Phase 4)
├─ itinerary/                                    NEW directory
│  ├─ schema.js                                  NEW   (Phase 1)
│  ├─ summarizer.js                              NEW   (Phase 1)
│  ├─ generator.js                               NEW   (Phase 1)
│  ├─ mutator.js                                 NEW   (Phase 4)
│  └─ __tests__/
│     ├─ schema.test.js                          NEW   (Phase 1)
│     ├─ summarizer.test.js                      NEW   (Phase 1)
│     ├─ generator.test.js                       NEW   (Phase 1)
│     └─ mutator.test.js                         NEW   (Phase 4)
├─ agent/                                        NEW directory (Phase 4)
│  ├─ chatAgent.js                               NEW   (Phase 4)
│  ├─ chatTools.js                               NEW   (Phase 4)
│  ├─ systemPrompt.js                            NEW   (Phase 4)
│  └─ __tests__/
│     └─ chatAgent.test.js                       NEW   (Phase 4)
├─ liveEvents/                                   UNCHANGED
└─ scripts/
   └─ smoke-generate.mjs                         NEW   (Phase 1)

public/
├─ index.html                                    MODIFY (Phase 2 reskin); DELETE in Phase 5
├─ login.html                                    NEW   (Phase 3)
├─ itinerary.html                                NEW   (Phase 3)
├─ assets/                                       NEW directory (Phase 3)
│  ├─ styles.css                                 NEW   (Phase 3)
│  ├─ login.js                                   NEW   (Phase 3)
│  ├─ itinerary.js                               NEW   (Phase 3)
│  └─ chat.js                                    NEW   (Phase 4)
└─ img/
   ├─ racv-logo.svg                              OVERWRITE (Phase 2)
   ├─ journey-curve.svg                          NEW   (Phase 2)
   ├─ hero-resort.jpg                            EXISTING (kept)
   └─ resorts/                                   NEW directory (Phase 2)
      ├─ torquay.jpg                             NEW manual (Phase 2)
      ├─ cape-schanck.jpg                        NEW manual (Phase 2)
      ├─ healesville.jpg                         NEW manual (Phase 2)
      ├─ inverloch.jpg                           NEW manual (Phase 2)
      ├─ noosa.jpg                               NEW manual (Phase 2)
      ├─ royal-pines.jpg                         NEW manual (Phase 2)
      ├─ goldfields.jpg                          NEW manual (Phase 2)
      ├─ cobram.jpg                              NEW manual (Phase 2)
      ├─ hobart.jpg                              NEW manual (Phase 2)
      └─ city-club-melbourne.jpg                 NEW manual (Phase 2)
```

**Boundary rules:**

- Each file has one responsibility (schema validates; summarizer summarizes; generator generates; mutator mutates; chatAgent orchestrates; chatTools is pure tool defs).
- Frontend assets (CSS / JS) are extracted from inline-style-in-HTML into named files under `public/assets/` so individual modules stay focused and reviewable.
- Tests live next to their module under `__tests__/` (matches existing `server/liveEvents/__tests__/` layout).
- The `server/routes/` directory exists from Phase 1 (Task 5 creates `itineraryApi.js`); Phase 3 adds the rest.

---

## PHASE 1 — Foundations (no user-visible change)

Phase exit: backend can build, validate, persist, and serve itineraries via API; no UI yet. The CLI smoke script (Task 6) produces a real itinerary JSON for human inspection.

### Task 1: Database migration + pre-issue tokens

**Files:**
- Create: `db/v2_itineraries.sql`
- Modify: `SETUP.md` (append a "V2: itineraries table" line under §3 Load the data)

**Interfaces:**
- Consumes: existing `bookings(confirmation_code text unique, member_id bigint)` and `members(id)`.
- Produces: `itineraries(booking_id pk, token unique, member_id, doc jsonb, version int, status text, last_error text, created_at, updated_at)` with one pre-seeded row per existing booking.

**Manual prerequisite:** This task ends with a SQL file. A human (or this agent if `psql` were installed) must execute the file in the Supabase SQL Editor. The smoke test in Task 6 will fail until the migration has been applied.

- [ ] **Step 1: Create the migration file**

Create `db/v2_itineraries.sql`:

```sql
-- V2 itineraries: one row per booking, holds the canonical JSON document
-- the agent mutates and the frontend renders.

CREATE TABLE IF NOT EXISTS itineraries (
  booking_id   text PRIMARY KEY REFERENCES bookings(confirmation_code),
  token        text UNIQUE NOT NULL,
  member_id    bigint NOT NULL REFERENCES members(id),
  doc          jsonb NOT NULL DEFAULT '{}'::jsonb,
  version      int   NOT NULL DEFAULT 1,
  status       text  NOT NULL DEFAULT 'pending',   -- pending | ready | generation_failed
  last_error   text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS itineraries_token_idx ON itineraries(token);

-- Pre-issue tokens for every existing booking. Re-runnable: only inserts
-- rows that don't already exist.
INSERT INTO itineraries (booking_id, token, member_id, doc, status)
SELECT b.confirmation_code,
       encode(gen_random_bytes(9), 'base64'),     -- 12-char base64; we
                                                   -- normalise '+/=' →
                                                   -- '-_' in the server
                                                   -- before exposing.
       b.member_id,
       '{}'::jsonb,
       'pending'
FROM bookings b
LEFT JOIN itineraries i ON i.booking_id = b.confirmation_code
WHERE i.booking_id IS NULL;
```

> **Note on tokens:** Postgres' `gen_random_bytes` + `encode(..., 'base64')` produces standard base64 with `+`, `/`, `=`. URL-safe encoding is not built-in to plain Supabase Postgres. The server normalises on read (`token.replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'')`) and reverses the normalisation when matching `WHERE token = ?`. Spec §5 calls for URL-safe base64; this two-step keeps the migration portable without a Postgres extension.

- [ ] **Step 2: Append a SETUP.md line**

In `SETUP.md`, under the existing "Step 3 — Load the data" section, append after the existing seed_docs line:

```markdown
4. Click **+ New query** again, open `db/v2_itineraries.sql` (the V2 itineraries table + pre-issued tokens), copy all of it, paste, and **Run**.
5. To confirm V2, run: `select count(*) from itineraries;` — you should see 16 (matches the booking count).
```

- [ ] **Step 3: Verify locally (cannot execute SQL from here, but probe REST)**

After the human runs the migration in Supabase, this command verifies the table exists and is pre-seeded:

```bash
cd "/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app"
URL=$(grep '^SUPABASE_URL=' server/.env | cut -d= -f2-)
KEY=$(grep '^SUPABASE_SERVICE_ROLE_KEY=' server/.env | cut -d= -f2-)
curl -sS -H "apikey: $KEY" -H "Authorization: Bearer $KEY" \
  -H "Prefer: count=exact" -H "Range: 0-0" \
  "$URL/rest/v1/itineraries?select=booking_id,token,status"
```

Expected: `content-range: 0-0/16` header, body shows status=`pending` and a 12-char base64 token per row.

If this returns 404, the migration was not applied; pause the plan and ask the human to run it.

- [ ] **Step 4: Commit**

```bash
cd "/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app"
git add db/v2_itineraries.sql SETUP.md
git commit -m "feat(db): v2 itineraries table + token pre-issue migration"
```

---

### Task 2: `server/itinerary/schema.js` — validators + soft repairs

**Files:**
- Create: `server/itinerary/schema.js`
- Create: `server/itinerary/__tests__/schema.test.js`

**Interfaces:**
- Produces:
  - `validateGenerated(partial) → { ok: boolean, doc?: object, errors: string[] }` — validates the GLM-returned subset `{ preferences, summary, days }`.
  - `validateFull(doc) → { ok: boolean, doc?: object, errors: string[] }` — validates the assembled whole document (wrapper + generated subset).
  - `softRepair(partial, input) → partial` — applies non-failing fixes (default `icon` from `kind`, copy `weather` from input, default `kind: "activity"`, truncate `description` at 140, etc.). Used by `generator.js` before calling `validateGenerated`.
  - Constants `BLOCK_KINDS = ['arrival','dining','activity','spa','event','departure','free']`, `TIMES_OF_DAY = ['morning','midday','afternoon','evening']`, `PREF_KEYS = ['party_kind','dietary','pace','interests']`.

- [ ] **Step 1: Write the failing tests**

Create `server/itinerary/__tests__/schema.test.js`:

```js
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
  const full = { ...WRAPPER, ...VALID_GENERATED };  // 3 nights → expects 4 days, only has 1
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
```

- [ ] **Step 2: Run the failing test**

```bash
cd "/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app/server"
npm test 2>&1 | tail -15
```

Expected: every new `schema.test.js` test fails with `ERR_MODULE_NOT_FOUND` (the module doesn't exist yet). Liveevents 20/20 still pass.

- [ ] **Step 3: Implement `server/itinerary/schema.js`**

Create `server/itinerary/schema.js`:

```js
export const BLOCK_KINDS = new Set([
  'arrival', 'dining', 'activity', 'spa', 'event', 'departure', 'free',
]);
export const TIMES_OF_DAY = new Set(['morning','midday','afternoon','evening']);
export const PREF_KEYS = new Set(['party_kind','dietary','pace','interests']);

const ICON_FOR_KIND = {
  arrival: '🛬', dining: '🍽', activity: '🥾', spa: '💆',
  event: '🎫', departure: '🛫', free: '●',
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isString(v) { return typeof v === 'string'; }
function isObj(v)    { return v && typeof v === 'object' && !Array.isArray(v); }
function isArr(v)    { return Array.isArray(v); }

function pushErr(errs, path, msg) { errs.push(`${path}: ${msg}`); }

// --- validateGenerated -----------------------------------------------------

export function validateGenerated(partial) {
  const errors = [];
  if (!isObj(partial)) {
    return { ok: false, errors: ['root: not an object'] };
  }
  if (!isObj(partial.preferences)) pushErr(errors, 'preferences', 'missing or not object');
  if (!isObj(partial.summary) || !isArr(partial.summary?.highlights)) {
    pushErr(errors, 'summary.highlights', 'missing or not an array');
  }
  if (!isArr(partial.days)) {
    pushErr(errors, 'days', 'missing or not an array');
    return { ok: false, errors };
  }

  const seenIds = new Set();
  partial.days.forEach((d, i) => {
    const dp = `days[${i}]`;
    if (!isString(d?.id))    pushErr(errors, `${dp}.id`, 'missing');
    if (!isString(d?.date) || !ISO_DATE.test(d.date)) pushErr(errors, `${dp}.date`, 'not YYYY-MM-DD');
    if (!isString(d?.label)) pushErr(errors, `${dp}.label`, 'missing');
    if (!isObj(d?.weather))  pushErr(errors, `${dp}.weather`, 'missing or not object');
    if (!isArr(d?.blocks)) {
      pushErr(errors, `${dp}.blocks`, 'missing or not array');
      return;
    }
    d.blocks.forEach((b, j) => {
      const bp = `${dp}.blocks[${j}]`;
      if (!isString(b?.id))     pushErr(errors, `${bp}.id`, 'missing');
      else if (seenIds.has(b.id)) pushErr(errors, `${bp}.id`, `duplicate "${b.id}"`);
      else seenIds.add(b.id);
      if (!BLOCK_KINDS.has(b?.kind)) pushErr(errors, `${bp}.kind`, `unknown kind "${b?.kind}"`);
      if (!TIMES_OF_DAY.has(b?.time_of_day)) pushErr(errors, `${bp}.time_of_day`, `unknown "${b?.time_of_day}"`);
      if (!isString(b?.title) || b.title.length > 40) pushErr(errors, `${bp}.title`, 'missing or > 40 chars');
      if (b?.description != null && (!isString(b.description) || b.description.length > 140)) {
        pushErr(errors, `${bp}.description`, 'not a string or > 140 chars');
      }
    });
  });

  return errors.length ? { ok: false, errors } : { ok: true, doc: partial, errors: [] };
}

// --- validateFull ----------------------------------------------------------

export function validateFull(doc) {
  const partialResult = validateGenerated(doc);
  const errors = [...partialResult.errors];

  if (!isObj(doc?.stay)) {
    pushErr(errors, 'stay', 'missing');
  } else {
    const expected = (doc.stay.nights ?? 0) + 1;
    if (!isArr(doc.days) || doc.days.length !== expected) {
      pushErr(errors, 'days', `day count ${doc.days?.length ?? 0} != nights+1 (${expected})`);
    } else {
      if (doc.days[0]?.date !== doc.stay.check_in) {
        pushErr(errors, 'days[0].date', `must equal stay.check_in ${doc.stay.check_in}`);
      }
      const last = doc.days[doc.days.length - 1];
      if (last?.date !== doc.stay.check_out) {
        pushErr(errors, `days[${doc.days.length - 1}].date`, `must equal stay.check_out ${doc.stay.check_out}`);
      }
    }
  }
  for (const required of ['version','booking_id','token','member','resort']) {
    if (doc?.[required] == null) pushErr(errors, required, 'missing');
  }
  return errors.length ? { ok: false, errors } : { ok: true, doc, errors: [] };
}

// --- softRepair ------------------------------------------------------------

export function softRepair(partial, input) {
  if (!isObj(partial)) return partial;
  const out = structuredClone(partial);
  if (isArr(out.days)) {
    for (const day of out.days) {
      if (!isObj(day.weather) && isObj(input?.weather) && isArr(input.weather.days)) {
        const w = input.weather.days.find(x => x.date === day.date);
        if (w) day.weather = w;
      }
      if (isArr(day.blocks)) {
        for (const b of day.blocks) {
          if (!BLOCK_KINDS.has(b.kind)) b.kind = 'activity';
          if (!b.icon) b.icon = ICON_FOR_KIND[b.kind] || '●';
          if (typeof b.description === 'string' && b.description.length > 140) {
            b.description = b.description.slice(0, 139) + '…';
          }
          if (typeof b.title === 'string' && b.title.length > 40) {
            b.title = b.title.slice(0, 39) + '…';
          }
          if (b.pinned == null) b.pinned = false;
        }
      }
    }
  }
  return out;
}
```

- [ ] **Step 4: Run the tests and verify they pass**

```bash
cd "/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app/server"
npm test 2>&1 | tail -15
```

Expected: `pass 31` (20 existing + 11 new). No failures.

- [ ] **Step 5: Commit**

```bash
cd "/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app"
git add server/itinerary/schema.js server/itinerary/__tests__/schema.test.js
git commit -m "feat(itinerary): JSON schema validators + soft repairs"
```

---

### Task 3: `server/itinerary/summarizer.js` — regenerate `summary.highlights`

**Files:**
- Create: `server/itinerary/summarizer.js`
- Create: `server/itinerary/__tests__/summarizer.test.js`

**Interfaces:**
- Consumes: an in-memory itinerary doc (any subset that has `days[]`).
- Produces: `regenerateHighlights(doc) → string[]` — returns ≤ 4 bullet strings derived from the days. Pure function, no I/O.

- [ ] **Step 1: Write the failing test**

Create `server/itinerary/__tests__/summarizer.test.js`:

```js
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
```

- [ ] **Step 2: Run it and verify failure**

```bash
cd "/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app/server"
npm test 2>&1 | tail -10
```

Expected: 5 new failures with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement `server/itinerary/summarizer.js`**

```js
export function regenerateHighlights(doc) {
  const out = [];
  const days = Array.isArray(doc?.days) ? doc.days : [];
  if (days.length === 0) return out;

  // Count by kind across all blocks.
  const byKind = {};
  for (const d of days) for (const b of (d.blocks || [])) {
    byKind[b.kind] = (byKind[b.kind] || 0) + 1;
  }

  if (byKind.spa >= 1) {
    out.push(byKind.spa === 1 ? '1 spa treatment' : `${byKind.spa} spa treatments`);
  }

  // Surface markets / events with their day label
  const events = [];
  for (const d of days) for (const b of (d.blocks || [])) {
    if (b.kind === 'event') events.push({ title: b.title, label: d.label || d.date });
  }
  if (events.length === 1) out.push(`${events[0].title} · ${events[0].label}`);
  else if (events.length > 1) out.push(`${events.length} local events`);

  if (byKind.dining >= 2) out.push(`${byKind.dining} dining experiences`);

  // Weather summary
  const wetDays = days.filter(d => (d.weather?.precip_pct ?? 0) > 60).length;
  if (days.length > 0) {
    if (wetDays === 0)      out.push('Mostly fair weather');
    else if (wetDays === 1) out.push('Mostly fair, 1 wet day');
    else if (wetDays >= days.length / 2) out.push('Variable weather — indoor options included');
    else                    out.push(`Fair weather, ${wetDays} wet days`);
  }

  return out.slice(0, 4);
}
```

- [ ] **Step 4: Run the tests, verify all pass**

```bash
cd "/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app/server"
npm test 2>&1 | tail -10
```

Expected: `pass 36` (20 + 11 + 5). No failures.

- [ ] **Step 5: Commit**

```bash
cd "/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app"
git add server/itinerary/summarizer.js server/itinerary/__tests__/summarizer.test.js
git commit -m "feat(itinerary): regenerateHighlights pure summarizer"
```

---

### Task 4: `server/itinerary/generator.js` — V1 build (one GLM call)

**Files:**
- Create: `server/itinerary/generator.js`
- Create: `server/itinerary/__tests__/generator.test.js`

**Interfaces:**
- Consumes:
  - `validateGenerated`, `softRepair` from `./schema.js`
  - `regenerateHighlights` from `./summarizer.js`
  - An Anthropic client (injectable for tests; defaults to the same `apiKey: ZAI_API_KEY, baseURL: ZAI_BASE_URL` client used elsewhere)
  - Supabase client (injectable for tests; defaults to the existing module-level one)
- Produces:
  - `mapWeather(openMeteoDays) → { date, condition, temp_max_c, temp_min_c, precip_pct, precip_mm }[]` — exported for testing the field-rename without GLM round-trips.
  - `buildGeneratorPrompt(input) → string` — exported for snapshot tests.
  - `assembleDoc({ generated, wrapperInputs }) → fullDoc` — merges the GLM-returned subset with server-side wrapper fields.
  - `generateItinerary({ token, supabase, anthropic, model })` — the orchestration entry; loads booking + resort + events + weather, calls GLM, validates, persists, returns the full doc. Used by the `/generate` route.

> **Why `mapWeather` is exported:** the field-rename (`precip_pct ← precipitation_chance_pct`) is the single most likely silent bug. Testing it in isolation guards against regressions.

- [ ] **Step 1: Write the failing test**

Create `server/itinerary/__tests__/generator.test.js`:

```js
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
```

- [ ] **Step 2: Run and verify failure**

```bash
cd "/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app/server"
npm test 2>&1 | tail -10
```

Expected: 4 new failures, all `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement `server/itinerary/generator.js`**

```js
import Anthropic from '@anthropic-ai/sdk';
import { validateGenerated, softRepair } from './schema.js';
import { regenerateHighlights } from './summarizer.js';

// --- Weather field rename --------------------------------------------------
// Open-Meteo (server/index.js fetchWeather) returns:
//   { available, days: [{ date, condition, temp_max_c, temp_min_c,
//                         precipitation_mm, precipitation_chance_pct }] }
// We rename to itinerary names (precip_pct, precip_mm).
export function mapWeather(openMeteo) {
  if (!openMeteo?.available || !Array.isArray(openMeteo.days)) return [];
  return openMeteo.days.map(d => ({
    date: d.date,
    condition: d.condition,
    temp_max_c: d.temp_max_c,
    temp_min_c: d.temp_min_c,
    precip_pct: d.precipitation_chance_pct ?? 0,
    precip_mm: d.precipitation_mm ?? 0,
  }));
}

// --- System prompt builder -------------------------------------------------
export function buildGeneratorPrompt({ member, booking, resort, events, weather }) {
  return [
    "You are RACV's concierge generating a member's day-by-day stay itinerary.",
    '',
    'OUTPUT only ONE JSON object matching the SCHEMA below — nothing else. No prose, no markdown, no fenced code blocks.',
    '',
    'SCHEMA — return exactly these top-level fields:',
    '{ "preferences": { party_kind, dietary, pace, interests },',
    '  "summary":     { highlights: [string, …] },',
    '  "days":        [ { id, date, label, weather, blocks: [...] } ] }',
    '',
    'BLOCK SHAPE:',
    '{ id, kind, time_of_day, icon, title, description, venue, source_url, pinned }',
    '  kind ∈ arrival|dining|activity|spa|event|departure|free',
    '  time_of_day ∈ morning|midday|afternoon|evening',
    '',
    'HARD RULES:',
    `- One day per night + one for the departure day. Nights=${booking.nights}, days=${booking.nights + 1}.`,
    `- First day's first block: kind="arrival". Last day's last block: kind="departure".`,
    '- Blocks per day:',
    '    nights <= 3  →  2-4 blocks, NO rest/free days',
    '    nights 4-6   →  2-3 blocks, one rest day if 6 nights',
    '    nights >= 7  →  1-2 blocks, rest day every ~3 days',
    '- If weather precip_pct > 60 OR precip_mm > 5: NO outdoor blocks that day. Pick indoor (spa, dining, indoor amenity) or sheltered events.',
    '- If booking.add_ons mentions a spa package, schedule 1-2 spa blocks on fair-weather days.',
    '- If events[] overlaps the stay window, surface the most relevant 1-2 as blocks with kind="event" — prefer Saturday markets, music, family.',
    '- Stable IDs: days "day-1"…"day-N", blocks "blk-101"…"blk-NNN".',
    '- Default preferences (V1 has none yet): party_kind from party_size (1=solo, 2=couple, 3-4=family if any child indication, else friends), dietary=null, pace="balanced", interests=[].',
    '',
    'SOFT RULES:',
    "- Match the resort's vibe — coastal walks at coastal resorts, golf at golf resorts.",
    '- Personalise to the resort\'s own dining + experiences first.',
    '- Each block.description: ≤140 chars. Each title: ≤40 chars.',
    '- TONE: warm, restrained, five-star concierge. No emojis in text; the icon field carries the visual marker.',
    '',
    'BRIEF:',
    JSON.stringify({ member, booking, resort, events, weather }, null, 2),
    '',
    'Return ONLY the JSON. Start with {.',
  ].join('\n');
}

// --- Assemble wrapper + generated -----------------------------------------
export function assembleDoc({ generated, wrapper }) {
  return {
    version: 1,
    updated_at: new Date().toISOString(),
    booking_id: wrapper.booking_id,
    token: wrapper.token,
    member: wrapper.member,
    stay: wrapper.stay,
    resort: wrapper.resort,
    preferences: generated.preferences,
    summary: generated.summary,
    days: generated.days,
  };
}

// --- Orchestration --------------------------------------------------------
// (Tested via the route integration test in Task 5, not here — a unit test
// would require a Supabase mock heavier than the value it adds.)
export async function generateItinerary({ token, supabase, anthropic, model, signal }) {
  // 1. Load itinerary row + booking + member + resort + events + weather.
  const { data: row, error } = await supabase
    .from('itineraries')
    .select('booking_id, member_id, status, doc, version')
    .eq('token', token)
    .maybeSingle();
  if (error || !row) throw Object.assign(new Error('itinerary_not_found'), { httpStatus: 404 });
  if (row.status === 'ready' && row.doc && Object.keys(row.doc).length) {
    return row.doc;                                  // idempotent: serve cached
  }

  const { data: booking } = await supabase
    .from('bookings')
    .select('confirmation_code, check_in, check_out, room_type, party_size, add_ons, party_composition, resort:resorts(slug,name,town,state,region,latitude,longitude,description)')
    .eq('confirmation_code', row.booking_id)
    .single();
  const { data: member } = await supabase
    .from('members')
    .select('id, first_name, member_number')
    .eq('id', row.member_id)
    .single();
  const resortId = (await supabase.from('resorts').select('id').eq('slug', booking.resort.slug).single()).data.id;
  const [amenities, dining, experiences, roomTypes, docs, events] = await Promise.all([
    supabase.from('amenities').select('name,category,environment,description').eq('resort_id', resortId),
    supabase.from('dining').select('name,cuisine,environment,dietary_notes,hours,description').eq('resort_id', resortId),
    supabase.from('experiences').select('name,category,environment,time_of_day,description').eq('resort_id', resortId),
    supabase.from('room_types').select('name,description,sleeps,features').eq('resort_id', resortId),
    supabase.from('internal_docs').select('title,content').eq('resort_id', resortId),
    supabase.from('events').select('name,start_date,end_date,event_time,location,category,environment,source_url,description')
      .eq('resort_id', resortId).gte('start_date', booking.check_in).lte('start_date', booking.check_out),
  ]);

  const nights = Math.round((new Date(booking.check_out) - new Date(booking.check_in)) / 86400000);

  // Weather: re-use existing server/index.js fetcher via direct fetch — keep
  // generator self-contained.
  const w = await fetchWeather(booking.resort.latitude, booking.resort.longitude, booking.check_in, booking.check_out);
  const weather = mapWeather(w);

  const brief = {
    member: { first_name: member.first_name },
    booking: { check_in: booking.check_in, check_out: booking.check_out, nights, room_type: booking.room_type, party_size: booking.party_size, add_ons: booking.add_ons || [] },
    resort: {
      name: booking.resort.name, town: booking.resort.town, region: booking.resort.region,
      amenities: amenities.data || [], dining: dining.data || [],
      experiences: experiences.data || [], room_types: roomTypes.data || [],
      local_guides: docs.data || [],
    },
    events: events.data || [],
    weather,
  };

  // 2. Call GLM once.
  const prompt = buildGeneratorPrompt(brief);
  const generated = await callGenerator({ anthropic, model, prompt, signal });

  // 3. Soft-repair + validate.
  const repaired = softRepair(generated, { weather: { days: weather } });
  const v = validateGenerated(repaired);
  if (!v.ok) throw Object.assign(new Error('generator_invalid'), { errors: v.errors, httpStatus: 502 });

  // 4. Assemble wrapper + persist.
  const wrapper = {
    booking_id: row.booking_id,
    token,
    member: { first_name: member.first_name, member_number: member.member_number },
    stay: { check_in: booking.check_in, check_out: booking.check_out, nights, room_type: booking.room_type, party_size: booking.party_size, add_ons: booking.add_ons || [] },
    resort: { slug: booking.resort.slug, name: booking.resort.name, town: booking.resort.town, region: booking.resort.region,
              hero_image: `/img/resorts/${booking.resort.slug}.jpg`,
              summary: booking.resort.description || '' },
  };
  const full = assembleDoc({ generated: v.doc, wrapper });
  full.summary.highlights = regenerateHighlights(full);

  await supabase.from('itineraries')
    .update({ doc: full, version: 1, status: 'ready', last_error: null, updated_at: new Date().toISOString() })
    .eq('token', token);

  return full;
}

// --- Internal: GLM call with one-retry parse + validate retry --------------
async function callGenerator({ anthropic, model, prompt, signal, attempt = 0 }) {
  const resp = await anthropic.messages.create({
    model, max_tokens: 6000, system: prompt, messages: [{ role: 'user', content: 'Produce the JSON now.' }],
  }, { signal });
  const text = resp.content.filter(b => b.type === 'text').map(b => b.text).join('');
  const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    if (attempt < 1) {
      const retryPrompt = prompt +
        "\n\nYour last response was not valid JSON. Return ONLY the JSON object starting with `{`. No prose, no code fences.";
      return callGenerator({ anthropic, model, prompt: retryPrompt, signal, attempt: attempt + 1 });
    }
    throw Object.assign(new Error('generator_unparseable'), { httpStatus: 502, raw: text });
  }
}

// --- Internal: weather fetch (duplicated from server/index.js intentionally
// to keep the generator self-contained for unit testing) -------------------
async function fetchWeather(lat, lon, start, end) {
  if (lat == null || lon == null) return { available: false };
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max` +
    `&timezone=auto&start_date=${start}&end_date=${end}`;
  const res = await fetch(url);
  if (!res.ok) return { available: false };
  const data = await res.json();
  const d = data.daily;
  if (!d || !d.time) return { available: false };
  const WMO = { 0:'Clear',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Fog',48:'Fog',51:'Light drizzle',53:'Drizzle',55:'Heavy drizzle',61:'Light rain',63:'Rain',65:'Heavy rain',71:'Light snow',73:'Snow',75:'Heavy snow',80:'Showers',81:'Showers',82:'Heavy showers',95:'Thunderstorm' };
  return {
    available: true,
    days: d.time.map((date, i) => ({
      date, condition: WMO[d.weather_code[i]] ?? 'Unknown',
      temp_max_c: d.temperature_2m_max[i], temp_min_c: d.temperature_2m_min[i],
      precipitation_mm: d.precipitation_sum[i], precipitation_chance_pct: d.precipitation_probability_max[i],
    })),
  };
}
```

- [ ] **Step 4: Run the tests and verify they pass**

```bash
cd "/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app/server"
npm test 2>&1 | tail -10
```

Expected: `pass 40` (36 + 4 new generator unit tests). No failures.

- [ ] **Step 5: Commit**

```bash
cd "/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app"
git add server/itinerary/generator.js server/itinerary/__tests__/generator.test.js
git commit -m "feat(itinerary): V1 generator (single GLM call + weather mapping)"
```

---

### Task 5: `POST /api/itinerary/:token/generate` route

**Files:**
- Create: `server/routes/itineraryApi.js`
- Modify: `server/index.js` (mount the new router; preserve all existing routes)

**Interfaces:**
- Consumes: `generateItinerary` from `../itinerary/generator.js`.
- Produces:
  - Route handler `POST /api/itinerary/:token/generate` → `{ itinerary }` (200) | error JSON (404/502).
  - Exports `mountItineraryApi(app, { supabase, anthropic, model })` that wires the routes onto an existing Express app.

> **Test approach:** the existing project has no `supertest`. We test the handler logic by spinning up a separate Express instance in the test with a mock `generateItinerary` injected through the mounter. That keeps the test free of network / Supabase calls.

- [ ] **Step 1: Write the failing test**

Create `server/itinerary/__tests__/itineraryApi.test.js`:

```js
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
```

- [ ] **Step 2: Run, verify failure**

```bash
cd "/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app/server"
npm test 2>&1 | tail -10
```

Expected: 3 new `ERR_MODULE_NOT_FOUND` failures.

- [ ] **Step 3: Implement `server/routes/itineraryApi.js`**

```js
import { generateItinerary as defaultGenerate } from '../itinerary/generator.js';

export function mountItineraryApi(app, opts) {
  const { supabase, anthropic, model } = opts;
  const generateItinerary = opts.generateItinerary || defaultGenerate;

  app.post('/api/itinerary/:token/generate', async (req, res) => {
    const { token } = req.params;
    try {
      const itinerary = await generateItinerary({ token, supabase, anthropic, model });
      res.json({ itinerary });
    } catch (e) {
      const status = e.httpStatus || 500;
      res.status(status).json({ error: e.message, errors: e.errors });
    }
  });
}
```

- [ ] **Step 4: Mount it from `server/index.js`**

In `server/index.js`, add this import after the other imports near the top:

```js
import { mountItineraryApi } from './routes/itineraryApi.js';
```

And after `app.use(express.static(...))` (existing static middleware), add:

```js
mountItineraryApi(app, { supabase, anthropic, model: ZAI_MODEL });
```

Do not remove any existing routes. The legacy `/api/chat` continues to live alongside the new route.

- [ ] **Step 5: Run tests + smoke**

```bash
cd "/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app/server"
npm test 2>&1 | tail -10
node --check index.js && echo "syntax OK"
```

Expected: `pass 43` (40 + 3). `syntax OK`.

- [ ] **Step 6: Commit**

```bash
cd "/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app"
git add server/routes/itineraryApi.js server/itinerary/__tests__/itineraryApi.test.js server/index.js
git commit -m "feat(itinerary): POST /api/itinerary/:token/generate route"
```

---

### Task 6: CLI smoke test — generate one itinerary end-to-end

**Files:**
- Create: `server/scripts/smoke-generate.mjs`
- Create: `server/scripts/snapshots/` (directory; the script writes into it)
- Modify: `server/package.json` (add `"smoke:generate": "node scripts/smoke-generate.mjs"` to `scripts`)

**Interfaces:**
- Consumes: the migration from Task 1 must be applied and the server must have a valid `.env`.
- Produces: a JSON snapshot file at `server/scripts/snapshots/100201-RACV-TQ-3001.json` that a human can eyeball to confirm the V1 build is sensible.

> **Manual step:** this task ends with the human running `npm run smoke:generate` and reading the resulting JSON. The test boundary is "does the generator produce a plausible itinerary for Eleanor's 3-night stay?" That's a judgement call, not an assertion.

- [ ] **Step 1: Create the script**

`server/scripts/smoke-generate.mjs`:

```js
#!/usr/bin/env node
import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateItinerary } from '../itinerary/generator.js';

const {
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
  ZAI_API_KEY, ZAI_MODEL = 'glm-4.7-flash',
  ZAI_BASE_URL = 'https://api.z.ai/api/anthropic',
} = process.env;

for (const [k, v] of Object.entries({ SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ZAI_API_KEY })) {
  if (!v) { console.error(`Missing env: ${k}`); process.exit(1); }
}

const supabase  = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const anthropic = new Anthropic({ apiKey: ZAI_API_KEY, baseURL: ZAI_BASE_URL });

// Resolve the token for Eleanor's RACV-TQ-3001 booking.
const { data: row } = await supabase
  .from('itineraries').select('token, booking_id, member_id')
  .eq('booking_id', 'RACV-TQ-3001').single();

if (!row) { console.error("No itinerary row for RACV-TQ-3001 — did you run db/v2_itineraries.sql?"); process.exit(2); }

console.log(`Generating for booking ${row.booking_id} (token ${row.token})…`);
const t0 = Date.now();
const itinerary = await generateItinerary({ token: row.token, supabase, anthropic, model: ZAI_MODEL });
const dt = ((Date.now() - t0) / 1000).toFixed(1);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(__dirname, 'snapshots', `100201-${row.booking_id}.json`);
await mkdir(path.dirname(out), { recursive: true });
await writeFile(out, JSON.stringify(itinerary, null, 2));

console.log(`\nDone in ${dt}s. Wrote ${out}`);
console.log(`\nSummary highlights:`);
for (const h of itinerary.summary.highlights || []) console.log(`  • ${h}`);
console.log(`\nDays: ${itinerary.days.length}`);
for (const d of itinerary.days) {
  console.log(`  ${d.label}  ·  ${d.weather?.condition ?? '?'}  ·  ${d.blocks.length} blocks`);
}
```

- [ ] **Step 2: Wire the npm script**

Edit `server/package.json` — find the `"scripts"` object and add the `smoke:generate` entry alongside `start`, `dev`, `test`:

```json
"scripts": {
  "start": "node index.js",
  "dev": "node --watch index.js",
  "test": "node --test --test-reporter=spec liveEvents/__tests__/*.test.js itinerary/__tests__/*.test.js",
  "smoke:generate": "node scripts/smoke-generate.mjs"
}
```

> Note: the `test` script grew to also pick up the new `itinerary/__tests__/*.test.js` glob. Without this, the new Phase 1 tests would not run via `npm test`.

- [ ] **Step 3: Make the script executable**

```bash
cd "/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app"
chmod +x server/scripts/smoke-generate.mjs
```

- [ ] **Step 4: Run the smoke**

```bash
cd "/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app/server"
npm run smoke:generate
```

Expected: ~30–90 seconds. Final output looks like:

```
Generating for booking RACV-TQ-3001 (token …)…

Done in 47.2s. Wrote .../snapshots/100201-RACV-TQ-3001.json

Summary highlights:
  • 2 spa treatments
  • Torquay Farmers Market · Sat 28 Jun
  • Mostly fair weather

Days: 4
  Thu 25 Jun  ·  Partly cloudy  ·  2 blocks
  Fri 26 Jun  ·  Clear  ·  3 blocks
  Sat 27 Jun  ·  Clear  ·  3 blocks
  Sun 28 Jun  ·  Showers  ·  1 blocks
```

If it errors, read the message: `itinerary_not_found` → migration not applied; `generator_unparseable` → the GLM returned something that wasn't JSON twice in a row, try again or swap `ZAI_MODEL=glm-4.7` in `.env`; anything 5xx → check the server log for Supabase errors.

- [ ] **Step 5: Human inspection of the snapshot**

Open `server/scripts/snapshots/100201-RACV-TQ-3001.json` and confirm:
- 4 days (3 nights + departure).
- `days[0].date` = `2026-06-25`, `days[3].date` = `2026-06-28`.
- First block has `kind: "arrival"`, last has `kind: "departure"`.
- Each block has all required fields (`id`, `kind`, `time_of_day`, `icon`, `title`, `description`, `pinned`).
- No sensitive fields anywhere (`surname`, `email`, `phone`, `member_id_number`, `other_guest_names`). Grep is the fastest check:

```bash
grep -E 'surname|email|phone|member_id_number|other_guest_names' \
  server/scripts/snapshots/100201-RACV-TQ-3001.json && echo "LEAK" || echo "clean"
```

Expected: `clean`.

- [ ] **Step 6: Commit**

```bash
cd "/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app"
git add server/scripts/smoke-generate.mjs server/scripts/snapshots/100201-RACV-TQ-3001.json server/package.json
git commit -m "feat(itinerary): CLI smoke + first generated snapshot"
```

> **Phase 1 exit:** the backend can build, validate, persist, and serve itineraries via API. One real snapshot exists, hand-inspected and committed. No UI yet — Phase 2 starts.

---

## PHASE 2 — Brand spec refresh + assets

Phase exit: real RACV palette is in `DESIGN_NOTES.md`, the legacy `public/index.html` is reskinned to it (confidence check), logo + journey curve are present, and 10 resort hero images are in `public/img/resorts/`.

### Task 7: Brand tokens + logo SVG + journey-curve SVG

**Files:**
- Overwrite: `public/img/racv-logo.svg`
- Create: `public/img/journey-curve.svg`
- Modify: `DESIGN_NOTES.md` (overwrite Palette + Components sections)

**Interfaces:**
- Consumes: nothing.
- Produces: brand asset files + updated palette doc that Phase 2 Task 9 (chat reskin) and all Phase 3 frontend tasks reference.

- [ ] **Step 1: Overwrite `public/img/racv-logo.svg`** with the real italic RACV wordmark + yellow journey stripes:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 100" role="img" aria-label="RACV">
  <style>
    .racv-letters { font: italic 900 80px Poppins, Helvetica, Arial, sans-serif;
                    fill: #0066CC; letter-spacing: -2px; }
  </style>
  <text x="0" y="68" class="racv-letters">RACV</text>
  <!-- yellow journey stripes -->
  <path d="M 0 88 Q 30 78, 60 86 T 120 88 T 180 86 T 240 88"
        stroke="#FFD600" stroke-width="6" stroke-linecap="round" fill="none"
        stroke-dasharray="38 8" />
</svg>
```

> The dashed `stroke-dasharray="38 8"` reproduces the four segmented strokes of the real RACV journey-stripe motif using a single path. If the live result looks wrong, swap for four individual `<path>` segments — but the dasharray approach is the smaller artifact.

- [ ] **Step 2: Create `public/img/journey-curve.svg`** (the standalone curving line graphic):

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 60" preserveAspectRatio="none" role="presentation" aria-hidden="true">
  <path d="M 0 30 Q 200 0, 500 25 T 1200 30"
        stroke="#FFD600" stroke-width="4" fill="none" stroke-linecap="round" />
</svg>
```

- [ ] **Step 3: Overwrite the Palette + Components sections of `DESIGN_NOTES.md`**

Read the existing `DESIGN_NOTES.md`. Find the `## Palette` section heading. Replace EVERYTHING from `## Palette` to (but not including) the next top-level section that is not `## Typography`, `## Logo`, `## Components`, or `## Imagery`.

After your edit, the file from `## Palette` through `## Components` should read:

```markdown
## Palette

V2 spec palette (commit 98917c5). Supersedes the earlier muted CSS-bundle
extraction, which lacked the saturated brand-yellow CTAs and the journey-
curve graphic.

| Token             | Hex       | Used for                                  |
|-------------------|-----------|-------------------------------------------|
| `--racv-blue`     | `#0066CC` | Primary brand: logo, headings, links      |
| `--racv-blue-2`   | `#004E9E` | Hover/active                              |
| `--racv-yellow`   | `#FFD600` | CTA fill, journey-line, focus ring        |
| `--racv-yellow-2` | `#E6C100` | Hover for yellow CTAs                     |
| `--racv-ink`      | `#0A2E5C` | Body headings (deep navy)                 |
| `--racv-text`     | `#1A2B4A` | Body copy                                 |
| `--racv-muted`    | `#6B7589` | Meta, captions, weather sub-label         |
| `--racv-line`     | `#E0E5EF` | Dividers, card borders                    |
| `--racv-bg`       | `#F4F6FA` | Page background                           |
| `--racv-card`     | `#FFFFFF` | Card surface                              |
| `--racv-tint`     | `#EAF1FB` | Selected/hover tile tint                  |

## Typography

- Brand font: Poppins (already loaded from Google Fonts). Weights 400 / 500 / 600 / 700.
- Stack: `'Poppins', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`

| Role     | Size    | Weight |
|----------|---------|--------|
| H1 hero  | 50px    | 700    |
| H2       | 30px    | 600    |
| H3       | 20px    | 600    |
| Body     | 15px    | 400    |
| Small    | 12.5px  | 400    |
| Button   | 14px    | 600    |

## Logo

- Format: SVG at `public/img/racv-logo.svg`.
- Italic RACV wordmark in `--racv-blue`, three yellow journey stripes underneath in `--racv-yellow`.
- Display height in header: 32px.

## Components

| Element            | Property        | Value                          |
|--------------------|-----------------|--------------------------------|
| Button             | border-radius   | `999px` (PILL)                 |
| Button             | padding         | `12px 24px`                    |
| Button             | font-weight     | `600`                          |
| Button             | transition      | `background-color 120ms ease`  |
| Card               | border-radius   | `12px`                         |
| Day card           | border-radius   | `16px`                         |
| Input              | border-radius   | `8px`                          |
| Card               | box-shadow      | `0 1px 2px rgba(20,30,60,0.04)`|
| Spacing scale      | `--s-1` … `--s-5` | `4 / 8 / 16 / 24 / 32 px`    |
```

> If the existing file's structure between `## Palette` and `## Components` already matches the above, only the values that changed (palette hex codes, button `border-radius` to `999px`, etc.) need editing. The block above is the canonical post-edit text.

- [ ] **Step 4: Verify**

```bash
cd "/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app"
# Logo and curve render as plain XML?
xmllint --noout public/img/racv-logo.svg public/img/journey-curve.svg 2>&1 \
  || echo "(xmllint not installed — open both SVGs in a browser to confirm visually instead)"

# Palette doc has the new tokens?
grep -E "racv-yellow.*FFD600" DESIGN_NOTES.md && echo "yellow OK"
grep -E "racv-blue.*0066CC" DESIGN_NOTES.md && echo "blue OK"
grep "999px" DESIGN_NOTES.md && echo "pill OK"
```

Expected: at minimum the three grep lines print OK. SVG can be visually verified by opening in a browser.

- [ ] **Step 5: Commit**

```bash
cd "/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app"
git add public/img/racv-logo.svg public/img/journey-curve.svg DESIGN_NOTES.md
git commit -m "feat(brand): real RACV palette + logo + journey curve"
```

---

### Task 8: Manual resort imagery (human action) + SETUP.md entry

**Files:**
- Create: `public/img/resorts/` directory
- Modify: `SETUP.md` (append `## 5. Resort imagery` section)

**Interfaces:**
- Consumes: nothing.
- Produces: 10 `.jpg` files (one per resort) at the listed paths. Phase 3 itinerary rendering uses these as hero images.

> **This is a human task.** The implementer subagent CANNOT browse the JS-rendered RACV resorts page. It writes the documentation, lists the exact slugs, and creates the empty directory. The human downloads each image manually.

- [ ] **Step 1: Create the directory placeholder**

```bash
cd "/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app"
mkdir -p public/img/resorts
# Placeholder so git tracks the directory before the JPGs land.
cat > public/img/resorts/.gitkeep <<'EOF'
Placeholder — replace with hero JPGs per the slugs in SETUP.md §5.
EOF
```

- [ ] **Step 2: Append `## 5. Resort imagery` to `SETUP.md`**

Append the following at the bottom of `SETUP.md`:

```markdown
---

## 5. Resort imagery (manual step)

V2 renders a hero image per resort. Source: `racv.com.au/travel-experiences/resorts.html`. Because the page is JS-rendered, this step is **manual** — there is no automated scrape in the codebase.

For each slug below, save one landscape JPG (≥ 1600×900, > 70% quality) into `public/img/resorts/<slug>.jpg`:

| Slug                  | Source page                                                   |
|-----------------------|---------------------------------------------------------------|
| `torquay`             | https://www.racv.com.au/travel-experiences/resorts/torquay.html |
| `cape-schanck`        | https://www.racv.com.au/travel-experiences/resorts/cape-schanck.html |
| `healesville`         | https://www.racv.com.au/travel-experiences/resorts/healesville.html |
| `inverloch`           | https://www.racv.com.au/travel-experiences/resorts/inverloch.html |
| `noosa`               | https://www.racv.com.au/travel-experiences/resorts/noosa.html |
| `royal-pines`         | https://www.racv.com.au/travel-experiences/resorts/royal-pines.html |
| `goldfields`          | https://www.racv.com.au/travel-experiences/resorts/goldfields.html |
| `cobram`              | https://www.racv.com.au/travel-experiences/resorts/cobram.html |
| `hobart`              | https://www.racv.com.au/travel-experiences/resorts/hobart.html |
| `city-club-melbourne` | https://www.racv.com.au/club/city-club-melbourne.html         |

Use right-click → "Save image" on the hero photo at the top of each page. Maintain attribution in `DESIGN_NOTES.md` under "Imagery" if RACV credit is shown on the source page.

Verify:

```bash
ls public/img/resorts/*.jpg | wc -l
# expect: 10
```
```

- [ ] **Step 3: Verify**

```bash
cd "/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app"
grep -c "^| \`" SETUP.md
# expect a number ≥ 10 (the new slug rows)
test -d public/img/resorts && echo "dir OK"
```

- [ ] **Step 4: Commit**

```bash
cd "/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app"
git add SETUP.md public/img/resorts/.gitkeep
git commit -m "docs(brand): SETUP §5 — manual resort imagery slugs"
```

> **Pending human action**: the 10 JPGs need to land in `public/img/resorts/` before Phase 3 Task 11 (`itinerary.html`) is demoed. Phase 1–2 do not depend on them.

---

### Task 9: Refit legacy chat UI to new brand (confidence check)

**Files:**
- Modify: `public/index.html` (the inline `<style>` block + footer disclaimer if missing)

**Interfaces:**
- Consumes: brand tokens from Task 7.
- Produces: legacy chat UI rendered with the V2 palette + pill buttons. No functional change.

> **Why this task exists:** Confidence check before building V2 pages. We want to verify the palette + Poppins + pill CTAs feel correct on a working page before committing to two new pages in Phase 3. Quick win, low risk.

- [ ] **Step 1: Update `public/index.html` `:root` block**

Find the `:root { ... }` block (it currently defines `--racv-navy`, `--racv-accent`, etc.). Replace it with:

```css
:root {
  /* Palette — V2 (see DESIGN_NOTES.md §Palette) */
  --racv-blue:     #0066CC;
  --racv-blue-2:   #004E9E;
  --racv-yellow:   #FFD600;
  --racv-yellow-2: #E6C100;
  --racv-ink:      #0A2E5C;
  --racv-text:     #1A2B4A;
  --racv-muted:    #6B7589;
  --racv-line:     #E0E5EF;
  --racv-bg:       #F4F6FA;
  --racv-card:     #FFFFFF;
  --racv-tint:     #EAF1FB;

  /* Typography */
  --font-brand: 'Poppins', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --fs-h1: 50px; --fs-h2: 30px; --fs-h3: 20px;
  --fs-body: 15px; --fs-small: 12.5px; --fs-button: 14px;

  /* Spacing scale */
  --s-1: 4px; --s-2: 8px; --s-3: 16px; --s-4: 24px; --s-5: 32px;

  /* Radii */
  --r-button: 999px;       /* PILL */
  --r-card:   12px;
  --r-input:  8px;
}
```

- [ ] **Step 2: Rename token references throughout `public/index.html`**

Replace every old token name with the new one. The mapping:

```
--racv-navy        →  --racv-blue
--racv-navy-2      →  --racv-blue-2
--racv-accent      →  --racv-yellow         (only where used for CTAs/focus)
--racv-warning     →  --racv-yellow         (focus ring)
--racv-ink         →  --racv-text           (body copy)  /  --racv-ink (headings)
```

Concrete commands (review each diff before committing):

```bash
cd "/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app"
# Most tokens are 1-to-1. --racv-ink is ambiguous: keep the existing
# occurrences but inspect them — body text should use --racv-text now.
sed -i.bak 's/--racv-navy-2/--racv-blue-2/g; s/--racv-navy/--racv-blue/g; s/--racv-accent/--racv-yellow/g; s/--racv-warning/--racv-yellow/g' public/index.html
diff public/index.html.bak public/index.html | head -60
rm public/index.html.bak
```

Hand-edit any spot where `--racv-ink` should become `--racv-text` for body copy (header `<p>`, bubble text). Headings keep `--racv-ink`.

- [ ] **Step 3: Convert buttons to pill (`border-radius`)**

In the existing `button { ... }` block, change `border-radius: var(--r-button);` to ensure it pulls the new `999px` token. The `:root` change in Step 1 already routes `--r-button` to `999px`, so this should be automatic — but verify the button rule actually references `var(--r-button)` and not a hardcoded value:

```bash
grep -n "border-radius" public/index.html | head
```

If you see hardcoded `border-radius: 4px;` or `border-radius: 0;` on the button rule, change to `border-radius: var(--r-button);`. The yellow button colour also needs to be applied:

```css
button {
  background: var(--racv-yellow);
  color: var(--racv-ink);
  /* keep everything else as before */
}
button:hover { background: var(--racv-yellow-2); }
button:focus-visible {
  outline: 3px solid var(--racv-blue);
  outline-offset: 2px;
}
```

- [ ] **Step 4: Visual verification**

```bash
cd "/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app/server"
# If server is not running, start it. If running, just hit the URL.
lsof -i :3000 -sTCP:LISTEN -P >/dev/null || (nohup npm start > /tmp/racv.log 2>&1 &) && sleep 3
curl -s http://localhost:3000/ | head -30
```

Then open `http://localhost:3000/` in a browser. Confirm visually:
- Send button is yellow with navy text and pill-shaped.
- Header background is white, "Member Concierge" text is the new brighter `#0066CC` blue.
- Page background is `#F4F6FA`.
- A round-trip chat still works (this validates we haven't broken `/api/chat`).

- [ ] **Step 5: Commit**

```bash
cd "/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app"
git add public/index.html
git commit -m "style(ui): re-skin legacy chat UI to V2 brand (confidence check)"
```

> **Phase 2 exit:** brand is verified on a working page; assets are in place (logo + curve committed, resort JPGs pending the human's manual step from Task 8). Phase 3 can build the V2 read-only frontend confidently.

---

## PHASE 3 — V2 frontend (read-only)

Phase exit: a member can deep-link to `/i/<token>` (or log in at `/login` → `/`), see an auto-generated itinerary rendered with V2 brand, but cannot yet refine via chat. First demoable state.

### Task 10: `POST /api/login` + `public/login.html`

**Files:**
- Create: `server/routes/login.js`
- Create: `public/login.html`
- Create: `public/assets/login.js`
- Create: `public/assets/styles.css` (initial — extends in Task 12)
- Modify: `server/index.js` (mount the login route + serve `/login` static page)

**Interfaces:**
- Consumes: existing `members` table (`MEMBER_SAFE` whitelist).
- Produces:
  - `POST /api/login { member_number, surname }` → `{ token, redirect: '/i/<token>' }` (200) | `{ error: 'no_match' }` (401).
  - `/login` HTML page served as a static asset.
  - `public/assets/styles.css` with the V2 brand tokens declared at `:root` so subsequent pages share them.
  - `mountLoginRoute(app, { supabase })`.

- [ ] **Step 1: Write the route + a unit test**

`server/itinerary/__tests__/login.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { mountLoginRoute } from '../../routes/login.js';

function fakeSupabase({ memberRow, itineraryRow }) {
  return {
    from(t) {
      return {
        select() { return this; },
        eq() { return this; },
        ilike() { return this; },
        maybeSingle: async () => t === 'members'
          ? { data: memberRow, error: null }
          : { data: itineraryRow, error: null },
      };
    },
  };
}

async function post(app, path, body) {
  return new Promise((resolve) => {
    const server = app.listen(0, async () => {
      const { port } = server.address();
      const r = await fetch(`http://127.0.0.1:${port}${path}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await r.json();
      server.close();
      resolve({ status: r.status, body: json });
    });
  });
}

test('valid creds return token + redirect', async () => {
  const app = express(); app.use(express.json());
  mountLoginRoute(app, { supabase: fakeSupabase({
    memberRow: { id: 1 },
    itineraryRow: { token: 'abc123xyz' },
  }) });
  const r = await post(app, '/api/login', { member_number: '100201', surname: 'Whitman' });
  assert.equal(r.status, 200);
  assert.equal(r.body.token, 'abc123xyz');
  assert.equal(r.body.redirect, '/i/abc123xyz');
});

test('wrong surname returns 401 with generic message', async () => {
  const app = express(); app.use(express.json());
  mountLoginRoute(app, { supabase: fakeSupabase({ memberRow: null, itineraryRow: null }) });
  const r = await post(app, '/api/login', { member_number: '100201', surname: 'Wrong' });
  assert.equal(r.status, 401);
  assert.equal(r.body.error, 'no_match');
  // MUST NOT reveal which field failed:
  assert.ok(!/surname|member/i.test(JSON.stringify(r.body)));
});

test('missing fields → 400', async () => {
  const app = express(); app.use(express.json());
  mountLoginRoute(app, { supabase: fakeSupabase({ memberRow: null, itineraryRow: null }) });
  const r = await post(app, '/api/login', { member_number: '100201' });
  assert.equal(r.status, 400);
});
```

- [ ] **Step 2: Run, verify failure**

```bash
cd "/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app/server"
npm test 2>&1 | tail -10
```

Expected: 3 new `ERR_MODULE_NOT_FOUND` for `mountLoginRoute`.

- [ ] **Step 3: Implement `server/routes/login.js`**

```js
export function mountLoginRoute(app, { supabase }) {
  app.post('/api/login', async (req, res) => {
    const { member_number, surname } = req.body || {};
    if (!member_number || !surname) return res.status(400).json({ error: 'missing_fields' });

    const { data: m } = await supabase
      .from('members')
      .select('id')
      .eq('member_number', String(member_number).trim())
      .ilike('surname', String(surname).trim())
      .maybeSingle();
    if (!m) return res.status(401).json({ error: 'no_match' });

    const { data: row } = await supabase
      .from('itineraries')
      .select('token')
      .eq('member_id', m.id)
      .maybeSingle();
    if (!row) return res.status(401).json({ error: 'no_match' });   // member has no booking; treat as no-match

    res.json({ token: row.token, redirect: `/i/${row.token}` });
  });
}
```

- [ ] **Step 4: Create the login page**

`public/login.html`:

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sign in — RACV Member Concierge</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="/assets/styles.css">
</head>
<body class="page-login">
  <header class="site-header">
    <a class="brand" href="/" aria-label="RACV home">
      <img src="/img/racv-logo.svg" alt="RACV" width="120" height="50">
    </a>
  </header>
  <div class="journey-curve" aria-hidden="true">
    <img src="/img/journey-curve.svg" alt="">
  </div>
  <main class="login-main">
    <section class="login-card" aria-labelledby="login-title">
      <h1 id="login-title">Welcome back</h1>
      <p class="lede">Open your stay itinerary.</p>
      <form id="login-form" novalidate>
        <label for="member_number">Member number</label>
        <input id="member_number" name="member_number" inputmode="numeric" autocomplete="username" placeholder="e.g. 100201" required>
        <label for="surname">Surname</label>
        <input id="surname" name="surname" autocomplete="family-name" required>
        <button type="submit" class="btn btn-yellow">Log in</button>
        <p id="error" class="error" role="alert" aria-live="polite" hidden></p>
      </form>
      <p class="hint">Don't have a member number? Try demo: <strong>100201</strong> / <strong>Whitman</strong>.</p>
    </section>
  </main>
  <footer class="site-footer">Proof of concept — not affiliated with RACV.</footer>
  <script type="module" src="/assets/login.js"></script>
</body>
</html>
```

- [ ] **Step 5: Create `public/assets/login.js`**

```js
const form = document.getElementById('login-form');
const err = document.getElementById('error');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  err.hidden = true;
  const body = {
    member_number: form.member_number.value.trim(),
    surname: form.surname.value.trim(),
  };
  const r = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (r.ok) {
    const data = await r.json();
    location.href = data.redirect;
  } else {
    err.textContent = "We couldn't find a matching booking. Please check the details and try again.";
    err.hidden = false;
  }
});
```

- [ ] **Step 6: Create initial `public/assets/styles.css`**

```css
:root {
  --racv-blue:     #0066CC;
  --racv-blue-2:   #004E9E;
  --racv-yellow:   #FFD600;
  --racv-yellow-2: #E6C100;
  --racv-ink:      #0A2E5C;
  --racv-text:     #1A2B4A;
  --racv-muted:    #6B7589;
  --racv-line:     #E0E5EF;
  --racv-bg:       #F4F6FA;
  --racv-card:     #FFFFFF;
  --racv-tint:     #EAF1FB;

  --font-brand: 'Poppins', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --fs-h1: 50px; --fs-h2: 30px; --fs-h3: 20px;
  --fs-body: 15px; --fs-small: 12.5px; --fs-button: 14px;

  --s-1: 4px; --s-2: 8px; --s-3: 16px; --s-4: 24px; --s-5: 32px;

  --r-button: 999px;
  --r-card:   12px;
  --r-input:  8px;
  --r-day:    16px;
}

* { box-sizing: border-box; }
body { margin: 0; font-family: var(--font-brand); color: var(--racv-text); background: var(--racv-bg); font-size: var(--fs-body); line-height: 1.55; }

.site-header { background: #fff; border-bottom: 1px solid var(--racv-line); padding: var(--s-3) var(--s-4); display: flex; align-items: center; }
.site-header .brand img { display: block; height: 32px; width: auto; }
.journey-curve img { display: block; width: 100%; height: 36px; }
.site-footer { text-align: center; color: var(--racv-muted); font-size: var(--fs-small); padding: var(--s-4); }

/* Buttons */
.btn { font: 600 var(--fs-button) var(--font-brand); border: 0; border-radius: var(--r-button); padding: 12px 24px; cursor: pointer; transition: background-color 120ms ease; }
.btn-yellow { background: var(--racv-yellow); color: var(--racv-ink); }
.btn-yellow:hover { background: var(--racv-yellow-2); }
.btn-yellow:focus-visible { outline: 3px solid var(--racv-blue); outline-offset: 2px; }

/* Form inputs */
input { width: 100%; font: var(--fs-body)/1 var(--font-brand); color: var(--racv-text); background: #fff; border: 1px solid var(--racv-line); border-radius: var(--r-input); padding: 12px 14px; outline: none; transition: border-color 120ms ease, box-shadow 120ms ease; }
input:focus { border-color: var(--racv-blue); box-shadow: 0 0 0 3px rgba(0,102,204,0.15); }
label { display: block; font-weight: 600; color: var(--racv-ink); margin: var(--s-3) 0 var(--s-1); font-size: var(--fs-small); text-transform: uppercase; letter-spacing: 0.5px; }

/* Login page */
.login-main { display: flex; justify-content: center; padding: var(--s-5) var(--s-4); }
.login-card { background: var(--racv-card); border: 1px solid var(--racv-line); border-radius: var(--r-card); padding: var(--s-5); max-width: 420px; width: 100%; box-shadow: 0 1px 2px rgba(20,30,60,0.04); }
.login-card h1 { font-size: var(--fs-h2); color: var(--racv-ink); margin: 0 0 var(--s-1); }
.login-card .lede { color: var(--racv-muted); margin: 0 0 var(--s-4); }
.login-card .btn { width: 100%; margin-top: var(--s-4); }
.login-card .hint { color: var(--racv-muted); font-size: var(--fs-small); margin: var(--s-4) 0 0; text-align: center; }
.login-card .error { color: #B00020; background: #FBEAEC; padding: var(--s-2) var(--s-3); border-radius: var(--r-input); margin: var(--s-3) 0 0; font-size: var(--fs-small); }
```

- [ ] **Step 7: Mount the route in `server/index.js`**

Add the import:

```js
import { mountLoginRoute } from './routes/login.js';
```

Mount after the static middleware (alongside `mountItineraryApi`):

```js
mountLoginRoute(app, { supabase });
```

- [ ] **Step 8: Verify**

```bash
cd "/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app/server"
node --check index.js && echo "syntax OK"
npm test 2>&1 | tail -10
```

Expected: `syntax OK`. `pass 46` (43 + 3).

Manual smoke (server should already be running from Task 9 — if not, start it):
```bash
curl -s http://localhost:3000/login.html | head
curl -sf -X POST http://localhost:3000/api/login -H 'Content-Type: application/json' -d '{"member_number":"100201","surname":"Whitman"}'
curl -sf -X POST http://localhost:3000/api/login -H 'Content-Type: application/json' -d '{"member_number":"100201","surname":"Wrong"}' -w "\nHTTP %{http_code}\n"
```

Expected: 200 + token on first POST; HTTP 401 on second.

Browser: open `http://localhost:3000/login.html`. Confirm yellow pill button, RACV logo + journey curve render, form submits.

- [ ] **Step 9: Commit**

```bash
cd "/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app"
git add server/routes/login.js server/itinerary/__tests__/login.test.js \
        public/login.html public/assets/login.js public/assets/styles.css \
        server/index.js
git commit -m "feat(login): /login page + POST /api/login + V2 styles base"
```

---

### Task 11: `GET /i/:token` HTML shell + pending detection

**Files:**
- Create: `server/routes/itineraryPage.js`
- Create: `public/itinerary.html`
- Modify: `server/index.js` (mount the page route)

**Interfaces:**
- Consumes: `itineraries` table (read).
- Produces: `GET /i/:token` returning the `itinerary.html` shell with inline `<script id="state" type="application/json">` containing either the full doc (when `status='ready'`) or `{"status":"pending"}`/`{"status":"generation_failed", "last_error":...}` otherwise.

- [ ] **Step 1: Write the route + a test**

`server/itinerary/__tests__/itineraryPage.test.js`:

```js
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
```

- [ ] **Step 2: Run, verify failure**

```bash
cd "/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app/server"
npm test 2>&1 | tail -10
```

Expected: 3 new `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement `server/routes/itineraryPage.js`**

```js
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export function mountItineraryPage(app, { supabase, publicDir }) {
  app.get('/i/:token', async (req, res) => {
    const { token } = req.params;
    const { data: row, error } = await supabase
      .from('itineraries')
      .select('status, doc, last_error')
      .eq('token', token)
      .maybeSingle();
    if (error || !row) return res.status(404).send('Itinerary not found');

    let state;
    if (row.status === 'ready' && row.doc && Object.keys(row.doc).length) {
      state = row.doc;
    } else if (row.status === 'generation_failed') {
      state = { status: 'generation_failed', last_error: row.last_error || null };
    } else {
      state = { status: 'pending' };
    }

    const shellPath = path.join(publicDir, 'itinerary.html');
    let shell = await readFile(shellPath, 'utf8');
    // Inject state into the placeholder.
    shell = shell.replace(
      '<script id="state" type="application/json">{}</script>',
      `<script id="state" type="application/json">${JSON.stringify(state).replace(/</g, '\\u003c')}</script>`,
    );
    res.type('html').send(shell);
  });
}
```

- [ ] **Step 4: Create `public/itinerary.html` shell**

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Your stay — RACV Member Concierge</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="/assets/styles.css">
</head>
<body class="page-itinerary">
  <header class="site-header">
    <a class="brand" href="/" aria-label="RACV home">
      <img src="/img/racv-logo.svg" alt="RACV" width="120" height="50">
    </a>
    <span class="header-divider" aria-hidden="true"></span>
    <strong class="header-title">Member Concierge</strong>
    <span class="header-spacer"></span>
    <a class="header-logout" href="/">Log out</a>
  </header>
  <div class="journey-curve" aria-hidden="true">
    <img src="/img/journey-curve.svg" alt="">
  </div>

  <div id="app" class="layout">
    <section id="itinerary-pane" class="pane pane-itinerary" aria-label="Itinerary"></section>
    <aside id="chat-pane" class="pane pane-chat" aria-label="Refine your stay"></aside>
  </div>

  <footer class="site-footer">Proof of concept — not affiliated with RACV.</footer>

  <script id="state" type="application/json">{}</script>
  <script type="module" src="/assets/itinerary.js"></script>
</body>
</html>
```

- [ ] **Step 5: Mount the route**

In `server/index.js`, alongside the other mounts, after the static middleware add:

```js
import { mountItineraryPage } from './routes/itineraryPage.js';
import path from 'path';
import { fileURLToPath } from 'url';
// (the path/fileURLToPath imports may already exist; skip if so.)

const PUBLIC_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
mountItineraryPage(app, { supabase, publicDir: PUBLIC_DIR });
```

> **Order matters**: the existing `app.use(express.static(...))` already serves `itinerary.html` at `/itinerary.html`. That's fine — the `/i/:token` route returns an injected variant of the same shell. Different URLs, different bodies. Direct visits to `/itinerary.html` will see an empty `<script id="state">{}</script>`, which the frontend handles by treating it as `{status:"pending"}`.

- [ ] **Step 6: Verify**

```bash
cd "/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app/server"
npm test 2>&1 | tail -10
node --check index.js
```

Expected: `pass 49` (46 + 3). Syntax OK.

Manual:
```bash
# Token issued for booking RACV-TQ-3001 was logged in Task 6 above; fetch it.
TOKEN=$(curl -sf -X POST http://localhost:3000/api/login \
  -H 'Content-Type: application/json' \
  -d '{"member_number":"100201","surname":"Whitman"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")
echo "TOKEN=$TOKEN"
curl -sf "http://localhost:3000/i/$TOKEN" | grep -o 'id="state"[^<]*' | head
```

Expected: token printed; the grep extracts the embedded JSON shell (`type="application/json">{...full doc...}` if Task 6's smoke ran first, otherwise `{"status":"pending"}`).

- [ ] **Step 7: Commit**

```bash
cd "/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app"
git add server/routes/itineraryPage.js server/itinerary/__tests__/itineraryPage.test.js \
        public/itinerary.html server/index.js
git commit -m "feat(itinerary): GET /i/:token page shell with inlined state"
```

---

### Task 12: Frontend rendering modules (days, blocks, hero, collapsible)

**Files:**
- Create: `public/assets/itinerary.js`
- Modify: `public/assets/styles.css` (extend with itinerary layout + components)

**Interfaces:**
- Consumes: `window.document.getElementById('state').textContent` parsed as JSON.
- Produces: a rendered itinerary in `#itinerary-pane`, with collapsible days, weather pills, kind-coloured block cards, hero band. Chat pane is a static placeholder in this task (Phase 4 Task 17 wires it up).

> **Design constraint:** vanilla JS, no framework. Render is a single function `render(state)` that re-runs on every state change.

- [ ] **Step 1: Extend `public/assets/styles.css`**

Append to the existing file (after the login styles from Task 10):

```css
/* === Itinerary layout === */
.page-itinerary { display: flex; flex-direction: column; min-height: 100vh; }
.site-header { gap: var(--s-3); }
.header-divider { width: 1px; height: 28px; background: var(--racv-line); }
.header-title { color: var(--racv-ink); font-size: var(--fs-h3); }
.header-spacer { flex: 1; }
.header-logout { color: var(--racv-blue); text-decoration: none; font-size: var(--fs-small); }
.header-logout:hover { text-decoration: underline; }

.layout { flex: 1; display: grid; grid-template-columns: 60% 40%; max-width: 1400px; margin: 0 auto; width: 100%; }
.pane { padding: var(--s-4); overflow-y: auto; }
.pane-itinerary { border-right: 1px solid var(--racv-line); }
.pane-chat { background: var(--racv-card); }

/* Hero */
.stay-hero { position: relative; border-radius: var(--r-card); overflow: hidden; margin-bottom: var(--s-4); aspect-ratio: 16/5; background: var(--racv-blue); }
.stay-hero img { display: block; width: 100%; height: 100%; object-fit: cover; }
.stay-hero::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(10,46,92,0.05), rgba(10,46,92,0.7)); }
.stay-hero .overlay { position: absolute; left: 0; right: 0; bottom: 0; padding: var(--s-4); color: #fff; }
.stay-hero h2 { margin: 0; font-size: var(--fs-h2); line-height: 1.1; }
.stay-hero p { margin: var(--s-1) 0 0; font-size: var(--fs-body); opacity: 0.9; }

/* Summary */
.summary-card { background: var(--racv-card); border: 1px solid var(--racv-line); border-radius: var(--r-card); padding: var(--s-3) var(--s-4); margin-bottom: var(--s-4); }
.summary-card h3 { margin: 0 0 var(--s-2); font-size: var(--fs-h3); color: var(--racv-ink); }
.summary-card ul { margin: 0; padding-left: var(--s-4); color: var(--racv-text); }

/* Day */
.day { background: var(--racv-card); border: 1px solid var(--racv-line); border-radius: var(--r-day); margin-bottom: var(--s-3); overflow: hidden; }
.day-header { display: flex; align-items: center; gap: var(--s-3); padding: var(--s-3) var(--s-4); cursor: pointer; user-select: none; }
.day-header[aria-expanded="true"] .chev { transform: rotate(90deg); }
.day-header .chev { transition: transform 120ms ease; color: var(--racv-blue); }
.day-header h4 { margin: 0; font-size: var(--fs-h3); color: var(--racv-ink); flex: 1; }
.day-header .weather-pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; background: var(--racv-tint); color: var(--racv-ink); font-size: var(--fs-small); }
.day-header .count { color: var(--racv-muted); font-size: var(--fs-small); }
.day-body { padding: 0 var(--s-4) var(--s-3); }
.day-body[hidden] { display: none; }

/* Block */
.block { display: grid; grid-template-columns: 4px 32px 1fr; gap: var(--s-3); align-items: start; padding: var(--s-3); border-top: 1px solid var(--racv-line); }
.block:first-child { border-top: 0; }
.block .bar { width: 4px; border-radius: 4px; align-self: stretch; }
.block .icon { font-size: 22px; line-height: 1; }
.block .body h5 { margin: 0; font-size: 16px; color: var(--racv-ink); }
.block .body p { margin: 4px 0 0; color: var(--racv-text); font-size: var(--fs-small); }
.block .time { display: inline-block; margin-top: var(--s-1); font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--racv-muted); }
.block .actions { display: flex; gap: var(--s-2); margin-top: var(--s-2); }
.block .actions button { background: transparent; border: 1px solid var(--racv-line); border-radius: var(--r-button); padding: 4px 10px; font-size: var(--fs-small); color: var(--racv-text); cursor: pointer; }
.block .actions button:hover { background: var(--racv-tint); }
.block.pinned .icon::after { content: '📌'; position: absolute; margin-left: -6px; margin-top: -8px; font-size: 10px; }

/* Kind colour bars */
.kind-arrival   .bar { background: var(--racv-blue); }
.kind-dining    .bar { background: #C97B3A; }
.kind-activity  .bar { background: var(--racv-yellow); }
.kind-spa       .bar { background: #8E69B5; }
.kind-event     .bar { background: var(--racv-blue-2); }
.kind-departure .bar { background: var(--racv-muted); }
.kind-free      .bar { background: var(--racv-line); }

/* Diff highlight (Task 18 wires this) */
.block.changed { animation: flash-bg 1200ms ease; }
@keyframes flash-bg { 0% { background: var(--racv-yellow); } 100% { background: transparent; } }

/* Chat pane placeholder (Phase 4 fills it) */
.chat-placeholder { color: var(--racv-muted); padding: var(--s-3); }

/* Loading shell */
.loading-wrap { padding: var(--s-5); max-width: 640px; margin: 0 auto; text-align: center; }
.loading-wrap h2 { color: var(--racv-ink); margin: 0 0 var(--s-3); }
.shimmer { height: 8px; background: linear-gradient(90deg, var(--racv-tint) 0%, var(--racv-yellow) 50%, var(--racv-tint) 100%); background-size: 200% 100%; animation: shimmer 1500ms linear infinite; border-radius: var(--r-button); margin: var(--s-3) 0; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.steps { text-align: left; max-width: 360px; margin: 0 auto; padding: 0; list-style: none; }
.steps li { padding: 6px 0; color: var(--racv-muted); }
.steps li.done { color: var(--racv-ink); }
.steps li.done::before { content: '✓ '; color: #2E7D32; }
.steps li.active { color: var(--racv-ink); }
.steps li.active::before { content: '◐ '; color: var(--racv-blue); }
.steps li.pending::before { content: '○ '; }

/* Error shell */
.error-wrap { padding: var(--s-5); max-width: 640px; margin: 0 auto; }
.error-wrap .btn { margin-top: var(--s-3); }

/* Mobile */
@media (max-width: 768px) {
  .layout { grid-template-columns: 1fr; }
  .pane-itinerary { border-right: 0; border-bottom: 1px solid var(--racv-line); }
}
```

- [ ] **Step 2: Create `public/assets/itinerary.js`**

```js
const state = JSON.parse(document.getElementById('state').textContent || '{}');

const $itin = document.getElementById('itinerary-pane');
const $chat = document.getElementById('chat-pane');

// --- Bootstrap router ---
if (!state || state.status === 'pending' || Object.keys(state).length === 0) {
  renderLoadingShell();
  triggerGenerate();
} else if (state.status === 'generation_failed') {
  renderErrorShell(state.last_error);
} else {
  renderItinerary(state);
}
renderChatPlaceholder();

// --- Renderers ---
function renderItinerary(doc) {
  $itin.innerHTML = '';
  $itin.appendChild(renderHero(doc));
  if (doc.summary?.highlights?.length) $itin.appendChild(renderSummary(doc.summary));
  const nights = doc.stay?.nights ?? 0;
  const defaultExpanded = nights <= 3
    ? () => true                                              // all
    : (i) => i === 0;                                         // today only
  doc.days?.forEach((d, i) => $itin.appendChild(renderDay(d, defaultExpanded(i))));
}

function renderHero(doc) {
  const el = document.createElement('section'); el.className = 'stay-hero';
  const hero = doc.resort?.hero_image || '/img/hero-resort.jpg';
  el.innerHTML = `
    <img src="${hero}" alt="" onerror="this.style.display='none'">
    <div class="overlay">
      <h2>Your stay at ${escapeHtml(doc.resort?.name ?? 'RACV')}</h2>
      <p>${formatStayLine(doc.stay)}</p>
    </div>`;
  return el;
}

function renderSummary(summary) {
  const el = document.createElement('div'); el.className = 'summary-card';
  el.innerHTML = `<h3>Highlights</h3><ul>${summary.highlights.map(h => `<li>${escapeHtml(h)}</li>`).join('')}</ul>`;
  return el;
}

function renderDay(day, expanded) {
  const el = document.createElement('section'); el.className = 'day'; el.dataset.dayId = day.id;
  const w = day.weather || {};
  const weatherPill = w.condition ? `<span class="weather-pill">${escapeHtml(w.condition)} · ${w.temp_max_c ?? '?'}°C · ${w.precip_pct ?? 0}% rain</span>` : '';
  el.innerHTML = `
    <div class="day-header" role="button" aria-expanded="${expanded}" tabindex="0">
      <span class="chev">▶</span>
      <h4>${escapeHtml(day.label || day.date)}</h4>
      ${weatherPill}
      <span class="count">${day.blocks?.length ?? 0} activities</span>
    </div>
    <div class="day-body" ${expanded ? '' : 'hidden'}>
      ${(day.blocks || []).map(renderBlock).join('')}
    </div>`;
  const header = el.querySelector('.day-header');
  header.addEventListener('click', () => toggleDay(el));
  header.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDay(el); } });
  return el;
}

function renderBlock(b) {
  const cls = `block kind-${b.kind}${b.pinned ? ' pinned' : ''}`;
  return `
    <div class="${cls}" data-block-id="${b.id}">
      <div class="bar"></div>
      <div class="icon">${escapeHtml(b.icon || '●')}</div>
      <div class="body">
        <h5>${escapeHtml(b.title || '')}</h5>
        ${b.description ? `<p>${escapeHtml(b.description)}</p>` : ''}
        ${b.venue ? `<p class="venue">${escapeHtml(b.venue)}</p>` : ''}
        <span class="time">${escapeHtml(b.time_of_day || '')}</span>
        <div class="actions">
          <button data-action="pin">${b.pinned ? '✕ Unpin' : '📌 Pin'}</button>
          ${b.pinned ? '' : '<button data-action="swap">↔ Swap</button>'}
          <button data-action="remove">✕ Remove</button>
        </div>
      </div>
    </div>`;
}

function renderChatPlaceholder() {
  $chat.innerHTML = `<div class="chat-placeholder">Chat refinement arrives in Phase 4. The itinerary view is read-only for now.</div>`;
}

function renderLoadingShell() {
  $itin.innerHTML = `
    <div class="loading-wrap">
      <h2>Building your stay…</h2>
      <div class="shimmer"></div>
      <ul class="steps" id="steps">
        <li id="step-1" class="active">Pulling your booking</li>
        <li id="step-2" class="pending">Checking the weather</li>
        <li id="step-3" class="pending">Finding local experiences</li>
        <li id="step-4" class="pending">Building your day-by-day plan</li>
      </ul>
      <p style="color:var(--racv-muted)">~30–60 seconds. Hold tight; we only do this once.</p>
    </div>`;
  // Fake-progress timers (no SSE, per spec).
  const advance = (from, to) => {
    const f = document.getElementById(`step-${from}`); const t = document.getElementById(`step-${to}`);
    if (f) { f.classList.remove('active'); f.classList.add('done'); }
    if (t) { t.classList.remove('pending'); t.classList.add('active'); }
  };
  setTimeout(() => advance(1, 2), 4000);
  setTimeout(() => advance(2, 3), 12000);
  setTimeout(() => advance(3, 4), 28000);
}

function renderErrorShell(lastError) {
  $itin.innerHTML = `
    <div class="error-wrap">
      <h2>We couldn't build your stay just yet</h2>
      <p>${escapeHtml(lastError || 'The generator reported an error.')}</p>
      <button class="btn btn-yellow" id="retry">Try again</button>
    </div>`;
  document.getElementById('retry').addEventListener('click', triggerGenerate);
}

// --- Actions ---
function toggleDay(el) {
  const header = el.querySelector('.day-header');
  const body = el.querySelector('.day-body');
  const expanded = header.getAttribute('aria-expanded') === 'true';
  header.setAttribute('aria-expanded', String(!expanded));
  body.hidden = expanded;
}

async function triggerGenerate() {
  const m = location.pathname.match(/^\/i\/([^/]+)/);
  if (!m) return;
  const token = m[1];
  try {
    const r = await fetch(`/api/itinerary/${token}/generate`, { method: 'POST' });
    if (!r.ok) {
      const detail = await r.json().catch(() => ({}));
      renderErrorShell(detail.error || `HTTP ${r.status}`);
      return;
    }
    const data = await r.json();
    renderItinerary(data.itinerary);
  } catch (e) {
    renderErrorShell(e.message);
  }
}

// --- Helpers ---
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}
function formatStayLine(s) {
  if (!s) return '';
  const fmt = (d) => new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
  return `${fmt(s.check_in)} – ${fmt(s.check_out)} · ${s.nights} night${s.nights === 1 ? '' : 's'} · ${escapeHtml(s.room_type)} for ${s.party_size}`;
}
```

- [ ] **Step 3: Visual verification**

```bash
cd "/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app/server"
# Server should be running. If not:
lsof -i :3000 -sTCP:LISTEN -P >/dev/null || (nohup npm start > /tmp/racv.log 2>&1 &) && sleep 3
TOKEN=$(curl -sf -X POST http://localhost:3000/api/login -H 'Content-Type: application/json' -d '{"member_number":"100201","surname":"Whitman"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")
echo "open in browser: http://localhost:3000/i/$TOKEN"
```

Open the URL. Confirm:
- 4 days render (or 3 if Eleanor's booking is 3 nights → 4 entries).
- Day 1 (or all if Eleanor's stay ≤ 3 nights) is expanded.
- Clicking a day header toggles its body.
- Hero image attempts to load `/img/resorts/torquay.jpg` — falls back gracefully if the human hasn't dropped it in yet (per Task 8).
- Yellow CTA button on any error shell.
- Right pane shows the chat placeholder ("Chat refinement arrives in Phase 4.").
- Footer disclaimer visible.

- [ ] **Step 4: Commit**

```bash
cd "/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app"
git add public/assets/itinerary.js public/assets/styles.css
git commit -m "feat(itinerary): vanilla JS rendering — days, blocks, hero, collapsible"
```

---

### Task 13: Loading skeleton + auto-generate trigger polish

> **Note:** the loading skeleton, error shell, and `triggerGenerate` wiring all landed in Task 12's `itinerary.js` since they're inseparable from the main render. This task polishes the loading UX and stay-bucket defaults.

**Files:**
- Modify: `public/assets/itinerary.js` (improve expand-default logic, add week-grouping helper)
- Modify: `public/assets/styles.css` (sticky day nav)

**Interfaces:**
- Consumes: itinerary doc.
- Produces: nothing new at the API boundary; better long-stay UX.

- [ ] **Step 1: Add the sticky day-nav rail for long stays**

Append to `public/assets/styles.css`:

```css
/* Sticky day-jump nav (≥ 7 nights) */
.day-nav { position: sticky; top: var(--s-3); float: right; margin-left: var(--s-3); background: var(--racv-card); border: 1px solid var(--racv-line); border-radius: var(--r-card); padding: var(--s-3); min-width: 160px; font-size: var(--fs-small); }
.day-nav h6 { margin: 0 0 var(--s-2); color: var(--racv-muted); font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
.day-nav a { display: block; color: var(--racv-blue); text-decoration: none; padding: 2px 0; }
.day-nav a:hover { text-decoration: underline; }
.day-nav .week-label { margin-top: var(--s-2); color: var(--racv-ink); font-weight: 600; padding-top: var(--s-2); border-top: 1px solid var(--racv-line); }
.toolbar { display: flex; gap: var(--s-2); margin: 0 0 var(--s-3); }
.toolbar .btn-text { background: transparent; border: 1px solid var(--racv-line); border-radius: var(--r-button); padding: 6px 14px; cursor: pointer; font-size: var(--fs-small); color: var(--racv-text); }
.toolbar .btn-text:hover { background: var(--racv-tint); }
.week-divider { padding: var(--s-3) 0 var(--s-2); color: var(--racv-muted); font-size: var(--fs-small); text-transform: uppercase; letter-spacing: 1px; }
```

- [ ] **Step 2: Update `renderItinerary` in `public/assets/itinerary.js`**

Replace the existing `renderItinerary` function with:

```js
function renderItinerary(doc) {
  $itin.innerHTML = '';
  $itin.appendChild(renderHero(doc));
  if (doc.summary?.highlights?.length) $itin.appendChild(renderSummary(doc.summary));
  const nights = doc.stay?.nights ?? 0;
  const isLong = nights >= 7;

  // Default-expanded rule (spec §7):
  //   nights ≤ 3 → all
  //   nights 4–6 → today + tomorrow (we approximate today=first day)
  //   nights ≥ 7 → today only
  const expandedDefault = (i) => {
    if (nights <= 3) return true;
    if (nights <= 6) return i === 0 || i === 1;
    return i === 0;
  };

  if (isLong) $itin.appendChild(renderDayNav(doc));

  if (nights > 5) $itin.appendChild(renderToolbar(doc));

  doc.days?.forEach((d, i) => {
    // Week dividers every 7 days for long stays
    if (isLong && i > 0 && i % 7 === 0) {
      const divider = document.createElement('div'); divider.className = 'week-divider';
      divider.textContent = `Week ${Math.floor(i / 7) + 1}`;
      $itin.appendChild(divider);
    }
    $itin.appendChild(renderDay(d, expandedDefault(i)));
  });
}

function renderDayNav(doc) {
  const el = document.createElement('nav'); el.className = 'day-nav'; el.setAttribute('aria-label', 'Jump to day');
  el.innerHTML = '<h6>Jump to</h6>' + doc.days.map((d, i) => {
    const weekStart = i % 7 === 0 && i > 0;
    return (weekStart ? `<div class="week-label">Week ${Math.floor(i/7) + 1}</div>` : '') +
           `<a href="#${d.id}">${escapeHtml(d.label || d.date)}</a>`;
  }).join('');
  return el;
}

function renderToolbar(doc) {
  const el = document.createElement('div'); el.className = 'toolbar';
  el.innerHTML = `
    <button type="button" class="btn-text" data-action="expand-all">Expand all</button>
    <button type="button" class="btn-text" data-action="collapse-all">Collapse all</button>`;
  el.addEventListener('click', (e) => {
    const action = e.target?.dataset?.action;
    if (!action) return;
    document.querySelectorAll('.day-header').forEach((h) => {
      const body = h.parentElement.querySelector('.day-body');
      const expand = action === 'expand-all';
      h.setAttribute('aria-expanded', String(expand));
      body.hidden = !expand;
    });
  });
  return el;
}
```

Also ensure `renderDay` sets `id` on the section so the `<a href="#day-N">` anchors work:

```js
// In renderDay, change:
const el = document.createElement('section'); el.className = 'day'; el.dataset.dayId = day.id;
// to:
const el = document.createElement('section'); el.className = 'day'; el.id = day.id; el.dataset.dayId = day.id;
```

- [ ] **Step 3: Manual verification with the existing 3-night booking**

```bash
# Use the same URL as Task 12.
echo "open: http://localhost:3000/i/<TOKEN>"
```

Expected: all 4 days expanded by default (since 3 nights ≤ 3 — actually 3 nights produces 4 days; the rule says "expand all when nights ≤ 3", so all 4 days expand). The toolbar buttons NOT shown (since 3 ≤ 5). No day-jump nav.

> **No long-stay test data exists in seed:** the 16 seeded bookings are all short. To smoke the long-stay path manually, hand-edit one booking row in Supabase to `check_out = check_in + 14 days`, re-run `npm run smoke:generate`, and re-load. Then revert. Not part of the automated tests.

- [ ] **Step 4: Commit**

```bash
cd "/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app"
git add public/assets/itinerary.js public/assets/styles.css
git commit -m "feat(itinerary): long-stay polish — day-jump nav, week dividers, expand toolbar"
```

> **Phase 3 exit:** members can deep-link or log in, see a full itinerary rendered with V2 brand, collapse/expand days, see long-stay layout. Read-only. Chat panel is a placeholder. This is the first shippable demo state.

---

## PHASE 4 — Chat refinement

Phase exit: the chat panel can mutate the persisted itinerary via 7 mutation tools, render 5 adaptive-card patterns, and the itinerary view re-renders after each turn with the changed blocks briefly highlighted.

### Task 14: `server/itinerary/mutator.js` — 7 mutation operations

**Files:**
- Create: `server/itinerary/mutator.js`
- Create: `server/itinerary/__tests__/mutator.test.js`

**Interfaces:**
- Consumes:
  - Supabase client (injected; reads/writes `itineraries.doc` + `version`).
  - `validateFull`, `softRepair`, `BLOCK_KINDS`, `TIMES_OF_DAY` from `./schema.js`.
  - `regenerateHighlights` from `./summarizer.js`.
- Produces (each operates on the doc, validates, persists, bumps `version`, regenerates highlights, returns the version + minimal diff):
  - `addActivity({ token, supabase, day_id, time_of_day, kind, title, description, venue, source_url }) → { block_id, version }`
  - `swapActivity({ token, supabase, block_id, replacement }) → { block_id, version }`
  - `removeActivity({ token, supabase, block_id }) → { version }`
  - `reorderDay({ token, supabase, day_id, block_ids }) → { version }`
  - `setPreference({ token, supabase, key, value }) → { version }`
  - `pinBlock({ token, supabase, block_id, pinned }) → { version }`
  - `regenerateDay({ token, supabase, anthropic, model, day_id, reason }) → { version, day_id }` (the only mutator that calls GLM)

- [ ] **Step 1: Write the failing tests**

`server/itinerary/__tests__/mutator.test.js` — single file, one suite per operation. Pattern: build a fake Supabase that holds an in-memory doc, call the mutator, assert on the new doc.

```js
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
```

- [ ] **Step 2: Run, verify failure**

```bash
cd "/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app/server"
npm test 2>&1 | tail -15
```

Expected: 9 new failures, `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement `server/itinerary/mutator.js`**

```js
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

  const block = softRepair({ days: [{ blocks: [{ id: nextBlockId(doc), kind, time_of_day, title, description, venue, source_url, pinned: false }] }] }, { weather: { days: [] } }).days[0].blocks[0];
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

  const repaired = softRepair({ days: [{ blocks: [{ ...ref.block, ...replacement, id: block_id }] }] }, { weather: { days: [] } }).days[0].blocks[0];
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

// `regenerateDay` is GLM-driven; implemented but not unit-tested here.
// See Phase 4 Task 15 for the chat agent that wires it up.
export async function regenerateDay({ store, anthropic, model, day_id, reason }) {
  const doc = await store.load();
  const day = findDay(doc, day_id);
  if (!day) throw Object.assign(new Error('unknown day_id'), { httpStatus: 422 });
  const prompt = buildRegenerateDayPrompt(doc, day_id, reason);
  const resp = await anthropic.messages.create({
    model, max_tokens: 2000, system: prompt,
    messages: [{ role: 'user', content: 'Produce the JSON now.' }],
  });
  const text = resp.content.filter(b => b.type === 'text').map(b => b.text).join('');
  const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  let parsed;
  try { parsed = JSON.parse(cleaned); }
  catch { throw Object.assign(new Error('regenerate_day_unparseable'), { httpStatus: 502 }); }
  if (!parsed.day || parsed.day.id !== day_id) throw Object.assign(new Error('regenerate_day_invalid'), { httpStatus: 502 });

  // Preserve pinned blocks from the original day.
  const pinned = day.blocks.filter(b => b.pinned);
  const fresh = (parsed.day.blocks || []).filter(b => !pinned.some(p => p.id === b.id));
  day.blocks = [...pinned, ...fresh];
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
    '- Honour the V1 hard/soft rules (activity counts by stay length, weather steering, etc.).',
    '- Reuse the IDs of pinned blocks; mint new IDs (`blk-NNN`, incrementing past the current max) for new blocks.',
    'Return ONLY the JSON. No prose.',
  ].join('\n');
}
```

- [ ] **Step 4: Run tests, verify pass**

```bash
cd "/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app/server"
npm test 2>&1 | tail -10
```

Expected: `pass 58` (49 + 9). No failures.

- [ ] **Step 5: Commit**

```bash
cd "/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app"
git add server/itinerary/mutator.js server/itinerary/__tests__/mutator.test.js
git commit -m "feat(itinerary): 7 mutation operations + regenerate_day"
```

---

### Task 15: Chat agent — `chatAgent.js`, `chatTools.js`, `agent/systemPrompt.js`

**Files:**
- Create: `server/agent/systemPrompt.js`
- Create: `server/agent/chatTools.js`
- Create: `server/agent/chatAgent.js`
- Create: `server/agent/__tests__/chatAgent.test.js`

**Interfaces:**
- Consumes: mutator ops + the existing 5 read-only tools from `server/index.js` (will be re-exported via `chatTools.js`).
- Produces:
  - `buildChatSystemPrompt({ itinerary, userMessage }) → string`
  - `CHAT_TOOLS = [...]` — 12 Anthropic tool definitions (5 read-only + 7 mutation).
  - `runChatAgent({ token, messages, supabase, anthropic, model }) → Promise<{ reply, ui_hint, messages, version }>`

> **Note on read-only tool handlers:** the 5 existing tool handlers live as `handlers.member_lookup` etc. inside `server/index.js`. We don't move them in this phase; `chatAgent.js` imports them by requiring the parts of `server/index.js` we need. Phase 5 (cutover) will tidy this. For now, expose them via a tiny re-export.

- [ ] **Step 1: Re-export the read-only handlers from `server/index.js`**

In `server/index.js`, find the line `const handlers = {`. Add an export above it:

```js
export const TOOL_HANDLERS = {}; // populated by the assignment below
```

And change `const handlers = {` to:

```js
const handlers = TOOL_HANDLERS;
Object.assign(TOOL_HANDLERS, {
```

…then close with `});` at the existing close of the object.

> Alternative (cleaner if you prefer not to mutate the existing handlers shape): extract `member_lookup`, `get_booking`, `get_resort_knowledge`, `get_events`, `get_weather` into a new `server/tools/readonly.js` module and re-import from both `server/index.js` and `server/agent/chatAgent.js`. Either approach works; the assignment-above-the-object hack is the smaller diff.

- [ ] **Step 2: Write the failing chat-agent test**

`server/agent/__tests__/chatAgent.test.js`:

```js
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
```

- [ ] **Step 3: Run, verify failure**

```bash
cd "/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app/server"
# Add the chat agent test glob to the test script if it isn't already.
# Update server/package.json scripts.test:
#   "test": "node --test --test-reporter=spec liveEvents/__tests__/*.test.js itinerary/__tests__/*.test.js agent/__tests__/*.test.js"
grep -q "agent/__tests__" package.json || sed -i.bak 's|itinerary/__tests__/\*.test.js|itinerary/__tests__/*.test.js agent/__tests__/*.test.js|' package.json && rm -f package.json.bak
npm test 2>&1 | tail -10
```

Expected: 5 new `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 4: Implement `server/agent/systemPrompt.js`**

```js
export function buildChatSystemPrompt({ itinerary, userMessage }) {
  return [
    "You are RACV's concierge refining the member's existing stay itinerary.",
    '',
    'CURRENT ITINERARY (full JSON):',
    JSON.stringify(itinerary, null, 2),
    '',
    `The member said: ${JSON.stringify(userMessage)}`,
    '',
    'You may:',
    '- Use read-only tools (get_events, get_weather, get_resort_knowledge, get_booking, member_lookup) to look something up.',
    '- Use mutation tools (add_activity, swap_activity, remove_activity, reorder_day, set_preference, pin_block, regenerate_day) to update the itinerary.',
    '',
    'After all tool calls, your FINAL response must be a JSON object on ONE line:',
    '{ "reply": "<≤200 chars conversational text>",',
    '  "ui_hint": { "type": "chips"|"radio"|"multi"|"form"|"none", ... } }',
    '',
    'ui_hint payload shapes:',
    '  chips: { "type":"chips", "options":["..."] }',
    '  radio: { "type":"radio", "question":"...", "options":[{"id":"...","label":"..."}] }',
    '  multi: { "type":"multi", "question":"...", "options":[{"id":"...","label":"..."}] }',
    '  form:  { "type":"form", "fields":[{"id":"...","label":"...","kind":"select","options":[...] }] }',
    '  none:  { "type":"none" }',
    '',
    'RULES:',
    '- Do NOT regenerate the whole itinerary. Make the smallest change that satisfies the request.',
    '- Respect pinned blocks (pinned: true). Refuse to swap or remove them; mention them in your reply instead.',
    '- After calling set_preference for a preference that changes existing block choices (dietary, pace, interests), also call regenerate_day on impacted days.',
    '- Use the existing IDs (day-N, blk-NNN) — never invent them.',
    'TONE: warm, brief, five-star concierge. No emojis in text fields; the icon field carries the visual marker.',
  ].join('\n');
}
```

- [ ] **Step 5: Implement `server/agent/chatTools.js`**

```js
// All 12 tool definitions (5 read-only + 7 mutation) in Anthropic SDK shape.
// Read-only tools delegate to handlers in server/index.js (TOOL_HANDLERS export).
// Mutation tools delegate to ./mutator.js.

const j = (props, required) => ({ type: 'object', properties: props, required });

export const READ_TOOLS = [
  { name: 'member_lookup',          description: 'Verify a member by member number AND surname.',          input_schema: j({ member_number: { type: 'string' }, surname: { type: 'string' } }, ['member_number','surname']) },
  { name: 'get_booking',            description: "Retrieve the verified member's own booking(s).",          input_schema: j({ member_id: { type: 'integer' } }, ['member_id']) },
  { name: 'get_resort_knowledge',   description: 'Get resort amenities, dining, experiences, room types.', input_schema: j({ resort_slug: { type: 'string' } }, ['resort_slug']) },
  { name: 'get_events',             description: 'Local events in a date range for a resort.',             input_schema: j({ resort_slug: { type: 'string' }, start_date: { type: 'string' }, end_date: { type: 'string' } }, ['resort_slug','start_date','end_date']) },
  { name: 'get_weather',            description: 'Daily forecast for a resort over a date range.',         input_schema: j({ resort_slug: { type: 'string' }, start_date: { type: 'string' }, end_date: { type: 'string' } }, ['resort_slug','start_date','end_date']) },
];

export const MUTATION_TOOLS = [
  { name: 'add_activity',     description: 'Append an activity block to a day.',           input_schema: j({ day_id: { type: 'string' }, time_of_day: { type: 'string' }, kind: { type: 'string' }, title: { type: 'string' }, description: { type: 'string' }, venue: { type: 'string' }, source_url: { type: 'string' } }, ['day_id','time_of_day','kind','title']) },
  { name: 'swap_activity',    description: 'Replace a block (preserves id; rejects pinned).', input_schema: j({ block_id: { type: 'string' }, replacement: { type: 'object' } }, ['block_id','replacement']) },
  { name: 'remove_activity',  description: 'Remove a block (rejects pinned).',               input_schema: j({ block_id: { type: 'string' } }, ['block_id']) },
  { name: 'reorder_day',      description: 'Reorder blocks within a day by id.',             input_schema: j({ day_id: { type: 'string' }, block_ids: { type: 'array', items: { type: 'string' } } }, ['day_id','block_ids']) },
  { name: 'set_preference',   description: 'Set a member preference: party_kind|dietary|pace|interests.', input_schema: j({ key: { type: 'string' }, value: {} }, ['key','value']) },
  { name: 'pin_block',        description: 'Pin or unpin a block (pinned blocks resist swap/remove).',    input_schema: j({ block_id: { type: 'string' }, pinned: { type: 'boolean' } }, ['block_id','pinned']) },
  { name: 'regenerate_day',   description: 'Ask the model to rewrite ONE day, respecting pinned blocks.', input_schema: j({ day_id: { type: 'string' }, reason: { type: 'string' } }, ['day_id','reason']) },
];

export const CHAT_TOOLS = [...READ_TOOLS, ...MUTATION_TOOLS];
```

- [ ] **Step 6: Implement `server/agent/chatAgent.js`**

```js
import { CHAT_TOOLS } from './chatTools.js';
import { buildChatSystemPrompt } from './systemPrompt.js';
import { TOOL_HANDLERS } from '../index.js';
import {
  addActivity, swapActivity, removeActivity, reorderDay,
  setPreference, pinBlock, regenerateDay, loadStore,
} from '../itinerary/mutator.js';

export { buildChatSystemPrompt, CHAT_TOOLS };

const FALLBACK_CHIPS = {
  type: 'chips',
  options: ['Add a dinner reservation', 'Swap an outdoor activity for an indoor one', 'I have dietary needs'],
};

export async function runChatAgent({ token, messages, supabase, anthropic, model }) {
  // 1. Load current itinerary as system-prompt context.
  const { data: row } = await supabase
    .from('itineraries').select('doc, version').eq('token', token).maybeSingle();
  if (!row?.doc) throw Object.assign(new Error('itinerary_not_found'), { httpStatus: 404 });
  const userMessage = messages.findLast?.(m => m.role === 'user')?.content
    ?? messages.filter(m => m.role === 'user').slice(-1)[0]?.content
    ?? '';
  const system = buildChatSystemPrompt({ itinerary: row.doc, userMessage });

  // 2. Run agent loop (max 8 turns).
  const store = loadStore(supabase, token);
  let turn = 0;
  while (turn++ < 8) {
    const resp = await anthropic.messages.create({ model, max_tokens: 2000, system, tools: CHAT_TOOLS, messages });
    messages.push({ role: 'assistant', content: resp.content });

    if (resp.stop_reason !== 'tool_use') {
      const text = resp.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
      const cleaned = text.replace(/^```json\s*/i,'').replace(/```\s*$/i,'').trim();
      let parsed;
      try { parsed = JSON.parse(cleaned); } catch { parsed = { reply: text, ui_hint: FALLBACK_CHIPS }; }
      const ui_hint = parsed.ui_hint && typeof parsed.ui_hint === 'object' ? parsed.ui_hint : FALLBACK_CHIPS;
      const { data: latest } = await supabase.from('itineraries').select('version').eq('token', token).maybeSingle();
      return { reply: parsed.reply || '', ui_hint, messages, version: latest?.version ?? row.version };
    }

    const toolResults = [];
    for (const block of resp.content) {
      if (block.type !== 'tool_use') continue;
      let result;
      try {
        result = await dispatchTool({ name: block.name, input: block.input, store, supabase, anthropic, model });
      } catch (e) {
        result = { error: e.message };
      }
      toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) });
    }
    messages.push({ role: 'user', content: toolResults });
  }
  // Loop exceeded.
  return { reply: "Sorry — I couldn't complete that. Try a smaller change.", ui_hint: FALLBACK_CHIPS, messages, version: row.version };
}

async function dispatchTool({ name, input, store, supabase, anthropic, model }) {
  // Read-only tools — delegate to existing handlers in server/index.js.
  if (TOOL_HANDLERS[name]) return TOOL_HANDLERS[name](input);

  // Mutation tools.
  switch (name) {
    case 'add_activity':    return addActivity({ store, ...input });
    case 'swap_activity':   return swapActivity({ store, ...input });
    case 'remove_activity': return removeActivity({ store, ...input });
    case 'reorder_day':     return reorderDay({ store, ...input });
    case 'set_preference':  return setPreference({ store, ...input });
    case 'pin_block':       return pinBlock({ store, ...input });
    case 'regenerate_day':  return regenerateDay({ store, anthropic, model, ...input });
    default: return { error: `unknown_tool: ${name}` };
  }
}
```

- [ ] **Step 7: Run tests, verify pass**

```bash
cd "/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app/server"
npm test 2>&1 | tail -10
node --check index.js
```

Expected: `pass 63` (58 + 5). Syntax OK.

- [ ] **Step 8: Commit**

```bash
cd "/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app"
git add server/agent/ server/index.js server/package.json
git commit -m "feat(agent): chat refinement loop — 12 tools, ui_hint contract"
```

---

### Task 16: Chat + poll routes

**Files:**
- Modify: `server/routes/itineraryApi.js` (add `chat`, poll, `regenerate` endpoints)

**Interfaces:**
- Produces:
  - `POST /api/itinerary/:token/chat { messages }` → `{ reply, ui_hint, messages, version }`
  - `GET  /api/itinerary/:token?since=N` → 204 if `version ≤ N`; 200 + `{ itinerary }` otherwise.
  - `POST /api/itinerary/:token/regenerate` → calls `generateItinerary` ignoring cache (overwrites the persisted doc).
  - `POST /api/itinerary/:token/pin { block_id, pinned }` → direct pin call without chat round-trip (for the inline Pin button).

- [ ] **Step 1: Update `server/routes/itineraryApi.js`**

Replace the existing file contents with:

```js
import { generateItinerary as defaultGenerate } from '../itinerary/generator.js';
import { runChatAgent as defaultRunChatAgent } from '../agent/chatAgent.js';
import { loadStore, pinBlock } from '../itinerary/mutator.js';

export function mountItineraryApi(app, opts) {
  const { supabase, anthropic, model } = opts;
  const generateItinerary = opts.generateItinerary || defaultGenerate;
  const runChatAgent      = opts.runChatAgent      || defaultRunChatAgent;

  app.post('/api/itinerary/:token/generate', async (req, res) => {
    try {
      const itinerary = await generateItinerary({ token: req.params.token, supabase, anthropic, model });
      res.json({ itinerary });
    } catch (e) {
      res.status(e.httpStatus || 500).json({ error: e.message, errors: e.errors });
    }
  });

  app.post('/api/itinerary/:token/regenerate', async (req, res) => {
    try {
      // Force regenerate by clearing status first.
      await supabase.from('itineraries').update({ status: 'pending', doc: {} }).eq('token', req.params.token);
      const itinerary = await generateItinerary({ token: req.params.token, supabase, anthropic, model });
      res.json({ itinerary });
    } catch (e) {
      res.status(e.httpStatus || 500).json({ error: e.message, errors: e.errors });
    }
  });

  app.get('/api/itinerary/:token', async (req, res) => {
    const since = parseInt(req.query.since ?? '0', 10);
    const { data, error } = await supabase
      .from('itineraries').select('doc, version, status').eq('token', req.params.token).maybeSingle();
    if (error || !data) return res.status(404).json({ error: 'itinerary_not_found' });
    if (data.status !== 'ready') return res.json({ itinerary: { status: data.status } });
    if ((data.version ?? 0) <= since) return res.status(204).end();
    res.json({ itinerary: data.doc });
  });

  app.post('/api/itinerary/:token/chat', async (req, res) => {
    try {
      const out = await runChatAgent({
        token: req.params.token,
        messages: req.body.messages || [],
        supabase, anthropic, model,
      });
      res.json(out);
    } catch (e) {
      res.status(e.httpStatus || 500).json({ error: e.message });
    }
  });

  app.post('/api/itinerary/:token/pin', async (req, res) => {
    const { block_id, pinned } = req.body || {};
    if (!block_id) return res.status(400).json({ error: 'missing_block_id' });
    try {
      const store = loadStore(supabase, req.params.token);
      const out = await pinBlock({ store, block_id, pinned: Boolean(pinned) });
      res.json(out);
    } catch (e) {
      res.status(e.httpStatus || 500).json({ error: e.message });
    }
  });
}
```

- [ ] **Step 2: Verify**

```bash
cd "/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app/server"
npm test 2>&1 | tail -10
node --check index.js
node --check routes/itineraryApi.js
```

Expected: `pass 63` (the existing 3 itineraryApi tests still pass; we don't add new tests for the new routes here — they're thin pass-throughs to functions that ARE tested. End-to-end coverage comes in Task 18 manual smoke.)

- [ ] **Step 3: Commit**

```bash
cd "/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app"
git add server/routes/itineraryApi.js
git commit -m "feat(itinerary): chat, poll, regenerate, pin routes"
```

---

### Task 17: Chat panel UI — 5 adaptive-card patterns

**Files:**
- Create: `public/assets/chat.js`
- Modify: `public/assets/itinerary.js` (import chat module, swap placeholder)
- Modify: `public/assets/styles.css` (chat panel styles)

**Interfaces:**
- Consumes: `state` (initial doc), updates from `POST /chat`.
- Produces: `initChat({ token, getState, onUpdate })` mounted in `#chat-pane`.

- [ ] **Step 1: Extend `public/assets/styles.css`**

Append:

```css
/* Chat pane */
.pane-chat { display: flex; flex-direction: column; }
.chat-header { padding: var(--s-3) var(--s-4) var(--s-2); border-bottom: 1px solid var(--racv-line); }
.chat-header h3 { margin: 0; color: var(--racv-ink); font-size: var(--fs-h3); }
.chat-header p { margin: 4px 0 0; color: var(--racv-muted); font-size: var(--fs-small); }

.chat-history { flex: 1; padding: var(--s-3); overflow-y: auto; display: flex; flex-direction: column; gap: var(--s-2); }
.chat-msg { max-width: 90%; padding: var(--s-2) var(--s-3); border-radius: var(--r-card); font-size: var(--fs-body); line-height: 1.4; }
.chat-msg.user      { background: var(--racv-blue); color: #fff; align-self: flex-end; border-top-right-radius: 4px; }
.chat-msg.assistant { background: var(--racv-tint); color: var(--racv-text); align-self: flex-start; border-top-left-radius: 4px; }
.chat-msg.typing    { color: var(--racv-muted); font-style: italic; }

.chat-controls { padding: var(--s-3); border-top: 1px solid var(--racv-line); background: var(--racv-card); }

/* Adaptive patterns */
.chips { display: flex; flex-wrap: wrap; gap: var(--s-2); margin-bottom: var(--s-3); }
.chip { background: transparent; border: 1px solid var(--racv-blue); color: var(--racv-blue); border-radius: var(--r-button); padding: 6px 12px; font-size: var(--fs-small); cursor: pointer; font-family: var(--font-brand); }
.chip:hover { background: var(--racv-yellow); border-color: var(--racv-yellow); color: var(--racv-ink); }

.radio-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: var(--s-2); margin-bottom: var(--s-3); }
.radio-tile { border: 2px solid var(--racv-line); border-radius: var(--r-card); padding: var(--s-3); text-align: center; cursor: pointer; }
.radio-tile.selected { border-color: var(--racv-blue); background: var(--racv-tint); }

.multi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: var(--s-2); margin-bottom: var(--s-3); }
.multi-tile { border: 1px solid var(--racv-line); border-radius: var(--r-card); padding: var(--s-2) var(--s-3); cursor: pointer; }
.multi-tile.selected { border-color: var(--racv-blue); background: var(--racv-tint); }

.form-grid { display: grid; gap: var(--s-3); margin-bottom: var(--s-3); }
.form-grid select { width: 100%; padding: 10px 12px; border: 1px solid var(--racv-line); border-radius: var(--r-input); background: #fff; font: var(--fs-body) var(--font-brand); }

.composer { display: flex; gap: var(--s-2); }
.composer textarea { flex: 1; resize: none; padding: 10px 12px; border: 1px solid var(--racv-line); border-radius: var(--r-input); font: var(--fs-body) var(--font-brand); }
.composer textarea:focus { outline: none; border-color: var(--racv-blue); box-shadow: 0 0 0 3px rgba(0,102,204,0.15); }
```

- [ ] **Step 2: Create `public/assets/chat.js`**

```js
let _token = null;
let _onUpdate = null;
const $pane = () => document.getElementById('chat-pane');

const FALLBACK_CHIPS = {
  type: 'chips',
  options: ['Add a dinner reservation', 'Swap an outdoor activity for indoor', 'I have dietary needs'],
};

let messages = [];
let lastUiHint = FALLBACK_CHIPS;

export function initChat({ token, onUpdate }) {
  _token = token;
  _onUpdate = onUpdate;
  render();
}

function render() {
  $pane().innerHTML = `
    <div class="chat-header">
      <h3>Refine your stay</h3>
      <p>Anything you'd like to add or swap?</p>
    </div>
    <div id="chat-history" class="chat-history"></div>
    <div class="chat-controls">
      <div id="adaptive"></div>
      <form id="composer" class="composer">
        <textarea id="composer-input" rows="2" placeholder="Tell me what you'd like…"></textarea>
        <button type="submit" class="btn btn-yellow" id="send">Send</button>
      </form>
    </div>`;
  renderAdaptive(lastUiHint);
  renderHistory();
  document.getElementById('composer').addEventListener('submit', onSubmit);
}

function renderHistory() {
  const el = document.getElementById('chat-history');
  el.innerHTML = messages.filter(m => m.role !== 'tool').map(m => {
    const text = typeof m.content === 'string'
      ? m.content
      : (m.content?.find?.(b => b.type === 'text')?.text ?? '');
    if (!text) return '';
    return `<div class="chat-msg ${m.role === 'user' ? 'user' : 'assistant'}">${escapeHtml(text)}</div>`;
  }).join('');
  el.scrollTop = el.scrollHeight;
}

function renderAdaptive(hint) {
  const el = document.getElementById('adaptive');
  if (!hint || hint.type === 'none') { el.innerHTML = ''; return; }
  switch (hint.type) {
    case 'chips':
      el.innerHTML = `<div class="chips">${(hint.options || []).map(o => `<button type="button" class="chip" data-chip="${escapeAttr(o)}">${escapeHtml(o)}</button>`).join('')}</div>`;
      el.querySelectorAll('.chip').forEach(b => b.addEventListener('click', () => sendText(b.dataset.chip)));
      break;
    case 'radio':
      el.innerHTML = `${hint.question ? `<p>${escapeHtml(hint.question)}</p>` : ''}<div class="radio-grid">${(hint.options || []).map(o => `<button type="button" class="radio-tile" data-id="${escapeAttr(o.id)}">${escapeHtml(o.label)}</button>`).join('')}</div>`;
      el.querySelectorAll('.radio-tile').forEach(b => b.addEventListener('click', () => sendText(`${hint.question || ''} ${b.dataset.id}`.trim())));
      break;
    case 'multi': {
      const selected = new Set();
      el.innerHTML = `${hint.question ? `<p>${escapeHtml(hint.question)}</p>` : ''}<div class="multi-grid">${(hint.options || []).map(o => `<button type="button" class="multi-tile" data-id="${escapeAttr(o.id)}">${escapeHtml(o.label)}</button>`).join('')}</div><button type="button" class="btn btn-yellow" id="multi-apply" style="margin-top:8px">Apply</button>`;
      el.querySelectorAll('.multi-tile').forEach(b => b.addEventListener('click', () => {
        if (selected.has(b.dataset.id)) { selected.delete(b.dataset.id); b.classList.remove('selected'); }
        else { selected.add(b.dataset.id); b.classList.add('selected'); }
      }));
      el.querySelector('#multi-apply').addEventListener('click', () => sendText(`${hint.question || 'Selected'}: ${[...selected].join(', ')}`));
      break;
    }
    case 'form': {
      el.innerHTML = `<div class="form-grid">${(hint.fields || []).map(f => `
        <div><label>${escapeHtml(f.label)}</label>
        <select data-field="${escapeAttr(f.id)}">
          ${(f.options || []).map(o => `<option value="${escapeAttr(o)}">${escapeHtml(o)}</option>`).join('')}
        </select></div>`).join('')}</div><button type="button" class="btn btn-yellow" id="form-apply" style="margin-top:8px">Apply</button>`;
      el.querySelector('#form-apply').addEventListener('click', () => {
        const payload = [...el.querySelectorAll('select')].map(s => `${s.dataset.field}=${s.value}`).join(', ');
        sendText(`Form: ${payload}`);
      });
      break;
    }
  }
}

async function onSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('composer-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  await sendText(text);
}

async function sendText(text) {
  messages.push({ role: 'user', content: text });
  renderHistory();
  // Typing indicator
  const histEl = document.getElementById('chat-history');
  const typing = document.createElement('div'); typing.className = 'chat-msg assistant typing'; typing.textContent = 'Thinking…';
  histEl.appendChild(typing); histEl.scrollTop = histEl.scrollHeight;
  try {
    const r = await fetch(`/api/itinerary/${_token}/chat`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    messages = data.messages || messages;
    // Inject the final reply as a clean assistant message for display
    messages.push({ role: 'assistant', content: data.reply || '' });
    lastUiHint = data.ui_hint || FALLBACK_CHIPS;
    typing.remove();
    renderHistory();
    renderAdaptive(lastUiHint);
    if (_onUpdate) _onUpdate({ version: data.version });
  } catch (err) {
    typing.remove();
    messages.push({ role: 'assistant', content: `⚠️ ${err.message}` });
    renderHistory();
  }
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}
function escapeAttr(s) { return escapeHtml(s).replace(/"/g, '&quot;'); }
```

- [ ] **Step 3: Wire `chat.js` from `itinerary.js`**

In `public/assets/itinerary.js`, replace the existing `renderChatPlaceholder()` with:

```js
async function renderChatPanel(initial) {
  const { initChat } = await import('./chat.js');
  const m = location.pathname.match(/^\/i\/([^/]+)/);
  if (!m) return;
  initChat({
    token: m[1],
    onUpdate: ({ version }) => refetchItinerary(version),
  });
}

async function refetchItinerary(sinceVersion) {
  const m = location.pathname.match(/^\/i\/([^/]+)/);
  if (!m) return;
  const token = m[1];
  // Try a few times — chat tools and DB write may not have fully landed.
  for (let attempt = 0; attempt < 3; attempt++) {
    const r = await fetch(`/api/itinerary/${token}?since=${(sinceVersion ?? 1) - 1}`);
    if (r.status === 204) { await new Promise(r2 => setTimeout(r2, 300)); continue; }
    if (r.ok) {
      const data = await r.json();
      if (data.itinerary && data.itinerary.days) {
        renderItinerary(data.itinerary);
        // Flash changed blocks (best effort — flash anything tagged data-block-id)
        document.querySelectorAll('[data-block-id]').forEach(b => b.classList.add('changed'));
        setTimeout(() => document.querySelectorAll('.changed').forEach(b => b.classList.remove('changed')), 1300);
        return;
      }
    }
    await new Promise(r2 => setTimeout(r2, 400));
  }
}
```

Then replace the call site near the bootstrap:

```js
renderChatPlaceholder();         // OLD
```

with:

```js
renderChatPanel(state);          // NEW
```

- [ ] **Step 4: Visual smoke**

Open `http://localhost:3000/i/<TOKEN>`. Confirm:
- Right pane has "Refine your stay" header + suggestion chips + textarea + yellow Send button.
- Clicking a chip submits it; assistant replies arrive.
- A mutation request (e.g. "swap dinner for pizza") causes the left pane to re-render with the changed block briefly highlighted.

- [ ] **Step 5: Commit**

```bash
cd "/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app"
git add public/assets/chat.js public/assets/itinerary.js public/assets/styles.css
git commit -m "feat(chat): adaptive cards panel (chips/radio/multi/form/text) + re-fetch wiring"
```

---

### Task 18: Inline block actions (Pin / Swap / Remove)

**Files:**
- Modify: `public/assets/itinerary.js` (wire `.actions button` clicks)

**Interfaces:**
- Consumes: existing `POST /api/itinerary/:token/chat` (for Swap/Remove via pre-formatted messages) and `POST /api/itinerary/:token/pin` (for Pin direct call).
- Produces: clickable block-level controls.

- [ ] **Step 1: Add a global click handler in `public/assets/itinerary.js`**

Append (after the existing functions, before any final `}` if module-scoped):

```js
$itin.addEventListener('click', async (e) => {
  const btn = e.target.closest('.actions button');
  if (!btn) return;
  const blockEl = btn.closest('[data-block-id]');
  const blockId = blockEl?.dataset.blockId;
  if (!blockId) return;
  const action = btn.dataset.action;
  const m = location.pathname.match(/^\/i\/([^/]+)/);
  if (!m) return;
  const token = m[1];

  try {
    if (action === 'pin') {
      const pinned = !blockEl.classList.contains('pinned');
      const r = await fetch(`/api/itinerary/${token}/pin`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ block_id: blockId, pinned }),
      });
      if (r.ok) {
        const data = await r.json();
        await refetchItinerary(data.version);
      }
    } else if (action === 'swap' || action === 'remove') {
      // Send a pre-formatted chat message; the agent will call swap_activity / remove_activity.
      const { initChat, sendFromInline } = await import('./chat.js').catch(() => ({}));
      const msg = action === 'swap'
        ? `Swap block ${blockId} for something different (preferably indoor if the weather is poor).`
        : `Remove block ${blockId}.`;
      // We don't have a public sendFromInline; the simplest path is to dispatch a custom event the chat module listens for.
      window.dispatchEvent(new CustomEvent('inline-action', { detail: { text: msg } }));
    }
  } catch (err) {
    console.error('inline action failed', err);
  }
});
```

- [ ] **Step 2: Listen for the event in `public/assets/chat.js`**

Add inside `initChat`:

```js
window.addEventListener('inline-action', (e) => {
  if (e.detail?.text) sendText(e.detail.text);
});
```

- [ ] **Step 3: Smoke**

Open the itinerary. Click `📌 Pin` on any block → it should toggle to `✕ Unpin` after the re-fetch. Click `↔ Swap` → the chat shows a "Swap block …" user message and the assistant should swap it, after which the block visibly changes.

- [ ] **Step 4: Commit**

```bash
cd "/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app"
git add public/assets/itinerary.js public/assets/chat.js
git commit -m "feat(ui): inline Pin/Swap/Remove on every block"
```

> **Phase 4 exit:** the full chat refinement loop works end-to-end. Members can chat, click adaptive cards, click inline block actions, and the itinerary updates with animated diffs. Both V1 chat UI (legacy at `/`) and V2 itinerary UI (at `/i/:token`) coexist.

---

## PHASE 5 — Cutover

Phase exit: legacy chat UI and `/api/chat` endpoint deleted; `/` serves the login page; documentation reflects the new entry flow only.

### Task 19: Replace `/` with login, remove legacy chat

**Files:**
- Modify: `server/index.js` (delete `/api/chat`, `handlers` block, related imports; mount login.html at `/`)
- Delete: `public/index.html`
- Delete: `server/systemPrompt.js`
- Modify: `HANDOVER.md` (replace §1, §2, §4–§7 with the V2 entry flow)
- Modify: `README.md` (replace the chat-only quick-start with the deep-link + login one)

**Interfaces:**
- Consumes: nothing new — the V2 routes from Phases 1–4 are unchanged.
- Produces: a single-entry app that no longer exposes the legacy chat surface.

> **Safety net:** all deletions in this task are reversible with `git revert <commit-sha>`. Do not also remove the legacy seed data, the existing Supabase tables, or the live-events pipeline — those are still used by V2.

- [ ] **Step 1: Make `/` serve the login page**

In `server/index.js`, find the existing `app.use(express.static(...))` line. Above it (so the route wins), add:

```js
app.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'login.html'));
});
```

If `path`/`fileURLToPath` aren't imported yet in this file, add them at the top:

```js
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname2 = path.dirname(fileURLToPath(import.meta.url));   // distinct from any earlier var
const PUBLIC_DIR = path.join(__dirname2, '..', 'public');
```

- [ ] **Step 2: Delete the legacy `/api/chat` route + handlers + agent loop**

Still in `server/index.js`:

- Remove the entire `app.post('/api/chat', …)` block (the existing legacy route).
- Remove the `runAgent(messages)` function.
- Remove the `TOOLS` array (the 5-tool definition that was passed to `/api/chat`) — **only** the legacy export. The new V2 chat agent has its own `CHAT_TOOLS` in `server/agent/chatTools.js`.
- Remove the `import { buildSystemPrompt } from './systemPrompt.js'` and the `const SYSTEM = buildSystemPrompt(...)` line.
- KEEP the `handlers` object (renamed to `TOOL_HANDLERS` in Task 15 Step 1) — it's still consumed by `chatAgent.js`. Keep the helper functions `resortBySlug`, `fetchWeather`, and the `WMO` table.
- KEEP all V2 mounts (`mountLoginRoute`, `mountItineraryApi`, `mountItineraryPage`).

- [ ] **Step 3: Delete legacy files**

```bash
cd "/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app"
git rm public/index.html server/systemPrompt.js
```

- [ ] **Step 4: Update HANDOVER.md**

Replace the existing top-section blocks (1 What this is, 2 Architecture, 4 Setup, 5 Primary task) with:

```markdown
# RACV Member Concierge — Engineering Handover (V2)

**Audience:** Claude Code (and any engineer) picking up this project.
**Status:** V2 — itinerary-first PoC. Members open a deep link, see an auto-generated personal itinerary, and refine it via an adaptive-card chat panel.

## 1. What this is

A five-star AI concierge that builds a personalised day-by-day stay itinerary for RACV resort members. Members enter via either:

1. A token deep link `/i/<token>` (one issued per booking; demo tokens were pre-issued in `db/v2_itineraries.sql`).
2. The login fallback at `/` (member number + surname) which 302s to the same `/i/<token>`.

The itinerary is generated once by GLM via Z.ai's Anthropic-compatible endpoint and stored as a JSON document. Chat refinement uses 12 tools (5 read-only + 7 mutation) to update the persisted doc; the frontend re-fetches after each turn.

## 2. Architecture

```
Browser
   │  GET /i/:token       (HTML shell + inlined itinerary JSON)
   │  POST /api/login     (member# + surname → token)
   │  POST /api/itinerary/:token/chat       (refinement loop, ui_hint)
   │  POST /api/itinerary/:token/generate   (build V1 on first visit)
   ▼
Express backend (server/)
   ├─ routes/             (login, itineraryPage, itineraryApi)
   ├─ itinerary/          (generator, mutator, schema, summarizer)
   ├─ agent/              (chatAgent, chatTools, systemPrompt)
   ├─ liveEvents/         (live event fetcher — unchanged from V1)
   ├─ Z.ai GLM            (anthropic-compatible endpoint)
   ├─ Supabase            (members, bookings, events, itineraries)
   └─ Open-Meteo          (weather)
```

## 3. Quick start

```bash
# Database (one-time):
# In Supabase SQL Editor, run db/schema.sql, db/seed.sql, db/seed_docs.sql, db/v2_itineraries.sql in order.

cd server
cp .env.example .env       # fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ZAI_API_KEY
npm install
npm start
# → http://localhost:3000

# Open the demo: log in as 100201 / Whitman → redirect to your itinerary.
```

(See SETUP.md for the full Supabase walkthrough including the V2 migration and the manual resort imagery step.)
```

- [ ] **Step 5: Update README.md**

Replace the quick-start section so it reflects deep-link entry rather than chat:

```markdown
# RACV Member Concierge — Proof of Concept (V2)

A standalone web app: members deep-link or log in, see a personalised day-by-day stay itinerary auto-built from their booking + preferences + weather + local events, and refine it via an adaptive-card chat panel.

## Quick start

1. **Supabase:** run `db/schema.sql`, `db/seed.sql`, `db/seed_docs.sql`, `db/v2_itineraries.sql` in the SQL Editor. (See SETUP.md.)
2. **Manual step:** save 10 resort hero images per SETUP.md §5.
3. **Config:** `cd server && cp .env.example .env`, then fill in your Supabase URL + service role key and Z.ai API key.
4. **Run:**
   ```bash
   cd server
   npm install
   npm start
   ```
5. Open **http://localhost:3000** and log in as **100201** / **Whitman** to see Eleanor's Torquay itinerary.

## How it works

- `/i/<token>` deep-links to a pre-generated itinerary per booking.
- `/` is the login fallback for members without a deep-link URL.
- The backend uses Z.ai's Anthropic-compatible endpoint (default `glm-4.7-flash`).
- The itinerary is a single JSON document mutated by 7 chat tools.

(Detailed architecture in HANDOVER.md.)
```

- [ ] **Step 6: Run tests + smoke**

```bash
cd "/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app/server"
npm test 2>&1 | tail -10
node --check index.js
```

Expected: `pass 63`. Syntax OK.

```bash
# Restart server (it was running the legacy code).
lsof -i :3000 -sTCP:LISTEN -P | awk '$2 ~ /^[0-9]+$/ {print $2}' | xargs -r kill
sleep 1
(cd "/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app/server" && nohup npm start > /tmp/racv-v2.log 2>&1 &)
sleep 3
curl -s http://localhost:3000/ | head -5
curl -sf -o /dev/null -w "GET /api/chat → %{http_code}\n" -X POST -H 'Content-Type: application/json' -d '{"messages":[{"role":"user","content":"hi"}]}' http://localhost:3000/api/chat
```

Expected: `GET /` returns the login HTML (look for `<title>Sign in — RACV Member Concierge</title>`). `POST /api/chat` returns 404 (route deleted).

- [ ] **Step 7: Commit**

```bash
cd "/Users/sam_hudson/Documents/Projects/Leisure Agent MVP/outputs/concierge-app"
git add server/index.js HANDOVER.md README.md
git status            # confirm public/index.html and server/systemPrompt.js show as deleted
git commit -m "feat(cutover): / → login, remove legacy /api/chat + chat UI"
```

> **Phase 5 exit:** V2 is the app. The repo no longer contains the chat-only UI or the legacy `/api/chat` route. README + HANDOVER reflect the new entry flow.

---

## Self-Review

After the plan was drafted, the following gaps were noticed and fixed inline:

1. **`server/package.json` test glob.** Phase 1 Task 6 Step 2 updates the `test` script to also pick up `itinerary/__tests__/*.test.js`. Phase 4 Task 15 Step 3 extends it again to include `agent/__tests__/*.test.js`. Without these, the new tests would silently not run.
2. **Token URL-safe normalisation.** Phase 1 Task 1's SQL uses standard `base64`. The login route returns `row.token` as-is; the page route looks up by `token` as-is. We do NOT URL-safe-encode on the server today — `+ / =` are not URL-safe but Express and browsers tolerate them in path segments. If demo URLs include any of those characters and a user re-types the URL by hand, treat that as the known limitation. If it bites, the fix is a single normalisation pass at the `WHERE token = ?` site.
3. **Inline `Swap` / `Remove` block actions** use the chat agent rather than calling mutator routes directly. Phase 4 Task 18 implements this via a custom DOM event so chat panel and itinerary panel stay decoupled.
4. **`regenerate_day`** is unit-tested via the chat agent's tests rather than its own; testing it standalone would require a GLM mock too heavy for the value.
5. **Resort hero images** depend on the human manual step from Phase 2 Task 8. The frontend gracefully hides the `<img>` on load error, so Phases 3 and 4 still demo without all 10 JPGs in place.
6. **Long-stay rendering** isn't covered by seed data; Phase 3 Task 13 includes a note that smoking the long-stay path requires manually editing a booking's check-out date.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-23-v2-itinerary-first.md`.

Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh implementer subagent per task, review between tasks (spec compliance + quality), fast iteration. Reviewer catches regressions immediately. Total ~19 implementer dispatches + 19 reviewer dispatches + occasional fix dispatches.

**2. Inline Execution** — Execute tasks in this session using `superpowers:executing-plans`, batch execution with checkpoints for review. I implement directly; you review at phase boundaries.

Which approach?

