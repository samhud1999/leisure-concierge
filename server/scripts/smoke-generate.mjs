#!/usr/bin/env node
import 'dotenv/config';
import { AzureOpenAI } from 'openai';
import { createClient } from '@supabase/supabase-js';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateItinerary } from '../itinerary/generator.js';

const {
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
  AZURE_AI_FOUNDRY_ENDPOINT,
  AZURE_AI_FOUNDRY_API_KEY,
  AZURE_AI_FOUNDRY_MODEL = 'gpt-5',
  AZURE_AI_FOUNDRY_API_VERSION = '2024-12-01-preview',
} = process.env;

for (const [k, v] of Object.entries({
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
  AZURE_AI_FOUNDRY_ENDPOINT, AZURE_AI_FOUNDRY_API_KEY,
})) {
  if (!v) { console.error(`Missing env: ${k}`); process.exit(1); }
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const llm = new AzureOpenAI({
  endpoint:   AZURE_AI_FOUNDRY_ENDPOINT,
  apiKey:     AZURE_AI_FOUNDRY_API_KEY,
  apiVersion: AZURE_AI_FOUNDRY_API_VERSION,
  deployment: AZURE_AI_FOUNDRY_MODEL,
});

// Resolve the token for Eleanor's RACV-TQ-3001 booking.
const { data: row } = await supabase
  .from('itineraries').select('token, booking_id, member_id')
  .eq('booking_id', 'RACV-TQ-3001').single();

if (!row) { console.error("No itinerary row for RACV-TQ-3001 — did you run db/v2_itineraries.sql?"); process.exit(2); }

console.log(`Generating for booking ${row.booking_id} (token ${row.token})…`);
const t0 = Date.now();
const itinerary = await generateItinerary({ token: row.token, supabase, llm, model: AZURE_AI_FOUNDRY_MODEL });
const dt = ((Date.now() - t0) / 1000).toFixed(1);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(__dirname, 'snapshots', `100201-${row.booking_id}.json`);
await mkdir(path.dirname(out), { recursive: true });
await writeFile(out, JSON.stringify(itinerary, null, 2));

console.log(`\nDone in ${dt}s. Wrote ${out}`);
console.log(`\nSummary highlights:`);
for (const h of itinerary.summary.highlights || []) console.log(`  • ${h}`);
console.log(`\nDays: ${itinerary.days.length}`);
for (const d of itinerary.days) {
  console.log(`  ${d.label}  ·  ${d.weather?.condition ?? '?'}  ·  ${d.blocks.length} blocks`);
}
