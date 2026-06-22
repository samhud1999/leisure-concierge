# RACV Member Concierge — Proof of Concept

A standalone web app: a five-star AI concierge that builds a personalised,
day-by-day stay itinerary for RACV resort members from their booking,
preferences, real resort knowledge, local events, and live weather.

```
concierge-app/
├─ db/
│  ├─ schema.sql        # tables (run 1st)
│  ├─ seed.sql          # resorts + dummy members/bookings + events (run 2nd)
│  └─ seed_docs.sql     # the 10 local-area guides (run 3rd)
├─ server/
│  ├─ index.js          # Express backend + agent loop + tools
│  ├─ systemPrompt.js   # concierge persona & rules
│  ├─ package.json
│  └─ .env.example      # copy to .env and fill in
├─ public/
│  └─ index.html        # chat UI
├─ SETUP.md             # full setup walkthrough (start here)
└─ README.md
```

## Quick start

1. **Supabase:** create a project, then in the SQL Editor run, in order,
   `db/schema.sql`, `db/seed.sql`, `db/seed_docs.sql`. (Details in `SETUP.md`.)
2. **Config:** `cd server && cp .env.example .env`, then fill in your
   Supabase URL + service role key and your Z.ai API key.
3. **Run:**
   ```bash
   cd server
   npm install
   npm start
   ```
4. Open **http://localhost:3000** and start chatting. Try member number
   **100201**, surname **Whitman**.

## How it works

- The browser holds the chat history and posts it to `POST /api/chat`.
- The backend runs the agent loop against **Z.ai's Anthropic-compatible
  endpoint** (default model `glm-4.6`) with five tools: `member_lookup`,
  `get_booking`, `get_resort_knowledge`, `get_events`, `get_weather`.
- The first four are backed by Supabase; `get_weather` calls **Open-Meteo**
  (free, no key) using each resort's stored coordinates.
- **Security by construction:** the tool handlers only ever SELECT
  itinerary-safe columns. Sensitive fields (email, phone, ID number, other
  guests' names) are never selected, so even a successful prompt injection
  cannot surface them. The service role key stays server-side; the browser
  never sees it.

## Demo accounts

All dummy bookings fall between **25 Jun and 6 Jul 2026** so live weather works.
A few to try:

| Member # | Surname | Resort | Scenario |
|---|---|---|---|
| 100201 | Whitman | Torquay | Couple, spa package |
| 100204 | Patel | Torquay | Family of 5 |
| 100214 | Andersson | Cape Schanck / Hobart | Member with two bookings |
| 100207 | Fitzgerald | Cape Schanck | Group of friends, villa |
| 100205 | Brennan | Inverloch | **Missing party size** (tests the "ask" flow) |
| 100206 | Kowalski | Healesville | **Missing check-out** (tests the "ask" flow) |
| 100208 | Tanaka | Royal Pines | Couple, spa suite |
| 100215 | Mwangi | Noosa | Friends, 3-bed villa |

Try a bad login (e.g. 100201 / "Wrong") to see no-match handling.

## Notes

- Weather is reliable ~16 days out; for stays further away the agent falls back
  to seasonal judgement.
- Events are seeded from your allow-listed sources for the demo window. To pull
  events live from those sites instead, extend `get_events` to fetch + parse the
  rows in `event_sources` (left as a follow-up).
