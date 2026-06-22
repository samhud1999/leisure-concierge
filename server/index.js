import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { buildSystemPrompt } from './systemPrompt.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  ZAI_API_KEY,
  ZAI_MODEL = 'glm-4.6',
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
// Safe column whitelists — sensitive fields are never selected, so even a
// successful prompt injection cannot surface them.
// ---------------------------------------------------------------------------
const MEMBER_SAFE = 'id, first_name, member_number, preferences';
const BOOKING_SAFE =
  'id, confirmation_code, check_in, check_out, room_type, party_size, party_composition, add_ons, status, resort:resorts(slug,name,town,state,region,latitude,longitude)';

// ---------------------------------------------------------------------------
// Weather (Open-Meteo — free, no key)
// ---------------------------------------------------------------------------
const WMO = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Depositing rime fog', 51: 'Light drizzle', 53: 'Moderate drizzle',
  55: 'Dense drizzle', 56: 'Light freezing drizzle', 57: 'Dense freezing drizzle',
  61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain', 66: 'Light freezing rain',
  67: 'Heavy freezing rain', 71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
  77: 'Snow grains', 80: 'Slight rain showers', 81: 'Moderate rain showers',
  82: 'Violent rain showers', 85: 'Slight snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail',
};

async function fetchWeather(lat, lon, start, end) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max` +
    `&timezone=auto&start_date=${start}&end_date=${end}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  const data = await res.json();
  const d = data.daily;
  if (!d || !d.time) return { available: false, note: 'No forecast returned for this range.' };
  return {
    available: true,
    days: d.time.map((date, i) => ({
      date,
      condition: WMO[d.weather_code[i]] ?? 'Unknown',
      temp_max_c: d.temperature_2m_max[i],
      temp_min_c: d.temperature_2m_min[i],
      precipitation_mm: d.precipitation_sum[i],
      precipitation_chance_pct: d.precipitation_probability_max[i],
    })),
  };
}

// ---------------------------------------------------------------------------
// Tool definitions (sent to the model via the Anthropic-compatible endpoint)
// ---------------------------------------------------------------------------
const TOOLS = [
  {
    name: 'member_lookup',
    description:
      'Verify a member by their member number AND surname. Returns the single matching member (first name only) or no match. Never returns sensitive fields. Treat no-match and ambiguous identically: do not reveal which field failed and do not list candidates.',
    input_schema: {
      type: 'object',
      properties: {
        member_number: { type: 'string' },
        surname: { type: 'string' },
      },
      required: ['member_number', 'surname'],
    },
  },
  {
    name: 'get_booking',
    description:
      "Retrieve the verified member's own booking(s): stay dates, room type, party size, party composition, add-ons, and the resort. Call only after a successful member_lookup, passing that member's id.",
    input_schema: {
      type: 'object',
      properties: { member_id: { type: 'integer' } },
      required: ['member_id'],
    },
  },
  {
    name: 'get_resort_knowledge',
    description:
      'Get the resort profile: amenities, dining venues, experiences, room types, and the local-area guide. Use the resort_slug from the booking.',
    input_schema: {
      type: 'object',
      properties: { resort_slug: { type: 'string' } },
      required: ['resort_slug'],
    },
  },
  {
    name: 'get_events',
    description:
      'Get local events for a resort that fall within a date range (the stay window). Dates are YYYY-MM-DD.',
    input_schema: {
      type: 'object',
      properties: {
        resort_slug: { type: 'string' },
        start_date: { type: 'string' },
        end_date: { type: 'string' },
      },
      required: ['resort_slug', 'start_date', 'end_date'],
    },
  },
  {
    name: 'get_weather',
    description:
      'Get the daily weather forecast for a resort over a date range (the stay window). Use it to steer outdoor vs indoor activities. Forecasts are only reliable ~16 days ahead.',
    input_schema: {
      type: 'object',
      properties: {
        resort_slug: { type: 'string' },
        start_date: { type: 'string' },
        end_date: { type: 'string' },
      },
      required: ['resort_slug', 'start_date', 'end_date'],
    },
  },
];

// ---------------------------------------------------------------------------
// Tool handlers (server-side, talk to Supabase / Open-Meteo)
// ---------------------------------------------------------------------------
async function resortBySlug(slug) {
  const { data } = await supabase
    .from('resorts')
    .select('id, slug, name, type, town, state, region, latitude, longitude, description')
    .eq('slug', slug)
    .maybeSingle();
  return data;
}

const handlers = {
  async member_lookup({ member_number, surname }) {
    const { data, error } = await supabase
      .from('members')
      .select(MEMBER_SAFE)
      .eq('member_number', String(member_number).trim())
      .ilike('surname', String(surname).trim());
    if (error) return { error: 'lookup_failed' };
    if (!data || data.length !== 1) return { found: false };
    const m = data[0];
    return { found: true, member: { id: m.id, first_name: m.first_name, known_preferences: m.preferences || {} } };
  },

  async get_booking({ member_id }) {
    const { data, error } = await supabase
      .from('bookings')
      .select(BOOKING_SAFE)
      .eq('member_id', member_id);
    if (error) return { error: 'booking_lookup_failed' };
    if (!data || data.length === 0) return { bookings: [] };
    // Only itinerary-relevant fields are present (other_guest_names is never selected).
    return { bookings: data };
  },

  async get_resort_knowledge({ resort_slug }) {
    const resort = await resortBySlug(resort_slug);
    if (!resort) return { error: 'resort_not_found' };
    const [amenities, dining, experiences, roomTypes, docs] = await Promise.all([
      supabase.from('amenities').select('name, category, environment, description').eq('resort_id', resort.id),
      supabase.from('dining').select('name, cuisine, environment, dietary_notes, hours, description').eq('resort_id', resort.id),
      supabase.from('experiences').select('name, category, environment, time_of_day, description').eq('resort_id', resort.id),
      supabase.from('room_types').select('name, description, sleeps, features').eq('resort_id', resort.id),
      supabase.from('internal_docs').select('title, content').eq('resort_id', resort.id),
    ]);
    return {
      resort: { name: resort.name, type: resort.type, town: resort.town, state: resort.state, region: resort.region, description: resort.description },
      amenities: amenities.data || [],
      dining: dining.data || [],
      experiences: experiences.data || [],
      room_types: roomTypes.data || [],
      local_guides: docs.data || [],
    };
  },

  async get_events({ resort_slug, start_date, end_date }) {
    const resort = await resortBySlug(resort_slug);
    if (!resort) return { error: 'resort_not_found' };
    // events overlapping [start_date, end_date]
    const { data, error } = await supabase
      .from('events')
      .select('name, start_date, end_date, event_time, location, category, environment, source_url, description')
      .eq('resort_id', resort.id)
      .lte('start_date', end_date)
      .order('start_date');
    if (error) return { error: 'events_lookup_failed' };
    const events = (data || []).filter((e) => (e.end_date || e.start_date) >= start_date);
    return { events };
  },

  async get_weather({ resort_slug, start_date, end_date }) {
    const resort = await resortBySlug(resort_slug);
    if (!resort) return { error: 'resort_not_found' };
    if (resort.latitude == null || resort.longitude == null) return { available: false, note: 'No coordinates on file.' };
    try {
      const w = await fetchWeather(resort.latitude, resort.longitude, start_date, end_date);
      return w;
    } catch (e) {
      return { available: false, note: 'Weather service unavailable; use seasonal judgement.' };
    }
  },
};

// ---------------------------------------------------------------------------
// Agent loop
// ---------------------------------------------------------------------------
const SYSTEM = buildSystemPrompt(RESORT_BRAND, new Date().toISOString().slice(0, 10));

async function runAgent(messages) {
  let turns = 0;
  while (turns++ < 12) {
    const resp = await anthropic.messages.create({
      model: ZAI_MODEL,
      max_tokens: 3000,
      system: SYSTEM,
      tools: TOOLS,
      messages,
    });

    messages.push({ role: 'assistant', content: resp.content });

    if (resp.stop_reason !== 'tool_use') {
      const text = resp.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
      return { reply: text, messages };
    }

    const toolResults = [];
    for (const block of resp.content) {
      if (block.type !== 'tool_use') continue;
      let result;
      try {
        result = await (handlers[block.name]?.(block.input) ?? { error: 'unknown_tool' });
      } catch (e) {
        result = { error: 'tool_exception', detail: String(e.message || e) };
      }
      toolResults.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: JSON.stringify(result),
      });
    }
    messages.push({ role: 'user', content: toolResults });
  }
  return { reply: "I'm sorry, I had trouble completing that. Could you try again?", messages };
}

// ---------------------------------------------------------------------------
// HTTP server
// ---------------------------------------------------------------------------
const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages)) return res.status(400).json({ error: 'messages[] required' });
    const out = await runAgent(messages);
    res.json({ reply: out.reply, messages: out.messages });
  } catch (e) {
    console.error('[chat] error', e);
    res.status(500).json({ error: 'server_error', detail: String(e.message || e) });
  }
});

app.get('/api/health', (_req, res) => res.json({ ok: true, model: ZAI_MODEL }));

app.listen(PORT, () => {
  console.log(`\n  RACV Concierge running:  http://localhost:${PORT}`);
  console.log(`  Model: ${ZAI_MODEL} (via ${ZAI_BASE_URL})   Brand: ${RESORT_BRAND}\n`);
});
