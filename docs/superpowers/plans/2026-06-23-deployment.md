# Deployment Plan — RACV Concierge PoC

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans
> (single-engineer pace) or superpowers:subagent-driven-development. Steps use
> checkbox (`- [ ]`) syntax for tracking.
>
> **Sequence:** Run AFTER Part 1 + Part 2 merge. Final review verdict was
> "Ready to merge: Yes" at commit `b07bcc9`.

**Goal:** Stand up the concierge as a publicly reachable demo URL so a
stakeholder can open it on a phone or laptop and run the §7 scenarios
without local setup. Backend must complete multi-tool agent loops (often
20–60 s wall-clock per assistant turn) without timing out, and must hold a
shared in-process TTL cache for live events across requests.

**Recommendation: Render.com free tier.** Render runs Express natively as a
long-running process, has no per-request execution-time cap (only an idle
shutdown after 15 min that wakes on next request ~30 s), and is one
`render.yaml` away from a single-click deploy. Free is fine for a PoC; if
demos can't tolerate the 30 s cold start, upgrade to Starter ($7/mo) which
removes the sleep.

---

## Why NOT Vercel (read this once)

Vercel is great for static frontends + short serverless functions. This
app is neither. Three blockers:

1. **Function timeout.** Hobby = 10 s. Pro = 60 s. Enterprise = 90 s. The
   agent loop calls GLM once per assistant turn and the §7 happy path
   (`100201` / `Whitman`) takes 5–6 turns of tool calls (`member_lookup`,
   `get_booking`, `get_resort_knowledge`, `get_events`, `get_weather`) plus
   the final itinerary token stream. Live measurement at commit `b07bcc9`:
   a single greeting-then-`member_lookup` round-trip took ~14 s. A full
   itinerary build will routinely exceed 60 s. Hobby fails fast; Pro fails
   slow but still fails.
2. **In-process cache evaporates.** `server/liveEvents/index.js` exports a
   `CACHE` singleton with a 12 h TTL that lives in Node memory. Vercel
   functions are stateless and spawn fresh per request — the cache resets
   on every invocation, so the live-fetch deduplication the orchestrator
   promises silently doesn't happen.
3. **Express on Vercel is second-class.** It works (via
   `@vercel/node` and a wrapper handler), but you give up streaming, hot
   modules, and the dev parity the team currently has with `npm start`.

Conclusion: **defer Vercel** until either the agent loop is restructured
to stream over the wire (which is a separate, larger workstream) or a
Pro plan is in hand and the §7 itinerary genuinely fits inside 60 s. For
now, deploy to a platform that runs the Express process as-is.

---

## Tech stack assumptions (no changes required for deploy)

- Node 18+ (Render default is 22; project's `engines.node` is `>=18` — works)
- `npm install && npm start` runs the server on `PORT` (already env-driven, default 3000)
- Static `public/` served by Express itself (no separate CDN needed for the PoC)
- No build step — pure JS server + static HTML/CSS

---

## File Structure

Files this plan creates or modifies (all under `outputs/concierge-app/`):

- **Create** `render.yaml` — Render Blueprint declaring the web service, env vars, and health check
- **Modify** `README.md` — append a "Deploy" section pointing at the Render URL and Blueprint
- **(Optional) Create** `.dockerignore` — only if Step 7 (Fly.io fallback) is taken

No application code changes are needed — the server already reads `PORT` from env (`server/index.js:22`) and serves static assets, and `/api/health` already exists for the platform health check.

---

## Pre-flight: confirm the local app works

Before deploying anything, prove `b07bcc9` works locally end-to-end. If any of these fail, deployment will too.

- [ ] **`.env` is populated.** In `server/.env` confirm `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ZAI_API_KEY` are all non-empty. `ZAI_MODEL` defaults to `glm-4.7-flash` (already set).
- [ ] **Supabase tables are seeded.** In Supabase SQL Editor confirm:
  ```sql
  select count(*) from resorts;        -- 10
  select count(*) from internal_docs;  -- 10
  select count(*) from bookings;       -- 16
  ```
  (If `member_lookup` returns `lookup_failed`, schema/seed wasn't run — see `SETUP.md`.)
- [ ] **`npm test` passes.** `cd server && npm test` → `pass 20`.
- [ ] **`/api/health` responds.** `npm start`, then `curl -s http://localhost:3000/api/health` → `{"ok":true,"model":"glm-4.7-flash"}`.
- [ ] **A `/api/chat` round-trip succeeds against GLM.** From the §7 matrix, send `100201` / `Whitman` and confirm a full Torquay itinerary is produced. This proves the GLM-via-Anthropic-SDK path works against your live Z.ai key before you put it on the internet.

---

## Task 1: Initialise a remote git repo

Render deploys from a git remote. The app currently has only a local git history. Create the remote first.

- [ ] **Step 1: Choose a host.** GitHub is the path of least resistance — Render's GitHub integration auto-deploys on push. If the repo must be private (this PoC handles real-ish member data structures and embeds a brand spec), use a private GitHub repo. GitLab and Bitbucket also work with Render.

- [ ] **Step 2: Confirm secrets are gitignored.** Already done — `.gitignore` excludes `server/.env`, `.env`, `.env.local`, `.env.*.local`. Double-check with:
  ```bash
  cd "outputs/concierge-app"
  git status --ignored | grep -E "\.env$|\.env\."
  ```
  Expect `.env` listed under ignored. If anything shows under "Untracked files", stop and update `.gitignore` first.

- [ ] **Step 3: Create the remote and push.**
  ```bash
  cd "outputs/concierge-app"
  # GitHub via gh CLI (private):
  gh repo create racv-concierge-poc --private --source=. --remote=origin
  git push -u origin main
  ```
  Verify on github.com that `server/.env` is NOT in the file list. If it is, treat as a leaked-secret incident: rotate the `ZAI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` immediately, delete the file from the remote, and re-push. (The local `.gitignore` should prevent this; check it pre-push.)

---

## Task 2: Write `render.yaml` Blueprint

A Blueprint lets Render provision the service with one click on every push, and keeps the spec in code. Render's docs: https://render.com/docs/blueprint-spec.

- [ ] **Step 1: Create `outputs/concierge-app/render.yaml`** with:

```yaml
services:
  - type: web
    name: racv-concierge
    runtime: node
    plan: free                    # change to "starter" ($7/mo) to remove 15-min idle shutdown
    rootDir: server               # repo root → server/ holds package.json
    buildCommand: npm install
    startCommand: npm start
    healthCheckPath: /api/health
    autoDeploy: true
    envVars:
      - key: NODE_VERSION
        value: 18
      - key: SUPABASE_URL
        sync: false               # set in dashboard; never committed
      - key: SUPABASE_SERVICE_ROLE_KEY
        sync: false
      - key: ZAI_API_KEY
        sync: false
      - key: ZAI_MODEL
        value: glm-4.7-flash      # safe to commit — not a secret
      - key: ZAI_BASE_URL
        value: https://api.z.ai/api/anthropic
      - key: RESORT_BRAND
        value: RACV
```

`sync: false` tells Render "this env var exists, do NOT sync its value from this YAML — set it in the dashboard or via API." That's how you keep the three secrets out of git.

- [ ] **Step 2: Commit the Blueprint.**
  ```bash
  cd "outputs/concierge-app"
  git add render.yaml
  git commit -m "chore(deploy): add Render Blueprint for one-click deploy"
  git push
  ```

---

## Task 3: Provision the service on Render

- [ ] **Step 1: Sign in.** https://dashboard.render.com → sign in with GitHub (the integration needs read access to the repo).

- [ ] **Step 2: Create a Blueprint instance.**
  - Dashboard → **New +** → **Blueprint**.
  - Pick the `racv-concierge-poc` repo.
  - Render reads `render.yaml`, shows you the service it's about to create, and prompts for the three `sync: false` secrets.

- [ ] **Step 3: Paste the three secrets.**
  - `SUPABASE_URL` = your Project URL (e.g. `https://xxxxxxxx.supabase.co`)
  - `SUPABASE_SERVICE_ROLE_KEY` = your service-role key (server-side only)
  - `ZAI_API_KEY` = your Z.ai key

  Render stores these encrypted at rest; they appear in the dashboard but never in build logs.

- [ ] **Step 4: Apply.** Click **Apply** / **Create**. Render clones the repo, runs `npm install` in `server/`, then `npm start`, then probes `/api/health` until it returns 200.

- [ ] **Step 5: Watch the first deploy.** The "Logs" tab will stream the startup line:
  ```
    RACV Concierge running:  http://localhost:10000
    Model: glm-4.7-flash (via https://api.z.ai/api/anthropic)   Brand: RACV
  ```
  (Render assigns its own internal port via `PORT`, hence `10000` not `3000`.)

  When the health check goes green you'll get a URL like
  `https://racv-concierge.onrender.com`.

---

## Task 4: Live verification on the deploy URL

The functional checklist from `HANDOVER.md §7` becomes the smoke test for the deployment.

- [ ] **Step 1: Health probe.**
  ```bash
  curl -s https://racv-concierge.onrender.com/api/health
  ```
  Expect `{"ok":true,"model":"glm-4.7-flash"}`. If `404` or `502`, check the Logs tab — usually a missing env var.

- [ ] **Step 2: Static assets.**
  - `https://racv-concierge.onrender.com/` → branded chat UI
  - `https://racv-concierge.onrender.com/img/racv-logo.svg` → logo
  - `https://racv-concierge.onrender.com/img/hero-resort.jpg` → hero image

- [ ] **Step 3: §7 row 1 (happy path).** In the deployed UI, log in as `100201` / `Whitman`, walk through the preference questions, confirm a Torquay 25–28 Jun itinerary is produced and mentions the Torquay Farmers Market on 27 Jun.

- [ ] **Step 4: §7 row 2 (no-match).** `100201` / `Wrong` → apologises, does NOT reveal which field failed.

- [ ] **Step 5: Long-tail rows (3–9).** Walk the full §7 matrix. None should change behaviour between local and Render — if any row regresses, the difference is almost certainly env var mismatch, not code.

- [ ] **Step 6: Mobile smoke.** Open on a phone. Header logo + "Member Concierge" should fit on one line; bubbles ~88% width; composer remains usable.

---

## Task 5: Hardening before sharing the URL externally

If you're about to send the URL to anyone outside your immediate team:

- [ ] **Step 1: Lock the repo or accept it's read-by-link.** Render's free tier doesn't gate access; anyone with the URL can chat. That's fine for a stakeholder demo but treat each session as observable for cost purposes.

- [ ] **Step 2: Set a soft request limit.** Add a per-IP rate limit to the chat route to prevent runaway costs from a curious crawler:
  - One-line option: `express-rate-limit` middleware applied to `/api/chat` only — 30 requests / 5 min per IP. Not in scope for this plan but worth the half-hour if the URL leaks. (Tracked as a follow-up.)

- [ ] **Step 3: Footer disclaimer is still visible.** Already in `index.html:235` from Plan Part 1 Task 5 — confirm it renders on the live URL.

- [ ] **Step 4: Custom domain (optional).** If you want `concierge.racv.example` instead of the onrender.com URL:
  - Render dashboard → service → **Settings** → **Custom Domains** → add domain.
  - Add a CNAME record at your DNS provider pointing to the Render-issued target.
  - Render provisions a Let's Encrypt cert automatically.

---

## Task 6: Operations & monitoring

- [ ] **Step 1: Tail logs.** In the Render dashboard, the Logs tab streams stdout/stderr. Look for the live-events warnings `[liveEvents] fetch failed: ...` — these are expected for JS-rendered sources and do not indicate a problem.

- [ ] **Step 2: Cold-start awareness (free tier only).** Render's free plan shuts the dyno after 15 min of no traffic. The first request after a sleep returns in ~30 s while the dyno wakes. Subsequent requests are fast. For a live demo: hit `/api/health` 30 s before showing the URL to warm the dyno. If this becomes annoying, upgrade to Starter ($7/mo).

- [ ] **Step 3: Cost monitor.** Render free tier is free forever, but every chat session calls Z.ai. Watch the Z.ai dashboard (https://z.ai/manage-apikey/usage) for spend. With `glm-4.7-flash` (the cheap tier) a full §7 walkthrough is fractions of a cent; budget worry only kicks in if a bot crawls the URL.

---

## Task 7: Fly.io fallback (only if Render misbehaves)

If Render's free tier proves too slow or you want a region closer to AU users (Render's Singapore region is the closest):

- [ ] Install `flyctl`: `brew install flyctl`
- [ ] `cd outputs/concierge-app/server && fly launch` — accept defaults, pick Sydney region.
- [ ] `fly secrets set SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ZAI_API_KEY=...`
- [ ] `fly deploy`
- [ ] Verify on the `*.fly.dev` URL using the same Task 4 checklist.

Fly's free tier has 3 shared-CPU 256 MB VMs in any single region — enough for one always-on instance of this app.

---

## Task 8: Vercel (deferred — only if requirements change)

If a future iteration restructures the agent loop to stream chunks back to the browser and brings each assistant turn under 60 s, Vercel becomes viable. Sketch:

- Wrap `server/index.js` in `api/chat.js` using `@vercel/node`.
- Move the static `public/` directory to Vercel's root for the CDN to serve directly.
- Replace the in-process `CACHE` singleton with Vercel KV or Upstash Redis for cross-invocation caching.
- Move to Vercel Pro for the 60 s timeout.

Not in scope for the PoC. Documented here only so a future engineer knows the migration path and what they'd have to change.

---

## Done

The deployment is complete when:

1. `https://<your-render-subdomain>.onrender.com/api/health` returns `{"ok":true,"model":"glm-4.7-flash"}` from a clean browser.
2. The deployed UI passes §7 row 1 end-to-end (Torquay itinerary mentions Farmers Market 27 Jun).
3. The three secrets (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ZAI_API_KEY`) live only in the Render dashboard — `git grep -i "ZAI_API_KEY=" -- ':!docs' ':!**/*.md'` finds zero hits with a real key value.
4. The Render Blueprint (`render.yaml`) is committed so future deploys are one click.
5. `README.md` mentions the live URL so the next person knows where to look.
