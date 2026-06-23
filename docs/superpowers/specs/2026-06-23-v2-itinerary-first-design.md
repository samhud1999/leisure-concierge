# RACV Concierge V2 — Itinerary-First Design

**Status:** approved 2026-06-23 (brainstorm), pending implementation plan
**Author:** brainstorm session with user
**Supersedes:** the chat-only V1 (current `public/index.html`)

---

## 1. Goal

Pivot from a chat-only UI to an **itinerary-first interactive HTML artifact**. A member deep-links to their stay; the page shows an auto-generated day-by-day plan immediately; a chat panel sits alongside it for refinement via adaptive cards, form fields, and free text.

The chat is no longer the product. The itinerary is. The chat is positioned as "add to your stay."

## 2. Non-goals (YAGNI)

- Multi-user / household editing (one member, one booking, one itinerary).
- Push notifications, email digests, calendar export.
- Authenticated SSO with RACV's real identity system — token-based deep-link + light surname-gated fallback only.
- Persistent chat transcript across sessions — chat is ephemeral per turn.
- Internationalisation / multi-language.
- A11y certification beyond Lighthouse a11y ≥ 95 spot-check.
- Real-time multi-tab sync of itinerary state (last write wins).

## 3. End-to-end UX flow

```
┌────────────────────┐   ┌────────────────────┐   ┌────────────────────┐
│  Token deep link   │   │  Login fallback    │   │  Returning visit   │
│  /i/<token>        │   │  /                 │   │  /i/<token>        │
└─────────┬──────────┘   └─────────┬──────────┘   └─────────┬──────────┘
          │                        │                        │
          │                        ▼                        │
          │              ┌───────────────────┐              │
          │              │ Login card        │              │
          │              │ Member # _______  │              │
          │              │ Surname  _______  │              │
          │              │ [ Log in ] ←yellow│              │
          │              └─────────┬─────────┘              │
          │                        │ ←token issued          │
          ▼                        ▼                        ▼
┌────────────────────────────────────────────────────┐ ┌────────────┐
│  /i/<token>  — server lookup                       │ │ Cached     │
│  Has cached itinerary? ──no──▶  V1 generator       │ │ itinerary  │
│                                 (GLM 30–60s)       │ │ instant    │
│                                  + save            │ │            │
│                          ──yes─▶  serve cached     │ │            │
└──────────────────────────┬─────────────────────────┘ └─────┬──────┘
                           ▼                                 ▼
                   ┌───────────────────────────────────────────────┐
                   │            Itinerary view (split)             │
                   └───────────────────────────────────────────────┘
```

**Three entry paths**, all converging on the same itinerary view:
- **Primary**: token URL `/i/<token>` — no auth screen, click-and-view. Token is pre-issued per booking (see §4).
- **Fallback**: `/` shows a login card (member number + surname). On match, the server looks up the token and 302s to `/i/<token>`. Bookmark-friendly thereafter.
- **Returning visit**: same `/i/<token>` URL hits the cached itinerary instantly.

**Layout (desktop ≥ 1024px):** persistent split — itinerary on the left ~60%, chat panel on the right ~40%. Both panes always visible.

**Layout (mobile < 768px):** stacks vertically as two tabs (`Itinerary` / `Chat`) plus a floating yellow `+` button at bottom-right that opens chat as a bottom sheet.

**First-visit loading state** — branded skeleton, not a generic spinner. The page renders a **client-side fake-progress animation** (the four steps tick on canned timers, not real server events): pulling booking → checking weather → finding experiences → building plan. The shell's only real server interaction is the `POST /generate` request that returns when the build is done. SSE is explicitly deferred (see §12) so the checklist is illustrative, not real-time. The shell shows "~30–60 seconds. Hold tight; we only do this once."

## 4. Itinerary data model

Single JSON document per booking, stored server-side, mutated by chat tools.

```jsonc
{
  "version": 4,                              // bumps on every mutation
  "updated_at": "2026-06-23T10:25:00Z",
  "booking_id": "RACV-TQ-3001",
  "token": "abc123xyz",                      // same as deep-link URL

  "member": {
    "first_name": "Eleanor",
    "member_number": "100201"                // surname/email/phone NEVER stored here
  },

  "stay": {
    "check_in":  "2026-06-25",
    "check_out": "2026-06-28",
    "nights": 3,
    "room_type": "Suite",
    "party_size": 2,
    "add_ons": ["One Spa package"]
  },

  "resort": {
    "slug": "torquay",
    "name": "RACV Torquay Resort",
    "town": "Torquay",
    "region": "Great Ocean Road",
    "hero_image": "/img/resorts/torquay.jpg",
    "summary": "Cliff-top resort on the Surf Coast…"
  },

  "preferences": {
    "party_kind": "couple",                  // couple | family | friends | solo
    "dietary":    null,                      // null | vegetarian | vegan | gluten-free | <free text>
    "pace":       "relaxed",                 // relaxed | balanced | active
    "interests":  ["coastal walks", "good food", "spa"]
  },

  "summary": {
    "highlights": [
      "2 spa treatments",
      "1 farmers market · Sat 28",
      "Mostly fair weather"
    ]
  },

  "days": [
    {
      "id":    "day-1",                      // stable IDs survive mutations
      "date":  "2026-06-25",
      "label": "Thu 25 Jun",
      "weather": {
        "condition":   "Partly cloudy",
        "temp_max_c":  18,
        "temp_min_c":  11,
        "precip_pct":  30
      },
      "blocks": [
        {
          "id":          "blk-101",
          "kind":        "arrival",          // arrival | dining | activity | spa | event | departure | free
          "time_of_day": "afternoon",        // morning | midday | afternoon | evening
          "icon":        "🛬",
          "title":       "Arrival & check-in",
          "description": "Settle into your Suite with a free-standing spa bath.",
          "venue":       null,
          "source_url":  null,
          "pinned":      false                // user-pinned blocks resist regenerate
        }
      ]
    }
  ]
}
```

### Stable IDs

- Days: `day-1`, `day-2`, … `day-N` where N = `nights + 1`.
- Blocks: `blk-NNN`, monotonically increasing per booking, never reused even after `remove_activity`.

### Why a single JSON doc, not normalised tables

- Mutations are whole-doc-atomic.
- Queries are always "give me the whole thing."
- Per-booking concurrency is essentially zero (one member editing one stay).
- Storing as `jsonb` in Supabase lets us evolve the schema without a migration per field.

### What the GLM generates vs. what the server assembles

The V1 generator (§8) returns only **three top-level fields**: `preferences`, `summary`, `days`. The server is responsible for the remaining wrapper fields. The flow is:

1. GLM returns `{ preferences, summary, days }` only.
2. `generator.js` validates that subset via `schema.js`.
3. `generator.js` then **merges** server-side fields on top: `version: 1`, `updated_at: now()`, `booking_id`, `token`, `member`, `stay`, `resort`. None of those come from the model.
4. The merged whole doc is what gets written to `itineraries.doc`.

`schema.js` exposes two validators: `validateGenerated(partial)` for the GLM-returned subset, and `validateFull(doc)` for the merged whole doc. Mutations (which operate on the persisted whole doc) use `validateFull`.

### Weather field naming

The persisted itinerary uses `precip_pct` (and `temp_max_c` / `temp_min_c` / `condition`) on each day's `weather` block. The upstream Open-Meteo response — and the existing `fetchWeather()` in `server/index.js` — returns `precipitation_chance_pct`, `precipitation_sum`, `temperature_2m_max`, `temperature_2m_min`, `weather_code`. The generator's input bundle MUST map these to the persisted names **before** passing them to GLM, so the system prompt rule "if `weather.days[i].precip_pct > 60` …" reads the right field. The mapping (in `generator.js`):

```
condition   ← WMO[weather_code]
temp_max_c  ← temperature_2m_max
temp_min_c  ← temperature_2m_min
precip_pct  ← precipitation_chance_pct
precip_mm   ← precipitation_sum
```

The mapping is one-way at generation time; nothing else in the codebase needs to know about Open-Meteo's field names.

### Sensitive fields stay out

`surname`, `email`, `phone`, `member_id_number`, `other_guest_names` are **never** copied into the itinerary doc. They live only in the `members` table behind the safe-column whitelist. A leaked itinerary JSON cannot reveal them.

## 5. Backend

### Routes

```
GET   /                                Login page (HTML shell)
POST  /api/login                       { member_number, surname }
                                       → { token } or 401
GET   /i/:token                        Itinerary page (HTML shell)
                                       Inline <script id="state"> contains
                                       current itinerary JSON; if no cached
                                       doc yet, contains the loading shell
POST  /api/itinerary/:token/generate   Build V1 (first-visit slow path)
                                       Idempotent: returns cached if built
GET   /api/itinerary/:token?since=N    Poll/refresh — 204 if version ≤ N,
                                       200 + { itinerary } if newer
POST  /api/itinerary/:token/chat       { messages: [...] } → runs agent
                                       loop with mutation tools
                                       → { reply, messages, version }
POST  /api/itinerary/:token/regenerate Full GLM regenerate (button)
                                       Respects pinned blocks
GET   /api/health                      (existing)
```

### V1 generation sequence

```
Browser              Express             Supabase          GLM (Z.ai)
   │                    │                   │                  │
   │  GET /i/abc123     │                   │                  │
   ├───────────────────▶│                   │                  │
   │                    │  lookup token     │                  │
   │                    ├──────────────────▶│                  │
   │                    │◀───── member,     │                  │
   │                    │       booking,    │                  │
   │                    │       no doc      │                  │
   │  loading shell     │                   │                  │
   │  + JS that calls   │                   │                  │
   │  /generate         │                   │                  │
   │◀───────────────────┤                   │                  │
   │  POST /generate    │                   │                  │
   ├───────────────────▶│                   │                  │
   │                    │  resort_knowledge,│                  │
   │                    │  events, weather  │                  │
   │                    ├──────────────────▶│                  │
   │                    │◀──────────────────┤                  │
   │                    │  ONE GLM call:                       │
   │                    │  "build full itinerary JSON"         │
   │                    ├─────────────────────────────────────▶│
   │                    │            30–60s                    │
   │                    │◀─────────────────────────────────────┤
   │                    │  parse + validate                    │
   │                    │  save, version=1                     │
   │  { itinerary }     │                                      │
   │◀───────────────────┤                                      │
   │  render days       │                                      │
```

### Chat refinement sequence

```
Browser              Express                              GLM
   │                    │                                  │
   │  POST /chat        │                                  │
   ├───────────────────▶│                                  │
   │                    │  load current itinerary JSON     │
   │                    │  build system prompt:            │
   │                    │  "{current itinerary} +          │
   │                    │   user said {msg}"               │
   │                    │  + tools: add/swap/remove/...    │
   │                    ├─────────────────────────────────▶│
   │                    │◀─── tool_use: swap_activity      │
   │                    │     apply mutation, bump version │
   │                    ├─────────────────────────────────▶│
   │                    │◀─── final text response          │
   │  { reply,version } │                                  │
   │◀───────────────────┤                                  │
   │  GET /api/         │                                  │
   │  itinerary/:token? │                                  │
   │  since=<prev>      │                                  │
   ├───────────────────▶│                                  │
   │  { itinerary }     │                                  │
   │◀───────────────────┤                                  │
   │  re-render days    │                                  │
```

### Storage migration

```sql
CREATE TABLE itineraries (
  booking_id   text PRIMARY KEY REFERENCES bookings(confirmation_code),
  token        text UNIQUE NOT NULL,
  member_id    bigint NOT NULL REFERENCES members(id),
  doc          jsonb NOT NULL,                  -- '{}'::jsonb until status='ready'
  version      int   NOT NULL DEFAULT 1,
  status       text  NOT NULL DEFAULT 'pending', -- pending|ready|generation_failed
  last_error   text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX itineraries_token_idx ON itineraries(token);

-- Pre-issue tokens for every seed booking (demo convenience)
INSERT INTO itineraries (booking_id, token, member_id, doc)
SELECT confirmation_code,
       encode(gen_random_bytes(9), 'base64url'),  -- 12-char URL-safe
       member_id,
       '{}'::jsonb
FROM bookings;
```

### Cache-hit condition

A cached itinerary exists when `status = 'ready'`. The `GET /i/:token` handler reads `status`:

- `ready` → inline the full `doc` JSON as `<script id="state" type="application/json">` and render the itinerary page.
- `pending` or `generation_failed` → inline `{ "status": "pending" }` (or `"generation_failed"`) and render the loading shell. The shell's JS then fires `POST /generate` (for `pending`) or shows a "Try again" CTA wired to `POST /generate` (for `generation_failed`).

### Module structure

```
server/
├─ index.js                      thin router
├─ routes/
│  ├─ login.js                   POST /api/login
│  ├─ itineraryPage.js           GET / and GET /i/:token
│  └─ itineraryApi.js            /generate, /chat, /regenerate, poll
├─ itinerary/
│  ├─ generator.js               V1 build: one GLM call → JSON
│  ├─ mutator.js                 add/swap/remove/reorder/pin/preference
│  ├─ schema.js                  validateGenerated + validateFull + soft repairs
│  └─ summarizer.js              regenerates summary.highlights after mutations
├─ agent/
│  ├─ chatAgent.js               refinement loop with mutation tools
│  ├─ chatTools.js               7 mutation tools as Anthropic tool defs
│  └─ systemPrompt.js            NEW file — V2 chat persona, see note below
└─ liveEvents/...                (existing, unchanged)
```

**File-name collision avoided:** the existing `server/systemPrompt.js` (used by the legacy `/api/chat` route) is **not moved**. It stays at `server/systemPrompt.js` and is removed only at Phase 5 cutover. The new V2 chat prompt lives at `server/agent/systemPrompt.js` — a distinct file. Both coexist through Phases 1–4. Existing imports in `server/index.js` are untouched until Phase 5.

**No itineraries-table column whitelist needed.** `itineraries.doc` is selected in full on every read. This is safe because `generator.js` excludes sensitive fields (surname, email, phone, member_id_number, other_guest_names) when assembling the wrapper (§4 "Sensitive fields stay out"). The whitelist discipline applies at write time, not read time, so the existing `MEMBER_SAFE` / `BOOKING_SAFE` constants do not need an `ITINERARY_SAFE` counterpart.

### `chatTools.js` and `anthropic.messages.create()`

The 7 mutation tools defined in `chatTools.js` are passed to `anthropic.messages.create()` **alongside** the 5 existing read-only tools, in a single combined `tools: [...]` array — for a total of 12 tools per chat-refinement call. The agent decides which to use per turn.

### Token format & lifecycle

- 12-char URL-safe random (`gen_random_bytes(9)` base64url-encoded).
- **No expiry** for the PoC. Treat each token as effectively a credential to that single itinerary.
- Tokens are pre-issued for every seed booking so demo URLs work immediately.
- Login fallback **finds** an existing token, never issues a new one.

### Backward compatibility during build

- Current chat UI at `/` and current `/api/chat` route remain mounted through phases 1–4 (see §10).
- Phase 5 is the only breaking commit: `/` replaced by login, `/api/chat` removed.

## 6. Frontend components + brand spec

### Brand spec (replaces current `DESIGN_NOTES.md` palette)

The current spec used the muted nav blues we extracted from RACV's CSS bundle. The reference images make clear the real brand is **vivid royal blue + bold yellow CTAs**.

```
Token              Hex       Use
───────────────────────────────────────────────────────────
--racv-blue        #0066CC   Primary brand: logo, headings, links
--racv-blue-2      #004E9E   Hover/active
--racv-yellow      #FFD600   CTA fill, journey-line, focus ring
--racv-yellow-2    #E6C100   Hover for yellow CTAs
--racv-ink         #0A2E5C   Body headings (deep navy)
--racv-text        #1A2B4A   Body copy
--racv-muted       #6B7589   Meta, captions, weather sub-label
--racv-line        #E0E5EF   Dividers, card borders
--racv-bg          #F4F6FA   Page background
--racv-card        #FFFFFF   Card surface
--racv-tint        #EAF1FB   Selected/hover tile tint

Type:    Poppins (kept) — 400/500/600/700
         fs-h1 50 / fs-h2 30 / fs-h3 20 / fs-body 15 / fs-small 12.5

Shape:   Buttons: 999px (PILL, not square)
         Cards:   12px
         Inputs:   8px
         Days:    16px
```

### Assets to add under `public/img/`

- `racv-logo.svg` — **overwrites** the existing stub at `public/img/racv-logo.svg` from the V1 reskin. Real italic RACV wordmark + yellow journey stripes underneath. Either extracted from the reference PNG's vector source or hand-recreated as SVG (the PNG is rasterised; SVG recreation is the only crisp path).
- `journey-curve.svg` — the yellow curving line graphic. Decorative band, 1200×60.
- `resorts/<slug>.jpg` — one hero per resort × 10, fetched from `racv.com.au/travel-experiences/resorts.html`. **Manual step** because the source page is JS-rendered: document under a new `## 5. Resort imagery` heading in `SETUP.md`, listing the 10 slugs, the canonical source URL per resort, and credits.

### Component inventory

- **Day header** (collapsed vs expanded): one-line summary with date + weather + activity count, click to expand.
- **Activity block card**: kind-coloured left bar (arrival navy / dining warm / activity yellow / spa purple / event blue / departure grey / free neutral), icon, title, description, time_of_day pill, inline action buttons (`[📌 Pin]` `[↔ Swap]` `[✕ Remove]`).
- **Resort hero band**: full-width image (~200px tall) under the page header with navy gradient overlay + stay summary text overlaid.
- **Weather pill**: inline icon + temp + condition + precip%, sits in the day header.
- **Yellow pill button**: `999px` radius, `#FFD600` fill, navy text, hover `#E6C100`.
- **Form input**: 8px radius, light grey-blue fill, navy focus ring.
- **Suggestion chip**: outlined pill, yellow on hover/focus, navy text.
- **Logo + journey-curve**: paired in headers on login and itinerary pages.
- **Loading skeleton**: shimmer bars with progressive task checklist.

### Chat panel patterns (amendment #3)

Five interaction patterns, the agent picks per turn via `ui_hint`:

1. **Suggestion chips** (default) — 3–6 contextual one-tap responses + free text.
2. **Radio cards** — single-choice tiles for questions like "What's the party makeup?"
3. **Multi-select tiles** — many-of-many for preferences/interests.
4. **Structured form** — multi-field for things like dietary + allergies.
5. **Free text** — always present at the bottom of the panel.

The agent's final response is JSON:
```jsonc
{ "reply": "<≤200 chars conversational text>",
  "ui_hint": { "type": "chips"|"radio"|"multi"|"form"|"none", ... } }
```

Frontend renders the corresponding control above the free-text box. Falls back to chips with a fixed default set if `ui_hint` is absent or `none`.

### Per-block inline actions

`Pin` / `Swap` / `Remove` are inline buttons on every block (except `pinned` blocks, which hide `Swap`). Swap and Remove send a pre-formatted message to the chat agent (e.g. `"swap block blk-104 for something indoor"` or `"remove blk-106"`); the agent calls `swap_activity` / `remove_activity` accordingly and replies in chat. Pin is a direct `POST /api/itinerary/:token/chat`-style API call that bypasses the agent and hits `pin_block` directly (no GLM round-trip required for a boolean toggle). Acceptance: each inline action results in a visible itinerary update within one chat turn or one direct round-trip.

### Tech choice

**Vanilla JS, no framework.** State management is minimal: load JSON → render days → re-fetch on chat reply → re-render. One CSS file structured with comment sections. ~300 lines of JS total. Keeps the single-file ethos of the existing project and avoids a build step.

### Mobile

`< 768px` switches to two tabs (`Itinerary` / `Chat`) plus a floating yellow `+` button bottom-right that opens chat as a bottom sheet. Mirrors the reference RACV Assistant pattern.

## 7. Variable-stay handling

Same data model, same components, different defaults at render time:

```
                    SHORT          STANDARD          LONG
                    1–3 nights     4–6 nights        7+ nights
─────────────────────────────────────────────────────────────────────
Days expanded       ALL            Today + tomorrow  Today only
  by default                       (rest collapsed)  (rest collapsed)

Activities/day      2–4            2–3               1–2 + free time
  (generator        (compact,      (paced)           (breathing room)
   target)          scenic)

Sticky day nav      hidden         hidden            VISIBLE (left rail)

Section grouping    none           none              Week 1 / Week 2 / …

Top summary         3 bullets      4 bullets         compact one-liner
                                                     + trip stats tiles

Free / rest days    never          1 if 6 nights     1 every ~3 days
```

### Generator rules baked into the V1 prompt

- Day count = `nights + 1` (one entry per night + departure day).
- First day's first block: `kind="arrival"`.
- Last day's last block: `kind="departure"`.
- Activities per day: per the table above.
- Outdoor blocks avoid days where `weather.precip_pct > 60` or `precipitation_mm > 5`.
- If `add_ons` mentions a spa package, distribute 1–2 spa blocks on fair-weather days.
- If events overlap the stay window, surface 1–2 most relevant as `kind="event"`.
- Prefer the resort's own dining/experiences first; off-resort outings as overflow.

## 8. V1 generator + chat refinement

### V1 generator (`server/itinerary/generator.js`)

One big GLM call with all context pre-loaded into the system prompt. No tool loop. This is the slowest single step (~30–60s on `glm-4.7-flash`); everything afterwards is fast incremental mutations.

**Generator input bundle** (server pre-fetches before the GLM call):
- `member` (first_name only)
- `booking` (dates, room_type, party_size, add_ons, confirmation_code)
- `resort` (name, town, region, slug, amenities, dining, experiences, room_types, local_guides)
- `events` (filtered to the stay window, seed + live merged)
- `weather` (daily forecast for the stay window)
- `preferences: null` (V1 has none yet — chat fills these in)

**System prompt skeleton:**

```
You are RACV's concierge generating a member's day-by-day stay itinerary.

You will receive a JSON brief with the member, booking, resort knowledge,
local events, and a weather forecast. Output ONE JSON object matching the
schema below — nothing else. No prose, no markdown, no fenced code blocks.

SCHEMA — return exactly these top-level fields:
{
  "preferences": { party_kind, dietary, pace, interests },
  "summary":     { highlights: [string, …] },
  "days":        [ { id, date, label, weather, blocks: [...] } ]
}

RULES (hard):
- One day per night + one for the departure day.
- First day's first block: kind="arrival".
- Last day's last block: kind="departure".
- Blocks per day:
    nights <= 3  →  2-4 blocks, NO rest/free days
    nights 4-6   →  2-3 blocks, one rest day if 6
    nights >= 7  →  1-2 blocks, rest day every ~3 days
- If weather.days[i].precip_pct > 60 OR precip_mm > 5, no outdoor
  blocks that day — pick indoor (spa, dining, indoor amenity) or sheltered
  events.
- If booking.add_ons mentions a spa package, schedule 1-2 spa blocks on
  fair-weather days.
- If events[] overlaps the stay window, surface the most relevant 1-2 as
  blocks with kind="event" — prefer Saturday markets, music, family.
- Stable IDs: days "day-1"…"day-N", blocks "blk-101"…"blk-NNN".
- Default preferences (V1 has none yet): party_kind inferred from
  party_size (1=solo, 2=couple, 3-4=family if add_ons includes child or
  party_composition includes child, else friends), dietary=null,
  pace="balanced", interests=[].

RULES (soft, in priority order):
- Match the resort's vibe — coastal walks at coastal resorts, golf at golf
  resorts, vineyards at Healesville, etc.
- Personalise to the resort's own dining + experiences first; only suggest
  off-resort outings if the resort's offerings are exhausted.
- Lean on real local_guides text for descriptive copy.
- Each block.description: ≤140 chars. Each title: ≤40 chars.

TONE: warm, restrained, like a five-star concierge. No emojis in text
fields; the `icon` field carries the visual marker.

Return ONLY the JSON. No prefatory text. No closing remarks.
```

### Validation (`server/itinerary/schema.js`)

Lightweight inline validator — no `ajv` dependency. Returns `{ ok, doc, errors[] }`.

Checks:
- Top-level shape: `preferences`, `summary`, `days` present and correct types.
- `days.length === nights + 1`.
- `days[0].date === booking.check_in`, `days[N].date === booking.check_out`.
- Every block has `id`, `kind ∈ enum`, `time_of_day ∈ enum`, `title` (≤40), `description` (≤140).
- IDs are unique within the doc.

Soft repairs (applied automatically, no retry):
- Missing `icon` → derive from `kind`.
- Missing `weather` → copy from input bundle.
- `block.kind` missing → default `"activity"`.
- `description` too long → truncate at 140 with ellipsis.

### Failure handling — three layers

**Layer 1: GLM returns malformed JSON.** Strip ` ```json ` fences and retry parse. If still fails, one retry with explicit prompt enumerating the failure ("Your last response was not valid JSON. Return only the JSON object starting with `{`. No prose, no code fences."). If still fails, return 502 with `error_code="generator_unparseable"`. Frontend renders an error card with a "Try again" button.

**Layer 2: JSON parses but fails validation.** Apply soft repairs. If hard errors remain (wrong day count, missing required field), one retry with explicit prompt enumerating the errors. Persist only on validation pass.

**Layer 3: GLM API errors / timeout.** 90s hard timeout on the generator call. On timeout/5xx, write a row with `status="generation_failed"` and `last_error` populated. Frontend renders a clear retry CTA.

### Chat refinement (`server/agent/chatAgent.js`)

Existing tool-loop pattern. Twelve tools total:

- **5 read-only** (existing): `member_lookup`, `get_booking`, `get_resort_knowledge`, `get_events`, `get_weather`.
- **7 mutation** (new):

```
add_activity({ day_id, time_of_day, kind, title, description?, venue?, source_url? })
    → returns { block_id, version }
swap_activity({ block_id, replacement: { kind, title, description?, venue?, source_url? } })
    → returns { block_id, version }
remove_activity({ block_id })
    → returns { version }
reorder_day({ day_id, block_ids: [<new order>] })
    → returns { version }
set_preference({ key, value })
    → returns { version }                       // mutator does NOT auto-regenerate
regenerate_day({ day_id, reason })
    → returns { version, days: [day_id] }      // GLM rewrites ONE day, respects pinned blocks
pin_block({ block_id, pinned: true|false })
    → returns { version }
```

**`set_preference` ownership.** The mutator only writes the new value; it does NOT auto-trigger `regenerate_day`. The chat agent is responsible for calling `regenerate_day` itself when a changed preference (typically `dietary`, `pace`, or `interests`) materially affects existing block choices. The system prompt instructs the agent to do this; the mutator side never side-effects.

**`regenerate_day` prompt contract.** The handler in `mutator.js` calls GLM with a focused prompt:

```
You are RACV's concierge regenerating ONE day of an existing itinerary.

CURRENT ITINERARY (full JSON):
<inserted>

DAY TO REGENERATE: <day_id>
REASON: <reason>

CONSTRAINTS:
- Return ONLY the regenerated day as JSON matching the shape:
  { "day": { "id": "<day_id>", "date": "...", "label": "...",
             "weather": { ... }, "blocks": [ { ... } ] } }
- Preserve every block in the input day whose `pinned` field is true,
  unchanged, in its current position. They are immovable.
- Honour the same hard/soft rules from the V1 generator (activity count
  per stay-length bucket, weather steering, etc.).
- Stable block IDs: reuse the IDs of pinned blocks; mint new IDs
  (blk-NNN, incrementing past the current max) for new blocks.

Return ONLY the JSON. No prose.
```

The handler validates against `validateGenerated` scoped to the single day, splices it into the persisted doc, bumps `version`, and returns `{ version, days: [day_id] }`. Same three-layer failure handling as V1 (parse retry, validation retry, 502).

**Chat system prompt:**

```
You are RACV's concierge refining the member's existing stay itinerary.

CURRENT ITINERARY (full JSON):
<inserted>

The member said: <message>

You may:
- Use read-only tools (get_events, get_weather, …) to look something up.
- Use mutation tools (add_activity, swap_activity, remove_activity, …) to
  update the itinerary.
- Set the ui_hint field in your final response to guide the chat panel.

Final response MUST be JSON:
{ "reply": "<short conversational text, ≤200 chars>",
  "ui_hint": { "type": "chips"|"radio"|"multi"|"form"|"none", ... } }

Do NOT regenerate the whole itinerary. Make the smallest change that
satisfies the request. Respect pinned blocks — refuse to swap or remove
them; surface them in your reply instead.
```

### `ui_hint` payloads

```jsonc
// chips — show 3-6 follow-up suggestions
{ "type":"chips",
  "options":["Add a family activity", "Move dinner earlier", "Show me a quieter day"] }

// radio — single choice
{ "type":"radio",
  "question":"What's the party makeup?",
  "options":[{"id":"couple","label":"Couple"},{"id":"family","label":"Family"}] }

// multi — many-of-many
{ "type":"multi",
  "question":"Pick your interests",
  "options":[{"id":"walks","label":"Coastal walks"},{"id":"food","label":"Food & wine"}] }

// form — multiple fields
{ "type":"form",
  "fields":[{"id":"dietary","label":"Dietary needs","kind":"select",
    "options":["None","Vegetarian","Vegan","Gluten-free"]}] }

// none — free text only
{ "type":"none" }
```

## 9. Security model

Unchanged from V1 — every guarantee carries forward.

- Supabase service role key stays server-side.
- Tool handlers (read AND mutation) select only itinerary-safe columns; sensitive fields (`email`, `phone`, `member_id_number`, `other_guest_names`, `surname`) are never returned to clients.
- Mutation tools validate that `block_id` and `day_id` belong to the itinerary identified by the URL token; cross-itinerary mutation attempts return 403.
- Itinerary tokens are credentials; treat each as effectively password-equivalent. Anyone with the URL can read and modify that one itinerary.
- The login fallback enforces `member_number` + `surname` exact match (case-insensitive on surname). No partial match, no candidate disclosure on miss.
- `/api/chat` (the legacy chat endpoint) is removed at Phase 5; until then it retains its existing security model.
- No rate limit yet — deferred to §12.

## 10. Build phasing + cutover plan

Total work estimate: 14–18 tasks across 5 phases. Each phase ends in a working app — you can stop at any phase boundary and demo what you have.

### Phase 1 — Foundations (no user-visible change)
1. `db/v2_itineraries.sql` + seed pre-issued tokens.
2. `server/itinerary/schema.js` (validateGenerated + validateFull + soft repairs) + tests.
3. `server/itinerary/summarizer.js` (regenerates `summary.highlights` from `days[]`) + tests.
4. `server/itinerary/generator.js` — V1 builder + weather-field mapping + validator wiring.
5. `POST /api/itinerary/:token/generate` route + tests.
6. CLI smoke test: pre-generate one itinerary for `100201` / `Whitman` and snapshot the JSON for human inspection.

**Exit criterion:** backend can build and persist itineraries; no UI yet.

### Phase 2 — Brand spec refresh + assets
7. Real RACV palette + journey curve SVG + recreated logo SVG. **Overwrite** the Palette and Components sections of `DESIGN_NOTES.md` with the V2 token table from §6 of this spec — explicitly delete the old `--racv-navy`/`--racv-accent` rows and the `border-radius: 0` button note, which are superseded.
8. **[Manual step — human required]** Fetch 10 resort hero images from racv.com.au into `public/img/resorts/<slug>.jpg`; record sources + credits under a new `## 5. Resort imagery` heading in `SETUP.md`. This is a prerequisite for Phase 3 visuals, not an automatable task.
9. Refit existing chat UI (`public/index.html`) to the new palette — small confidence check before building V2 pages.

**Exit criterion:** brand is correct; chat UI still functional, now on brand.

### Phase 3 — V2 frontend (read-only)
10. `public/login.html` + `POST /api/login` route.
11. `public/itinerary.html` shell + `GET /i/:token` route.
12. Frontend modules: day rendering, block cards, weather pill, collapsible behaviour, sticky day nav, week grouping.
13. Loading skeleton + client-side fake-progress task-checklist animation.

**Exit criterion:** members can deep-link, see auto-generated itinerary, but cannot yet refine via chat. **Shippable state for a first demo.**

### Phase 4 — Chat refinement
14. `server/itinerary/mutator.js` — 7 mutation operations + tests.
15. `server/agent/chatAgent.js` + `chatTools.js` + new `server/agent/systemPrompt.js` — refinement loop with mutation tools + `ui_hint` contract.
16. `POST /api/itinerary/:token/chat` + GET poll route.
17. Chat panel UI: chips, radio, multi, form, free text — five interaction patterns.
18. Wire chat → re-fetch → re-render flow with animated diff (briefly highlight changed blocks via a CSS `background-color` transition on re-render; no DOM-morphing library required).

**Exit criterion:** members can deep-link, refine via chat or forms, see live updates. Both UIs (V1 chat + V2) coexist on the server.

### Phase 5 — Cutover
19. Replace `/` route with login page (was chat-only UI). Remove `/api/chat`, `server/systemPrompt.js`, and the old chat UI HTML. Update HANDOVER / README to describe new entry flow only.

**Exit criterion:** old chat UI removed. V2 is the app.

### Backward compatibility during build

- The current `/` chat UI stays at `/` through phases 1–4 so nothing breaks. V2 lives at `/login` and `/i/:token`.
- Existing `/api/chat` stays through phases 1–4 — not used by V2 but the old UI depends on it.
- Phase 5 is the only breaking change. A single commit replaces `/` and deletes `/api/chat`. Easy rollback.

## 11. Risks

| Risk | Mitigation |
|---|---|
| GLM returns malformed itinerary JSON | Validator + 1 retry + 502 fallback (covered in §8). |
| 10-night itinerary too long for `glm-4.7-flash` context window with all tool outputs | Pre-stuff context aggressively; drop low-relevance `event_sources` rows; truncate `local_guides` to relevant sections. |
| Resort image scrape: site is JS-rendered | Manual fetch of one image per resort up front (~15 min, 10 images); document the manual step in HANDOVER. |
| Chat agent uses mutation tool with bad inputs (e.g. unknown `day_id`) | Mutator validates and rejects; error surfaces in chat reply. |
| Long stays exceed `glm-4.7-flash` date-arithmetic accuracy (observed at 3 nights in the V1 test) | Recommend `ZAI_MODEL=glm-4.7` for any stay > 4 nights; document in HANDOVER. |
| Two tabs editing the same itinerary at once | Last write wins. Acceptable for PoC; documented limitation. |

## 12. Out-of-scope follow-ups

These were considered and explicitly deferred:

- **Rate limiting** on `/api/itinerary/:token/chat` — important before any URL goes public; deferred to a security-hardening pass.
- **Automatic model routing** by stay length (short stays → flash, long stays → 4.7) — kept as a docs note for now.
- **SSE/WebSockets** for live itinerary push — polling is simpler and sufficient for PoC; revisit when there's a second editor.
- **Itinerary history / undo** — every mutation could be appended to an `itinerary_revisions` table; deferred.
- **Email magic link** — pre-issuing tokens at booking-confirmation time would let the backend send `/i/<token>` URLs by email. Out of scope; the seed migration pre-issues tokens already.
- **Print / PDF export** — natural addition once layout is stable.
- **Auto-route to mobile-optimised view via UA sniff** — relying on responsive CSS for now.

---

## Acceptance criteria

V2 is done when:

1. `/i/<token>` for any seeded booking renders a personalised day-by-day itinerary that respects weather, includes local events that fall in the stay window, and matches the real RACV brand visuals (correct logo, royal blue, yellow pill CTAs, journey curve).
2. The chat panel can refine the itinerary using all five interaction patterns (chips, radio, multi, form, free text), and each mutation updates the persisted JSON within one chat turn.
3. Short (2–3 night), standard (5 night), and long (10 night) stays all render correctly with the right defaults (collapsing, nav, week grouping).
4. The login fallback at `/` issues a redirect to the correct `/i/<token>`.
5. All sensitive columns (`surname`, `email`, `phone`, `member_id_number`, `other_guest_names`) are absent from every API response and from the itinerary JSON.
6. The `HANDOVER.md §7` matrix passes with V2 (substituting "open the itinerary" for "send the credentials in chat").
7. Inline `Pin` / `Swap` / `Remove` buttons on every block produce a visible itinerary update within one chat turn (Swap/Remove via agent) or one direct API round-trip (Pin).
