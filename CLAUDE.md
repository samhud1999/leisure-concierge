# CLAUDE.md — project context for Claude Code

RACV Member Concierge: a standalone web app (Node/Express + static frontend,
Supabase Postgres, Anthropic API, Open-Meteo) that builds personalised resort
stay itineraries for members.

## Start here
1. Read **HANDOVER.md** in full — it has setup, architecture, the current state,
   and the two outstanding tasks.
2. Read **concierge-agent-prd.md** (one level up) for the product spec.
3. Agent behaviour lives in **server/systemPrompt.js**; tools and security in
   **server/index.js**.

## Run
```bash
# In Supabase SQL Editor, run in order: db/schema.sql, db/seed.sql, db/seed_docs.sql
cd server && cp .env.example .env   # fill in Supabase + Anthropic keys
npm install && npm start            # → http://localhost:3000
```

## Outstanding work (priority order)
1. **Reskin the frontend to the real RACV brand** — research racv.com.au and its
   resorts pages, capture palette/type/logo/components/imagery into
   `DESIGN_NOTES.md`, then restyle `public/index.html`. See HANDOVER.md §5.
2. **Live event-fetching** from the allow-listed URLs in the `event_sources`
   table. See HANDOVER.md §6.

## Hard rules (do not regress)
- Tool handlers SELECT only itinerary-safe columns. Never select or expose
  `email`, `phone`, `member_id_number`, or `other_guest_names`.
- The Supabase **service role key stays server-side**. Never ship it to the
  browser. Keep `server/.env` git-ignored.
- Don't change the `/api/chat` history contract without updating `public/index.html`.
- This is a proof of concept — not an official RACV product. Keep the footer
  disclaimer.

After any change, run the verification checklist in HANDOVER.md §7.
