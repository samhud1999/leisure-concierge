# CLAUDE.md — project context for Claude Code

Leisure Concierge **V2** (itinerary-first): a standalone web app for RACV resort members (Node/Express + static frontend, Supabase Postgres, Z.ai GLM via the Anthropic-compatible endpoint, Open-Meteo) that builds personalised stay itineraries. Members deep-link via `/i/<token>` or log in at `/`, see an auto-generated day-by-day itinerary, and refine it via an adaptive-card chat panel.

## Start here
1. Read **HANDOVER.md** in full — V2 architecture, quick start, and how the entry flow works.
2. Read **docs/superpowers/specs/2026-06-23-v2-itinerary-first-design.md** for the V2 design rationale.
3. The agent loop lives in **server/agent/chatAgent.js** (refinement) and **server/itinerary/generator.js** (V1 build). System prompts in **server/agent/systemPrompt.js**. Mutation tools in **server/itinerary/mutator.js**. Tool definitions in **server/agent/chatTools.js**.

## Run
```bash
# In Supabase SQL Editor, run in order:
#   db/schema.sql, db/seed.sql, db/seed_docs.sql, db/v2_itineraries.sql
cd server && cp .env.example .env   # fill in Supabase + Z.ai keys
npm install && npm start            # → http://localhost:3000
# log in 100201 / Whitman, or open /i/<token>
```

## Hard rules (do not regress)
- Tool handlers SELECT only itinerary-safe columns. Never select or expose `email`, `phone`, `member_id_number`, `other_guest_names`, or `surname`.
- Sensitive PII NEVER appears in the persisted itinerary `doc` or in any API response.
- The Supabase **service role key stays server-side**. Never ship it to the browser. Keep `server/.env` git-ignored.
- Login fallback at `/api/login` MUST NOT reveal which field failed (no surname/member mention in the 401 body).
- Pinned blocks (`pinned: true`) are immovable by `swap_activity`/`remove_activity` — reject with an error.
- The `itineraries.doc` JSONB is the canonical state; mutate only via `server/itinerary/mutator.js` operations (which bump `version`, regenerate `summary.highlights`, and re-validate via `validateFull`).
- This is a proof of concept — not an official RACV product. Keep the footer disclaimer ("Proof of concept — not affiliated with RACV.") on every page.
</content>
</invoke>