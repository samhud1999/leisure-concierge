# Leisure Concierge — Engineering Handover (V2)

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
