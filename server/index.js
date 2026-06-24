import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { AzureOpenAI } from 'openai';
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
  AZURE_AI_FOUNDRY_ENDPOINT,
  AZURE_AI_FOUNDRY_API_KEY,
  AZURE_AI_FOUNDRY_MODEL = 'gpt-5',
  AZURE_AI_FOUNDRY_API_VERSION = '2025-04-01-preview',
  PORT = 3000,
  RESORT_BRAND = 'RACV',
} = process.env;

for (const [k, v] of Object.entries({
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
  AZURE_AI_FOUNDRY_ENDPOINT, AZURE_AI_FOUNDRY_API_KEY,
})) {
  if (!v) {
    console.error(`\n[config] Missing required env var: ${k}. Copy .env.example to .env and fill it in.\n`);
    process.exit(1);
  }
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const llm = new AzureOpenAI({
  endpoint:   AZURE_AI_FOUNDRY_ENDPOINT,
  apiKey:     AZURE_AI_FOUNDRY_API_KEY,
  apiVersion: AZURE_AI_FOUNDRY_API_VERSION,
  deployment: AZURE_AI_FOUNDRY_MODEL,
});

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

mountItineraryApi(app, { supabase, llm, model: AZURE_AI_FOUNDRY_MODEL });
mountLoginRoute(app, { supabase });
mountItineraryPage(app, { supabase, publicDir: PUBLIC_DIR });

app.get('/api/health', (_req, res) => res.json({ ok: true, model: AZURE_AI_FOUNDRY_MODEL }));

app.listen(PORT, () => {
  console.log(`\n  Leisure Concierge running:  http://localhost:${PORT}`);
  console.log(`  Model: ${AZURE_AI_FOUNDRY_MODEL} (via Azure AI Foundry)   Brand: ${RESORT_BRAND}\n`);
});
