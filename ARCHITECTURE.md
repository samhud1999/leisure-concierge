# Leisure Concierge — Architecture

> Status: proof of concept, V2 (itinerary-first), pre-deployment. Baseline commit `eeeb055`, current head `6aa6a01`. Read this alongside `HANDOVER.md` (engineering) and `docs/superpowers/specs/2026-06-23-v2-itinerary-first-design.md` (the original V2 design spec).

---

## 1. What you have built

**Leisure Concierge** is a personal day-by-day stay planner for RACV resort members. A member opens a one-link URL (or logs in with their member number + surname), sees a complete itinerary auto-generated for their booking, and refines it via a chat panel with adaptive cards. The itinerary is structured, persistent, and visible as a branded HTML artifact, not a wall of chat text.

- **One artifact per booking.** Each upcoming RACV booking has a unique deep-link token. Hitting `/i/<token>` shows that member's itinerary, period.
- **Built once, cached forever.** A first visit triggers one LLM call that synthesises the resort knowledge, weather, local events, and member preferences into a structured JSON. The doc persists in Supabase. Every subsequent visit (and every refinement) operates on that stored doc.
- **Refinement, not regeneration.** When the member chats ("swap the Sunday walk for something indoor", "I'm vegetarian"), the agent calls focused mutation tools that update just the affected days. The view re-fetches and re-renders with the changed blocks highlighted.
- **RACV brand throughout.** Real logo, RACV royal blue + yellow pill CTAs, Poppins typography. The itinerary skeleton (kicker / hero / weather strip / day accordions with numbered circles / activity timeline) was based on a reference design you provided.

It is a working prototype suitable for a stakeholder demo. It is not production-grade — see §11.

---

## 2. System architecture

```
+------------------------- Browser (vanilla JS, no framework) -------------------------+
|                                                                                       |
|   GET  /                       Login page (member# + surname)                         |
|   POST /api/login              -> returns { token, redirect: '/i/<token>' }           |
|   GET  /i/<token>              HTML shell with inlined itinerary JSON in <script>     |
|                                or, when status='pending', a personalised loading shell|
|   POST /api/itinerary/<token>/generate    First-visit build (60-90s on glm-4.7)       |
|   GET  /api/itinerary/<token>?since=N     Poll for updated version after a chat turn  |
|   POST /api/itinerary/<token>/chat        Run the 12-tool refinement agent loop       |
|   POST /api/itinerary/<token>/pin         Direct pin/unpin (no LLM round-trip)        |
|   POST /api/itinerary/<token>/regenerate  Discard cached doc and rebuild              |
|                                                                                       |
+----------|----------------------------------------------------------------------------+
           |
           |  Express server (Node 22, single process, no build step)
           v
+--------------------------------- server/ ---------------------------------------------+
|                                                                                       |
|   index.js .................. thin router; mounts everything                          |
|                                                                                       |
|   routes/                                                                             |
|     login.js .............. POST /api/login                                           |
|     itineraryPage.js ...... GET /i/<token> (HTML + inlined state)                     |
|     itineraryApi.js ....... five JSON endpoints under /api/itinerary/<token>/...      |
|                                                                                       |
|   itinerary/                                                                          |
|     generator.js .......... One-shot GLM build (V1) with weather field mapping        |
|     mutator.js ............ 7 mutation operations (add/swap/remove/reorder/           |
|                              pin/preference/regenerate_day)                           |
|     schema.js ............. JSON shape validators + soft repairs                      |
|     summarizer.js ......... Regenerates summary.highlights after any mutation         |
|                                                                                       |
|   agent/                                                                              |
|     chatAgent.js .......... Runs the 12-tool Anthropic-SDK loop with ui_hint contract |
|     chatTools.js .......... Tool definitions (5 read-only + 7 mutation = 12)          |
|     systemPrompt.js ....... Refinement persona + writing-style rules                  |
|                                                                                       |
|   tools/                                                                              |
|     readonlyHandlers.js ... Factory: 5 read-only tool handlers bound to a Supabase    |
|                              client; injected into chatAgent.js                       |
|     tokens.js ............. URL-safe base64 encode/decode helpers                     |
|                                                                                       |
|   liveEvents/                                                                         |
|     index.js .............. fetchLiveEventsFor() orchestrator                         |
|     cache.js .............. In-process 12h TTL cache (Map-based)                      |
|     normalize.js .......... RawEvent -> canonical event shape                         |
|     extractors/                                                                       |
|       index.js .......... URL registry, three extractors below                        |
|       torquayCowrieMarket.js / visitGreatOceanRoad.js / surfCoastEvents.js            |
|     httpFetch.js .......... Fetch wrapper with 8s timeout + abort                     |
|                                                                                       |
|   scripts/                                                                            |
|     smoke-generate.mjs .... CLI to build one itinerary end-to-end (Phase 1 smoke)     |
|     snapshots/ ............ committed JSON snapshot for human eyeballing              |
|                                                                                       |
+--------|----------------------------|----------------------|---------------------------+
         |                            |                      |
         v                            v                      v
   +-------------+         +-------------------+      +----------------+
   |  Supabase   |         |  Z.ai             |      |  Open-Meteo    |
   |  Postgres   |         |  api.z.ai/api/    |      |  forecast API  |
   |             |         |  anthropic        |      |  (no API key)  |
   | members     |         |  (Anthropic-SDK   |      |                |
   | bookings    |         |   compatible      |      |                |
   | resorts +   |         |   endpoint)       |      |                |
   |   amenities |         |  default model:   |      |                |
   |   dining    |         |  glm-4.7          |      |                |
   |   experi.   |         |                   |      |                |
   |   room_type |         +-------------------+      +----------------+
   | events +                                              ^
   |   event_src                                           |
   | internal_   <-- 10 local-area guides per resort       |
   |   docs                                                |
   | itineraries  (V2: JSONB doc per booking, token, vers) |
   +-------------+                                         |
         |                                                 |
         +--- web-scraped live events from allow-list -----+
              -> liveEvents/orchestrator merges with seed
```

### Key technical choices and why

| Choice | Why |
|---|---|
| **Z.ai GLM via Anthropic-compatible endpoint** | Lets us use the standard `@anthropic-ai/sdk` package and tool-use protocol unchanged. Swapping models is one env var (`ZAI_MODEL=glm-4.7-flash` for cheaper iteration). |
| **Single JSONB doc per booking, not normalised tables** | Mutations are whole-doc-atomic. Reads are always "give me the whole thing". Schema evolves without migrations. |
| **Vanilla JS, no framework** | No build step. The frontend is two HTML files + three JS modules + one CSS file. Renders fast, easy to read. |
| **Tools, not prose** | The chat agent never regenerates the itinerary. It calls focused mutation tools that update specific blocks/days. Limits LLM creativity to a narrow contract; everything else is deterministic code. |
| **Token deep links with login fallback** | The primary entry is a shareable URL; the form is for members who have lost the link. Both land on the same `/i/<token>` view. |
| **In-process 12h cache for live events** | Live event fetches are slow and rate-limited. Caching means the second hit on the same resort within 12h pays no network cost. |
| **glm-4.7 as the default model, not flash** | Better itinerary quality + better instruction-following for the writing-style rules (no AI-speak, no em dashes, named-venue variety). Pays ~2× the build time in exchange. |
| **HTML `<details>` for day accordions, not custom toggle JS** | Native disclosure widget; works without JavaScript; print-friendly. |

---

## 3. Data model

### Itinerary document (the JSON inside `itineraries.doc`)

```jsonc
{
  "version": 4,                            // increments on every mutation
  "updated_at": "2026-06-23T10:25:00Z",
  "booking_id": "RACV-TQ-3001",
  "token": "abc123xyz",

  "member": { "first_name": "Eleanor", "member_number": "100201" },  // no surname/email/phone

  "stay": {
    "check_in":  "2026-06-25",
    "check_out": "2026-06-28",
    "nights": 3,
    "room_type": "Suite",
    "party_size": 2,
    "add_ons": ["One Spa package"]
  },

  "resort": {
    "slug": "torquay", "name": "RACV Torquay Resort",
    "town": "Torquay", "region": "Great Ocean Road",
    "hero_image": "/img/resorts/torquay.jpg",
    "summary": "Cliff-top resort on the Surf Coast…"
  },

  "preferences": {
    "party_kind": "couple",         // couple | family | friends | solo
    "dietary":    null,             // null | "vegetarian" | "vegan" | "gluten-free" | <free text>
    "pace":       "relaxed",        // relaxed | balanced | active
    "interests":  ["coastal walks", "good food", "spa"]
  },

  "summary": { "highlights": ["2 spa treatments", "1 farmers market · Sat 28", "Mostly fair weather"] },

  "days": [
    {
      "id":    "day-1",
      "date":  "2026-06-25",
      "label": "Thu 25 Jun",
      "weather": { "condition": "Partly cloudy", "temp_max_c": 18, "temp_min_c": 11, "precip_pct": 30, "precip_mm": 0.2 },
      "blocks": [
        {
          "id":          "blk-101",                    // stable IDs survive mutations
          "kind":        "arrival",                    // arrival | dining | activity | spa | event | departure | free
          "time_of_day": "afternoon",                  // morning | midday | afternoon | evening
          "icon":        "🛬",                         // legacy field; frontend uses inline SVGs by kind
          "title":       "Arrival & check-in",
          "description": "Settle into your Suite with a free-standing spa bath.",
          "venue":       null,
          "source_url":  null,
          "pinned":      false                         // user-pinned blocks resist swap/remove/regenerate
        }
      ]
    }
  ]
}
```

### Sensitive fields stay out

The `members` table has `surname`, `email`, `phone`, `member_id_number` (all flagged SENSITIVE in `db/schema.sql`). None of these ever flow into the itinerary doc or any API response. The agent's read-only `member_lookup` tool only returns `(id, first_name, member_number, preferences)` — enforced by the `MEMBER_SAFE` column whitelist in `server/tools/readonlyHandlers.js`.

The `bookings.other_guest_names` column exists in the schema for realism but is never selected. If a member asks "who else is on my booking?", the agent declines and surfaces only their own party_size.

### Itinerary lifecycle

```
pending  ─────────────────────────────►  ready
   │     POST /api/itinerary/<t>/generate
   │     (one GLM call, 30-90s)
   │
   │ on transient GLM/network error:
   ▼
generation_failed  ──── retry via "Try again" or /regenerate ──►  pending  ─►  ready
                        (no manual SQL needed; the failed status is just a flag)
```

The `itineraries` table is pre-seeded with one row per booking at migration time (`db/v2_itineraries.sql`), all in `status='pending'` with an empty `doc` and a freshly-issued URL-safe token. There is no separate "create itinerary" step — the row exists from day one; only the doc is built lazily.

---

## 4. User journeys

### A: Member opens a deep link (the primary flow)

```
1. Member receives a URL: https://app.example/i/aB3-x7QkLm_p
2. Browser GET /i/aB3-x7QkLm_p
3. Server: SELECT * FROM itineraries WHERE token = 'aB3+x7QkLm/p='
   (URL-safe form normalised back to standard base64 for the lookup)
4a. status='ready' -> inline doc as <script id="state">, render itinerary instantly
4b. status='pending' -> fetch booking metadata, inline { status:'pending', preview }
                       render branded loading shell, POST /generate, wait 30-90s,
                       receive { itinerary }, replace shell with rendered view,
                       reveal chat pane
4c. status='generation_failed' -> render error shell with last_error + "Try again"
5. Member browses days, expands/collapses, scrolls
```

### B: Member arrives without a deep link

```
1. Member browses to https://app.example/
2. Login form (member number + surname)
3. POST /api/login { member_number, surname }
4. Server: lookup by member_number+ILIKE surname; pick most-recent booking;
   resolve token; return { token, redirect: '/i/<token>' }
5. Browser navigates to /i/<token>
6. Continues as flow A
7. On no-match: 401 + { error: 'no_match' } with no field-specific detail
```

### C: Member refines via chat

```
1. Member types "I have a gluten allergy" (free text) or taps a suggestion chip
2. Browser POST /api/itinerary/<token>/chat with the full message history
3. Server runs the agent loop:
     - Load current itinerary doc
     - Build system prompt with the doc embedded + the user message
     - Anthropic SDK call with 12 tools (5 read-only + 7 mutation)
     - Agent may call get_resort_knowledge, get_events, etc. for context
     - Agent calls set_preference({key:'dietary', value:'gluten-free'})
     - Mutator validates, persists, bumps version, regenerates highlights
     - Agent calls regenerate_day on impacted days (the prompt rules require it)
     - Agent emits final JSON: { reply: "Updated dietary preferences and refreshed Friday and Saturday dinners.", ui_hint: { type:"chips", options:[...] } }
4. Server returns { reply, ui_hint, messages, version }
5. Frontend renders reply as an assistant bubble, swaps suggestion chips
6. Frontend GET /api/itinerary/<token>?since=<prev_version> to fetch the new doc
7. Re-renders the itinerary; changed blocks briefly highlight yellow
```

### D: Member taps an inline block action (Pin / Swap / Remove)

```
Pin: direct round-trip to /api/itinerary/<token>/pin (no LLM); ~50ms.
Swap/Remove: emits an inline-action CustomEvent the chat panel listens for;
             pre-formats the message ("Swap block blk-104 for something indoor")
             and runs it as a normal chat turn. On mobile the chat sheet
             auto-opens so the member sees the response.
```

### E: Mobile (<768px viewport)

```
- Itinerary fills the screen; layout stacks single-column.
- Chat is hidden behind a yellow floating action button (FAB) bottom-right.
- Tap FAB -> chat slides up as a bottom sheet covering ~90% of viewport.
- Backdrop dims the itinerary; tap backdrop, the X button, or Escape to close.
- Background page-scroll is locked while the sheet is open.
- Inline Pin/Swap/Remove auto-opens the sheet so the agent's reply is visible.
```

---

## 5. User stories

### Primary persona — RACV member with an upcoming stay

**US-1.1**  As a member, I want to open a single URL and see a complete day-by-day plan for my booked stay, so that I do not have to interview a chatbot to get started.
**Acceptance**: `/i/<token>` renders the full itinerary on the first visit; the agent does not ask any preliminary questions.

**US-1.2**  As a member, I want the itinerary to know which resort I am visiting, my exact dates, and my room type, so that the plan fits my actual booking.
**Acceptance**: the hero card shows resort name + town + dates + room type pulled from the live `bookings` row.

**US-1.3**  As a member, I want each day clearly labelled with the day of the week and the date, so that I never have to count from the check-in to figure out what "day 3" is.
**Acceptance**: every day card shows `[DAY N]` plus `"Friday, 27 June"` plus a mini weather summary.

**US-1.4**  As a member, I want the plan to be aware of the weather forecast, so that outdoor activities are scheduled on fair days and indoor ones on wet days.
**Acceptance**: when `precip_pct > 60` or `precip_mm > 5`, no outdoor blocks land on that day. Weather strip across the top of the page shows all days at a glance.

**US-1.5**  As a member, I want to refine the plan without restarting from scratch, so that getting a closer fit doesn't feel like a re-interview.
**Acceptance**: chat tools mutate specific days; pinned blocks are immovable; the itinerary persists across visits.

**US-1.6**  As a member, I want to pin items I love so that they survive any later regeneration.
**Acceptance**: `pin_block` toggles a flag; mutator's `regenerateDay` preserves pinned-block positions; `swap_activity` and `remove_activity` reject pinned blocks with a clear error.

**US-1.7**  As a member, I want variety across my stay, so that I am not eating at the same restaurant or doing the same walk every day.
**Acceptance**: prompt rules enforce that a named restaurant or experience appears at most once per stay. Chat agent checks the rest of the itinerary before suggesting a venue that already exists elsewhere.

**US-1.8**  As a member, I want the chat to suggest sensible next steps via clickable chips, so that I don't have to compose every message from scratch.
**Acceptance**: every agent reply carries a `ui_hint` with one of 5 patterns (chips, radio, multi, form, none). The frontend renders the matching control above the free-text composer.

**US-1.9**  As a member on my phone, I don't want the chat to compete with the itinerary for screen space.
**Acceptance**: on viewports ≤ 768px, the chat is a slide-up bottom sheet behind a floating action button.

**US-1.10** As a member, I do not want a typo at login to leak which of my fields was wrong, so that account enumeration is harder for an attacker.
**Acceptance**: `POST /api/login` returns `401 { error: 'no_match' }` for wrong member#, wrong surname, or wrong-both. No body content varies.

### Secondary persona — RACV ops / demo presenter

**US-2.1**  As an ops person, I want each booking to have a shareable URL that works in any browser without an install or login, so that I can demo to a stakeholder in one click.
**Acceptance**: tokens are pre-issued per booking, URL-safe, no expiry.

**US-2.2**  As an ops person, I want to know roughly how long the first visit takes, so that I can set expectations.
**Acceptance**: the loading shell tells the member "about 60 to 90 seconds, we only do this once". A pre-warm script exists to build all demo URLs offline.

**US-2.3**  As an ops person, I want sensitive member data to never appear in shareable URLs or page source.
**Acceptance**: surname, email, phone, member ID, and other guests' names are excluded from all API responses, the itinerary doc, the inlined `<script id="state">`, and the page HTML.

### Tertiary persona — engineer picking up the codebase

**US-3.1**  As an engineer, I want one README to tell me how to run this locally, so that I am not piecing together knowledge from five files.
**Acceptance**: `README.md` lists the four SQL files to run, the three env vars, and the `npm install && npm start` commands.

**US-3.2**  As an engineer, I want to know which files house which concerns, so that I can find where to make changes.
**Acceptance**: this document's §2 maps every file to a sentence describing its responsibility; `HANDOVER.md` adds operational detail.

**US-3.3**  As an engineer, I want to know what is tested vs what is not, so that I can avoid breaking things I think are covered.
**Acceptance**: see §8 below.

---

## 6. Security model

Everything below is enforced by code, not by convention.

| Concern | How it is enforced |
|---|---|
| **PII whitelisting at the boundary** | `MEMBER_SAFE = 'id, first_name, member_number, preferences'` and `BOOKING_SAFE = ...` (no `other_guest_names`) in `readonlyHandlers.js`. Any SELECT against `members` or `bookings` uses these constants. |
| **PII excluded from the itinerary doc** | The generator's `assembleDoc` only copies `first_name` and `member_number` into `member`. No code path puts surname/email/phone into the doc. The committed snapshot at `server/scripts/snapshots/100201-RACV-TQ-3001.json` was grep-verified clean. |
| **Service role key stays server-side** | `.gitignore` excludes `server/.env`. Render's `render.yaml` uses `sync: false` for the secret so it lives in the dashboard, not in git. |
| **Generic 401 on login mismatch** | `routes/login.js` returns `{ error: 'no_match' }` for any failure mode. Unit test asserts no `/surname/i` or `/member/i` substring in the response body. |
| **Cross-itinerary tool calls** | The chat agent's mutation tools resolve the itinerary by token (the URL); the agent has no way to mutate a different member's itinerary even if it tried, because the route handler binds the token at the request level. |
| **Pinned blocks resist mutation** | `swapActivity` and `removeActivity` throw with messages matching `/pinned/i`. The agent's system prompt also instructs it to refuse. |
| **XSS in inlined state** | `itineraryPage.js` escapes `<` as `<` in the JSON inlined into `<script id="state">`. Every dynamic string in `itinerary.js` and `chat.js` goes through `escapeHtml` or `escapeAttr` before HTML interpolation. |
| **HTML-escape JSON-from-LLM** | Block titles, descriptions, venues are user-displayable strings written by the model. They're escaped on render. The schema validator also bounds `title ≤ 40 chars`, `description ≤ 140 chars` to limit blast radius. |

### Token threat model (known PoC weakness)

Tokens are 12-character URL-safe base64 strings with no expiry, no rotation, and no revocation. They are de-facto credentials. Anyone with the URL can read and mutate that one member's itinerary. The token is also embedded in the page HTML for client-side use, which means anyone who can view-source the page can extract it.

Acceptable for a PoC because: (a) tokens are random enough to resist brute force in any reasonable demo time window, (b) every itinerary is bound to a single booking — compromise of one token does not propagate, (c) the production form of this would issue tokens at booking-confirmation time and deliver via the member's existing communication channel (email/SMS).

### Other PoC concessions

- No rate limiting on any endpoint. A bot crawling random tokens would 404 most of the time, but the `/generate` route is expensive per call.
- No CSRF protection on the JSON POST routes (cookies are not used; the token is the auth).
- No automated rotation of the Z.ai key.

---

## 7. The 12 tools (agent surface)

| Tool | Read or write | Used by | What it does |
|---|---|---|---|
| `member_lookup` | read | chat agent | Verify `(member_number, surname)`. Returns `first_name` only on match. |
| `get_booking` | read | chat agent | Returns the verified member's own bookings (whitelist enforced). |
| `get_resort_knowledge` | read | both | Amenities, dining, experiences, room types, internal docs for a resort slug. |
| `get_events` | read | both | Local events for a resort in a date range. Merges seed events with live-fetched events from allow-listed sources, cached 12h. |
| `get_weather` | read | both | Open-Meteo daily forecast for a resort lat/long and date range. |
| `add_activity` | write | chat agent | Append a new block to a day. Validates kind + time_of_day; soft-repairs missing icon/description. |
| `swap_activity` | write | chat agent | Replace one block in place. Preserves block_id. Rejects pinned blocks. |
| `remove_activity` | write | chat agent | Drop a block. Rejects pinned blocks. |
| `reorder_day` | write | chat agent | Reorder blocks within a day by block_id list. Validates same-length. |
| `set_preference` | write | chat agent | Write one of `party_kind / dietary / pace / interests`. Agent is instructed to follow with `regenerate_day` on impacted days. |
| `pin_block` | write | chat agent + direct API | Toggle a block's `pinned` flag. Used by inline Pin button without LLM round-trip. |
| `regenerate_day` | write (LLM) | chat agent | Rewrite ONE day with a focused GLM call. Preserves pinned-block positions by index. Soft-repairs returned blocks. |

The V1 generator (`generator.js`) is not a tool — it's a one-shot direct GLM call invoked by `POST /generate`. It runs only when the doc is empty (first visit) or after `POST /regenerate`.

---

## 8. What is tested

### Automated (67 tests, all green, run via `cd server && npm test`)

| Suite | File | Tests | What it covers |
|---|---|---|---|
| **liveEvents/cache** | `liveEvents/__tests__/cache.test.js` | 4 | TTL eviction, hit, miss, error path. |
| **liveEvents/extractors** | `liveEvents/__tests__/extractors.test.js` | 7 | Each of three site-specific extractors parses a saved HTML fixture into the canonical event shape. |
| **liveEvents/normalize** | `liveEvents/__tests__/normalize.test.js` | 6 | Raw event → canonical event coercion (date formats, environment defaults, missing fields). |
| **liveEvents/orchestrator** | `liveEvents/__tests__/orchestrator.test.js` | 3 | Source-level isolation, dedupe, allow-list enforcement. |
| **itinerary/schema** | `itinerary/__tests__/schema.test.js` | 11 | `validateGenerated` + `validateFull` accept correct shapes, reject duplicates, missing required fields, unknown kinds, etc. `softRepair` clamps over-long fields and defaults icons by kind. |
| **itinerary/summarizer** | `itinerary/__tests__/summarizer.test.js` | 5 | Highlight regeneration: spa count, event with date, weather mood, ≤4 cap, empty doc → []. |
| **itinerary/generator** | `itinerary/__tests__/generator.test.js` | 4 | `mapWeather` field rename (Open-Meteo → itinerary names), prompt builder shape, `assembleDoc` wrapper merge, retry on malformed JSON. |
| **itinerary/itineraryApi** | `itinerary/__tests__/itineraryApi.test.js` | 4 | `POST /generate` happy path, 404 on missing token, 502 on `generator_unparseable`, status flip to `generation_failed` on throw. |
| **itinerary/login** | `itinerary/__tests__/login.test.js` | 3 | Valid creds → token; no-match → 401 with no field leak; multi-booking member → returns most-recent itinerary. |
| **itinerary/itineraryPage** | `itinerary/__tests__/itineraryPage.test.js` | 3 | Inlines full doc when ready; inlines `{status:"pending"}` shell otherwise; 404 on missing token. |
| **itinerary/mutator** | `itinerary/__tests__/mutator.test.js` | 11 | All 7 mutation ops + the regenerateDay pinned-position preservation + softRepair on GLM output. |
| **agent/chatAgent** | `agent/__tests__/chatAgent.test.js` | 5 | All 12 tool definitions present; system prompt embeds itinerary JSON; runChatAgent parses ui_hint; falls back to chips when ui_hint absent. |

Test runners use Node's built-in `node:test` and `node:assert/strict`. No external test framework, no test database — tests use fake supabase/anthropic clients injected via dependency injection. Fast (~400 ms total) and offline.

### Manual smoke tests (committed evidence)

- **V1 generator end-to-end snapshot.** `server/scripts/smoke-generate.mjs` runs the real generator against Eleanor's RACV-TQ-3001 booking against the real Z.ai endpoint and writes the result to `server/scripts/snapshots/100201-RACV-TQ-3001.json`. Committed and grep-verified PII-clean.
- **Live `/api/chat` round-trip.** Performed during V2 Phase 4 verification: log in as 100201/Whitman, chat panel triggers `member_lookup`, security guardrail holds (no surname leakage in 401).
- **End-to-end V1 build on the deployed model.** Andre Kaplan rebuild after a transient Z.ai network blip: HTTP 200, 3.5 KB itinerary JSON, 37 seconds wall-clock on glm-4.7. Re-runnable.
- **Playwright visual smoke of the chat panel.** V2 Task 17: confirmed chip rendering, composer presence, yellow Send button, user-message bubble after a chip tap. (No headless browser tests are in CI; this was a one-off visual confirmation.)

### What is NOT tested

- **Full chat-to-mutator integration.** No end-to-end test that simulates "user says X → chat agent calls mutator Y → doc changes Z". The agent loop is tested with a mocked Anthropic client; the mutator is tested standalone. Their composition is exercised only by manual chat sessions.
- **Browser rendering.** No automated test confirms the page renders without console errors, the chips are accessible, or the mobile FAB sheet animates correctly. Visual verification has been manual via DevTools.
- **Long-stay code paths.** No seed booking is ≥ 7 nights, so the week-grouping, sticky day-jump nav, and "today + tomorrow expanded" defaults for 4–6 night stays have only code-review coverage. Verified by hand-editing one booking's check_out and reloading.
- **Resort imagery 404 fallback.** The `<img onerror>` is by inspection; no test confirms a missing JPG hides cleanly.
- **Z.ai-down behaviour.** Manually observed once during a transient network blip: the route returns 502, the row stamps `generation_failed`, the frontend shows the error shell with "Try again". No automated test for the persistence path.
- **Cross-browser, accessibility, performance.** No Lighthouse, axe, or load-test runs against this codebase.

### Code-review coverage

Every committed change went through a per-task reviewer (per-task subagent under `subagent-driven-development`). Final whole-branch review (Sonnet) flagged 3 Critical + 5 Important findings; all Critical and 3 of 5 Important were fixed before any deploy. The remaining 2 Important (rate-limiting and token threat-model documentation) are PoC-acceptable and tracked in `.superpowers/sdd/progress.md`.

---

## 9. External dependencies and what would break if they vanished

| Dependency | Used for | Failure mode |
|---|---|---|
| **Supabase Postgres** | All persistent data (members, bookings, resorts, events, itineraries, internal_docs) | Tool calls return `{ error: 'lookup_failed' }`. Login returns 401 (no member found). New itinerary builds fail because the booking lookup throws. Existing cached docs would still render if not for the fact that they're stored IN Supabase, so realistically the whole app is dead. |
| **Z.ai (Anthropic-compat endpoint)** | All LLM calls (V1 build, chat refinement, regenerate_day) | First visits stall at the loading shell and eventually time out → `generation_failed`. Cached itineraries (`status='ready'`) keep working in read-only mode. Chat refinement throws and shows the user a brief error message. |
| **Open-Meteo** | Daily weather forecast (no API key required) | The generator's `mapWeather` returns `[]`; itinerary days have empty weather objects; weather-aware steering becomes a no-op. Page still renders. |
| **Live event sources** (3 allow-listed Surf Coast / Torquay sites) | Optional augmentation of seed events | The orchestrator skips failed sources with a `console.warn` and returns whatever else came back, including the seed events. App still works. |
| **GitHub** | Source hosting + Render's deploy source | If GitHub is down, Render can't auto-deploy on push, but the existing dyno keeps running. |
| **Render** | Hosting | Whole app is down. Local development is unaffected. |

---

## 10. Configuration surface (full env-var list)

| Env var | Required | Default | Used by | What it does |
|---|---|---|---|---|
| `SUPABASE_URL` | **yes** | none | Supabase client | Project URL (e.g. `https://xxx.supabase.co`). |
| `SUPABASE_SERVICE_ROLE_KEY` | **yes** | none | Supabase client | JWT that bypasses RLS. Server-side only. |
| `ZAI_API_KEY` | **yes** | none | Anthropic SDK | Z.ai API key (from `https://z.ai/model-api`). |
| `ZAI_MODEL` | no | `glm-4.7` | Anthropic SDK `model` param | Supported: `glm-4.7`, `glm-4.7-flash`, `glm-4.6`, `glm-4.5`, `glm-4.5-air`. |
| `ZAI_BASE_URL` | no | `https://api.z.ai/api/anthropic` | Anthropic SDK `baseURL` | The Anthropic-compatible endpoint at Z.ai. |
| `PORT` | no | `3000` | Express | Listen port. Render injects its own. |
| `RESORT_BRAND` | no | `RACV` | Startup log line only | Display label; not used for any logic. |

---

## 11. Known limitations and what production would need

| Area | PoC reality | Production lift |
|---|---|---|
| **Token security** | 12-char base64, no expiry, embedded in page HTML | Issue at booking-confirmation time, deliver via email/SMS, set expiry to check-out + 30d, HMAC-sign so the server can validate without a DB hit on a hot path |
| **Rate limiting** | None | `express-rate-limit` per-IP on `/generate` and `/chat`; per-token cooldowns on `/regenerate` |
| **CSRF / origin** | Not enforced | `Origin` header check or short-lived signed nonces on mutation routes |
| **Auth on `/api/login`** | Member# + surname only, no second factor | OTP via the member's verified channel; existing RACV identity (SSO) integration |
| **Live event sources** | 3 static allow-listed Torquay/Surf Coast sites | Per-resort allow-lists in DB, scheduled crawl, source-quality scoring |
| **Resort imagery** | 10 manually-saved JPGs in `public/img/resorts/` | RACV asset CDN integration; responsive `<picture>` with mobile-optimised sources |
| **Weather forecast horizon** | Open-Meteo ~16 days; later dates get seasonal judgement | Same data source is fine; for stays >16 days out, schedule a pre-stay regeneration cron 14 days before check-in |
| **Cache for live events** | In-process Map, vanishes on dyno restart | Postgres-backed `event_cache` table or Redis |
| **Multi-region** | One Render dyno (Singapore by default) | Multi-region behind a CDN; sticky sessions or shared cache |
| **Observability** | `console.warn` + Render's log tail | Structured logs (pino), errors to a sink (Sentry), Z.ai cost metric per token |
| **Test breadth** | Unit tests only; manual smoke for chat-loop integration | Playwright end-to-end suite; daily cron that generates a booking and asserts shape; load test for `/generate` concurrency |
| **Long-stay validation** | Code-review only | Add ≥ 7-night seed bookings so the week-grouping path is exercised by the snapshot smoke |
| **A11y** | Semantic HTML + ARIA on the key controls | Lighthouse a11y audit, focus management on the mobile chat sheet, screen-reader pass on the timeline |
| **Personalisation depth** | Preferences are a flat 4-field object | Per-member preference history; learn from accept/reject patterns; resort-specific defaults |

---

## 12. Glossary

- **Artifact** — the single HTML page that renders the itinerary. Distinct from "chat output" — the artifact persists and is the primary surface.
- **Block** — a single activity / dining / spa / event / arrival / departure / free entry within a day. Smallest mutation unit.
- **Day** — one calendar day in the stay. Always contiguous from `check_in` to `check_out`. Day count = `nights + 1`.
- **Doc** — the persisted JSON in `itineraries.doc`. Mutated only via the mutator's seven operations.
- **Token** — the URL-safe identifier in `/i/<token>`. Bound to one booking. URL-safe base64 of `gen_random_bytes(9)`.
- **V1 build** — the one-shot GLM call that generates the initial itinerary from booking + resort + events + weather context. Distinct from chat refinement, which uses tools.
- **Chat refinement** — the subsequent multi-turn agent loop that mutates the doc via tools. Never regenerates the whole itinerary; always makes the smallest change that satisfies the request.
- **Pinned block** — `pinned: true` flag on a block. Resists `swap_activity`, `remove_activity`, and is preserved at its original index by `regenerate_day`.
- **ui_hint** — the chat agent's structured suggestion for the frontend's next-question UI. One of: chips, radio, multi, form, none.
- **Pre-warm** — calling `/generate` for every seed booking before any human visits the URLs, so demos render instantly.
