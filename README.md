# Leisure Concierge — Proof of Concept (V2)

A leisure-itinerary concierge for RACV resort members. Members deep-link to a personalised day-by-day stay plan and refine it via a chat panel.


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
- The backend uses Z.ai's Anthropic-compatible endpoint (default `glm-4.7`; switch to `glm-4.7-flash` via `ZAI_MODEL` for cheaper/faster dev iteration).
- The itinerary is a single JSON document mutated by 7 chat tools.

(Detailed architecture in HANDOVER.md.)
