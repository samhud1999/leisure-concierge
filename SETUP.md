# RACV Member Concierge — Build & Setup Guide

This is the end-to-end process for standing up the concierge proof-of-concept:
a **standalone web app** (chat UI + backend) backed by **Supabase** (Postgres),
with real RACV resort knowledge, dummy bookings, your uploaded local guides,
events from your allow-listed sources, and live weather via **Open-Meteo**
(free, no API key).

---

## Architecture at a glance

```
Browser (chat UI)
      │  HTTPS
      ▼
Backend server (Node/Express)
      ├─ Z.ai GLM (Anthropic-compat) ... runs the concierge agent (the system prompt)
      ├─ Supabase (service key) ........ members, bookings, resorts, knowledge, events
      └─ Open-Meteo API ................ live weather forecast for the resort + stay dates
```

- **Supabase** holds all the data. The backend talks to it with the **service
  role key**, server-side only.
- The **agent logic** (identity gate, preference menu, itinerary build, security
  guardrails) lives in the backend and is driven by your system prompt.
- The **browser never sees** the service key or the Z.ai key — only the backend does.

---

## What I build vs. what you do

| # | Step | Who |
|---|------|-----|
| 1 | Database schema (`db/schema.sql`) | ✅ Me (done) |
| 2 | Seed data: real resorts + dummy members/bookings (`db/seed.sql`) | ✅ Me |
| 3 | Load your local guides into `internal_docs` + event sources | ✅ Me |
| 4 | Web app: backend + chat UI | ✅ Me |
| 5 | **Create the Supabase project** | 👉 You |
| 6 | **Run `schema.sql` then `seed.sql` in Supabase** | 👉 You |
| 7 | **Send me your Supabase URL + keys, and a Z.ai API key** | 👉 You |
| 8 | I wire the `.env`, run it, and we test end-to-end | ✅ Me |

---

## YOUR INSTRUCTIONS — do these exactly

### Step 1 — Create a Supabase project
1. Go to **https://supabase.com** and sign in (or sign up — free tier is fine).
2. Click **New project**.
3. Fill in:
   - **Name:** `racv-concierge`
   - **Database password:** generate a strong one and **save it somewhere safe**.
   - **Region:** choose **Southeast Asia (Singapore)** or **Australia (Sydney)** if offered — closest to AU.
4. Click **Create new project** and wait ~2 minutes for it to provision.

### Step 2 — Create the tables
1. In the left sidebar, open **SQL Editor**.
2. Click **+ New query**.
3. Open the file `db/schema.sql` (I created it), copy its entire contents, paste into the editor.
4. Click **Run** (or press Cmd/Ctrl+Enter). You should see "Success. No rows returned."

### Step 3 — Load the data (two files, in order)
1. Still in the **SQL Editor**, click **+ New query**.
2. Open `db/seed.sql`, copy all of it, paste, and **Run**.
3. Click **+ New query** again, open `db/seed_docs.sql` (the 10 local-area
   guides), copy all of it, paste, and **Run**.
4. Click **+ New query** again, open `db/v2_itineraries.sql` (the V2 itineraries table + pre-issued tokens), copy all of it, paste, and **Run**.
5. To confirm V2, run: `select count(*) from itineraries;` — you should see 16 (matches the booking count).

### Step 4 — Get your keys (I need these)
1. In the left sidebar go to **Project Settings** (gear icon) → **API**.
2. Copy these three values and send them to me:
   - **Project URL** (looks like `https://xxxxxxxx.supabase.co`)
   - **`anon` `public` key**
   - **`service_role` key**  ⚠️ this one is **secret** — treat it like a password.

   > ⚠️ The `service_role` key bypasses row-level security. Only ever put it in the
   > backend `.env`, never in frontend code or a public repo. For a throwaway PoC
   > this is fine; rotate or delete the project when you're done.

### Step 5 — Z.ai API key (powers the agent)
1. Go to **https://z.ai/model-api** → sign in → **API Keys** → **Create key**.
2. Copy it and send it to me (also secret).

   The backend uses Z.ai's **Anthropic-compatible** endpoint
   (`https://api.z.ai/api/anthropic`), so the Anthropic SDK is the client and
   no Anthropic key is needed. Default model is `glm-4.7-flash` (cheap & fast
   for dev/test); swap via `ZAI_MODEL` in `.env` to `glm-4.7`, `glm-4.6`,
   `glm-4.5`, or `glm-4.5-air` when you want a different tier.

   > If you'd rather not paste keys into chat, I'll instead give you a `.env`
   > template and you can fill it in locally and just run the app yourself —
   > tell me which you prefer.

---

## After you send the keys

I will:
1. Drop them into `server/.env`.
2. Start the backend (`npm install && npm start`).
3. Open the chat UI and run the test scenarios (valid member, no-match, missing
   dates, weather steering, and the security/privacy checks).

---

## Notes / decisions

- **Weather:** Open-Meteo, called live at request time using each resort's
  lat/long. Free, no key, real forecasts (up to ~16 days out) — so keep dummy
  booking dates within ~2 weeks of "today" for live weather, or I'll fall back
  to seasonal guidance for dates further out.
- **Events:** loaded from your allow-listed source sites into the `events`
  table. The agent only uses events within the member's stay window.
- **City Club Melbourne:** you provided a guide for it, so I've kept it as a
  property even though it's technically a club, not a resort.
- **Privacy:** sensitive columns (email, phone, ID number, other guests' names)
  exist in the schema to be realistic, but the agent is instructed never to read
  them out. They're flagged in `schema.sql`.

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
