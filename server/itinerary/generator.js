import Anthropic from '@anthropic-ai/sdk';
import { validateGenerated, softRepair } from './schema.js';
import { regenerateHighlights } from './summarizer.js';

// --- Weather field rename --------------------------------------------------
// Open-Meteo (server/index.js fetchWeather) returns:
//   { available, days: [{ date, condition, temp_max_c, temp_min_c,
//                         precipitation_mm, precipitation_chance_pct }] }
// We rename to itinerary names (precip_pct, precip_mm).
export function mapWeather(openMeteo) {
  if (!openMeteo?.available || !Array.isArray(openMeteo.days)) return [];
  return openMeteo.days.map(d => ({
    date: d.date,
    condition: d.condition,
    temp_max_c: d.temp_max_c,
    temp_min_c: d.temp_min_c,
    precip_pct: d.precipitation_chance_pct ?? 0,
    precip_mm: d.precipitation_mm ?? 0,
  }));
}

// --- System prompt builder -------------------------------------------------
export function buildGeneratorPrompt({ member, booking, resort, events, weather }) {
  return [
    "You are RACV's concierge generating a member’s day-by-day stay itinerary.",
    '',
    'OUTPUT only ONE JSON object matching the SCHEMA below. Nothing else. No prose, no markdown, no fenced code blocks.',
    '',
    'SCHEMA. Return exactly these top-level fields:',
    '{ "preferences": { party_kind, dietary, pace, interests },',
    '  "summary":     { highlights: [string, ...] },',
    '  "days":        [ { id, date, label, weather, blocks: [...] } ] }',
    '',
    'BLOCK SHAPE:',
    '{ id, kind, time_of_day, icon, title, description, venue, source_url, pinned }',
    '  kind values: arrival, dining, activity, spa, event, departure, free.',
    '  time_of_day values: morning, midday, afternoon, evening.',
    '',
    'HARD RULES:',
    `- One day per night plus one for the departure day. Nights=${booking.nights}, days=${booking.nights + 1}.`,
    "- First day's first block: kind=\"arrival\". Last day's last block: kind=\"departure\".",
    '- Blocks per day:',
    '    nights <= 3 produces 2 to 4 blocks. No rest or free days.',
    '    nights 4 to 6 produces 2 to 3 blocks. One rest day if 6 nights.',
    '    nights >= 7 produces 1 to 2 blocks. One rest day every ~3 days.',
    '- If weather precip_pct > 60 OR precip_mm > 5, schedule no outdoor blocks that day. Pick indoor options (spa, dining, indoor amenity) or sheltered events.',
    '- If booking.add_ons mentions a spa package, schedule 1 to 2 spa blocks on fair-weather days.',
    '- If events[] overlaps the stay window, surface the most relevant 1 to 2 as blocks with kind="event". Prefer Saturday markets, music, family.',
    '- Stable IDs: days "day-1" through "day-N", blocks "blk-101" through "blk-NNN".',
    "- Default preferences (V1 has none yet): party_kind from party_size (1=solo, 2=couple, 3-4=family if any child indication, else friends), dietary=null, pace=\"balanced\", interests=[].",
    '',
    'SOFT RULES:',
    "- Match the resort's vibe. Coastal walks at coastal resorts. Golf at golf resorts.",
    "- Personalise to the resort's own dining and experiences first.",
    '- VARIETY across the stay. Do not repeat the same activity, the same restaurant, or the same kind of outing more than ONCE across all days. If the resort has limited dining options, rotate venues across days so two dinners do not land at the same place. If you propose a coastal walk on Day 2, propose a different walk on later days. Mix categories across days so each day feels distinct (one beach day, one cultural day, one slow day, etc.).',
    '- A specific named restaurant or named experience may appear in the itinerary at most ONCE total. The exception is the resort\'s main pool, lounge, or other passive amenities, which can recur as filler.',
    '- Each block.description: 140 characters or fewer. Each title: 40 characters or fewer.',
    '',
    'WRITING STYLE (apply to every title and description):',
    '- Plain confident concierge English. Treat the reader as a guest, not a query.',
    "- Never use AI-style filler phrases. Avoid: \"I'll help you\", \"Let me assist\", \"I can help with\", \"As an AI\", \"Sure, here is\", \"Feel free to\", \"Happy to assist\".",
    '- Never use em dashes (the long dash character). Use a period, comma, or "and" instead. Hyphens in compound words are fine.',
    '- No emojis in text. The icon field carries the visual marker.',
    '- Active voice. Short sentences. Concrete nouns over adjectives.',
    '',
    'BRIEF:',
    JSON.stringify({ member, booking, resort, events, weather }, null, 2),
    '',
    'Return ONLY the JSON. Start with {.',
  ].join('\n');
}

// --- Assemble wrapper + generated -----------------------------------------
export function assembleDoc({ generated, wrapper }) {
  return {
    version: 1,
    updated_at: new Date().toISOString(),
    booking_id: wrapper.booking_id,
    token: wrapper.token,
    member: wrapper.member,
    stay: wrapper.stay,
    resort: wrapper.resort,
    preferences: generated.preferences,
    summary: generated.summary,
    days: generated.days,
  };
}

// --- Orchestration --------------------------------------------------------
// (Tested via the route integration test in Task 5, not here — a unit test
// would require a Supabase mock heavier than the value it adds.)
export async function generateItinerary({ token, supabase, anthropic, model, signal }) {
  // 1. Load itinerary row + booking + member + resort + events + weather.
  const { data: row, error } = await supabase
    .from('itineraries')
    .select('booking_id, member_id, status, doc, version')
    .eq('token', token)
    .maybeSingle();
  if (error || !row) throw Object.assign(new Error('itinerary_not_found'), { httpStatus: 404 });
  if (row.status === 'ready' && row.doc && Object.keys(row.doc).length) {
    return row.doc;                                  // idempotent: serve cached
  }

  const { data: booking } = await supabase
    .from('bookings')
    .select('confirmation_code, check_in, check_out, room_type, party_size, add_ons, party_composition, resort:resorts(slug,name,town,state,region,latitude,longitude,description)')
    .eq('confirmation_code', row.booking_id)
    .single();
  const { data: member } = await supabase
    .from('members')
    .select('id, first_name, member_number')
    .eq('id', row.member_id)
    .single();
  const resortId = (await supabase.from('resorts').select('id').eq('slug', booking.resort.slug).single()).data.id;
  const [amenities, dining, experiences, roomTypes, docs, events] = await Promise.all([
    supabase.from('amenities').select('name,category,environment,description').eq('resort_id', resortId),
    supabase.from('dining').select('name,cuisine,environment,dietary_notes,hours,description').eq('resort_id', resortId),
    supabase.from('experiences').select('name,category,environment,time_of_day,description').eq('resort_id', resortId),
    supabase.from('room_types').select('name,description,sleeps,features').eq('resort_id', resortId),
    supabase.from('internal_docs').select('title,content').eq('resort_id', resortId),
    supabase.from('events').select('name,start_date,end_date,event_time,location,category,environment,source_url,description')
      .eq('resort_id', resortId).gte('start_date', booking.check_in).lte('start_date', booking.check_out),
  ]);

  const nights = Math.round((new Date(booking.check_out) - new Date(booking.check_in)) / 86400000);

  // Weather: re-use existing server/index.js fetcher via direct fetch — keep
  // generator self-contained.
  const w = await fetchWeather(booking.resort.latitude, booking.resort.longitude, booking.check_in, booking.check_out);
  const weather = mapWeather(w);

  const brief = {
    member: { first_name: member.first_name },
    booking: { check_in: booking.check_in, check_out: booking.check_out, nights, room_type: booking.room_type, party_size: booking.party_size, add_ons: booking.add_ons || [] },
    resort: {
      name: booking.resort.name, town: booking.resort.town, region: booking.resort.region,
      amenities: amenities.data || [], dining: dining.data || [],
      experiences: experiences.data || [], room_types: roomTypes.data || [],
      local_guides: docs.data || [],
    },
    events: events.data || [],
    weather,
  };

  // 2. Call GLM once.
  const prompt = buildGeneratorPrompt(brief);
  const generated = await callGenerator({ anthropic, model, prompt, signal });

  // 3. Soft-repair + validate.
  const repaired = softRepair(generated, { weather: { days: weather } });
  const v = validateGenerated(repaired);
  if (!v.ok) throw Object.assign(new Error('generator_invalid'), { errors: v.errors, httpStatus: 502 });

  // 4. Assemble wrapper + persist.
  const wrapper = {
    booking_id: row.booking_id,
    token,
    member: { first_name: member.first_name, member_number: member.member_number },
    stay: { check_in: booking.check_in, check_out: booking.check_out, nights, room_type: booking.room_type, party_size: booking.party_size, add_ons: booking.add_ons || [] },
    resort: { slug: booking.resort.slug, name: booking.resort.name, town: booking.resort.town, region: booking.resort.region,
              hero_image: `/img/resorts/${booking.resort.slug}.jpg`,
              summary: booking.resort.description || '' },
  };
  const full = assembleDoc({ generated: v.doc, wrapper });
  full.summary.highlights = regenerateHighlights(full);

  await supabase.from('itineraries')
    .update({ doc: full, version: 1, status: 'ready', last_error: null, updated_at: new Date().toISOString() })
    .eq('token', token);

  return full;
}

// --- Internal: GLM call with one-retry parse + validate retry --------------
async function callGenerator({ anthropic, model, prompt, signal, attempt = 0 }) {
  const resp = await anthropic.messages.create({
    model, max_tokens: 6000, system: prompt, messages: [{ role: 'user', content: 'Produce the JSON now.' }],
  }, { signal });
  const text = resp.content.filter(b => b.type === 'text').map(b => b.text).join('');
  const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    if (attempt < 1) {
      const retryPrompt = prompt +
        "\n\nYour last response was not valid JSON. Return ONLY the JSON object starting with `{`. No prose, no code fences.";
      return callGenerator({ anthropic, model, prompt: retryPrompt, signal, attempt: attempt + 1 });
    }
    throw Object.assign(new Error('generator_unparseable'), { httpStatus: 502, raw: text });
  }
}

// --- Internal: weather fetch (duplicated from server/index.js intentionally
// to keep the generator self-contained for unit testing) -------------------
async function fetchWeather(lat, lon, start, end) {
  if (lat == null || lon == null) return { available: false };
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max` +
    `&timezone=auto&start_date=${start}&end_date=${end}`;
  const res = await fetch(url);
  if (!res.ok) return { available: false };
  const data = await res.json();
  const d = data.daily;
  if (!d || !d.time) return { available: false };
  const WMO = { 0:'Clear',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Fog',48:'Fog',51:'Light drizzle',53:'Drizzle',55:'Heavy drizzle',61:'Light rain',63:'Rain',65:'Heavy rain',71:'Light snow',73:'Snow',75:'Heavy snow',80:'Showers',81:'Showers',82:'Heavy showers',95:'Thunderstorm' };
  return {
    available: true,
    days: d.time.map((date, i) => ({
      date, condition: WMO[d.weather_code[i]] ?? 'Unknown',
      temp_max_c: d.temperature_2m_max[i], temp_min_c: d.temperature_2m_min[i],
      precipitation_mm: d.precipitation_sum[i], precipitation_chance_pct: d.precipitation_probability_max[i],
    })),
  };
}
