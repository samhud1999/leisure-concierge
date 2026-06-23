import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { mountItineraryApi } from './routes/itineraryApi.js';
import { mountLoginRoute } from './routes/login.js';
import { mountItineraryPage } from './routes/itineraryPage.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  ZAI_API_KEY,
  ZAI_MODEL = 'glm-4.7-flash',
  ZAI_BASE_URL = 'https://api.z.ai/api/anthropic',
  PORT = 3000,
  RESORT_BRAND = 'RACV',
} = process.env;

for (const [k, v] of Object.entries({ SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ZAI_API_KEY })) {
  if (!v) {
    console.error(`\n[config] Missing required env var: ${k}. Copy .env.example to .env and fill it in.\n`);
    process.exit(1);
  }
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const anthropic = new Anthropic({ apiKey: ZAI_API_KEY, baseURL: ZAI_BASE_URL });

// ---------------------------------------------------------------------------
// HTTP server
// ---------------------------------------------------------------------------
const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'login.html'));
});

app.use(express.static(path.join(__dirname, '..', 'public')));

mountItineraryApi(app, { supabase, anthropic, model: ZAI_MODEL });
mountLoginRoute(app, { supabase });
mountItineraryPage(app, { supabase, publicDir: PUBLIC_DIR });

app.get('/api/health', (_req, res) => res.json({ ok: true, model: ZAI_MODEL }));

app.listen(PORT, () => {
  console.log(`\n  RACV Concierge running:  http://localhost:${PORT}`);
  console.log(`  Model: ${ZAI_MODEL} (via ${ZAI_BASE_URL})   Brand: ${RESORT_BRAND}\n`);
});
