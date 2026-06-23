// Read-only tool handlers shared between the legacy /api/chat agent (server/index.js)
// and the new chat refinement agent (server/agent/chatAgent.js).
// Accepts supabase client as a parameter so the module is import-safe in tests.

// ---------------------------------------------------------------------------
// Safe column whitelists — sensitive fields are never selected.
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
// Factory: given a supabase client (and optionally live-events helpers),
// returns the 5 read-only handler functions keyed by tool name.
// ---------------------------------------------------------------------------
export function makeReadonlyHandlers(supabase, { fetchLiveEventsFor, liveEventsCache } = {}) {
  async function resortBySlug(slug) {
    const { data } = await supabase
      .from('resorts')
      .select('id, slug, name, type, town, state, region, latitude, longitude, description')
      .eq('slug', slug)
      .maybeSingle();
    return data;
  }

  return {
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

      const [seedResult, sourcesResult] = await Promise.all([
        supabase
          .from('events')
          .select('name, start_date, end_date, event_time, location, category, environment, source_url, description')
          .eq('resort_id', resort.id)
          .lte('start_date', end_date)
          .order('start_date'),
        supabase
          .from('event_sources')
          .select('url, name')
          .eq('resort_id', resort.id),
      ]);

      if (seedResult.error) return { error: 'events_lookup_failed' };
      if (sourcesResult.error) {
        console.warn('[get_events] event_sources lookup failed — live fetch skipped:', sourcesResult.error.message);
      }

      const seedEvents = (seedResult.data || []).filter(
        (e) => (e.end_date || e.start_date) >= start_date
      );

      let liveEvents = [];
      if (fetchLiveEventsFor) {
        try {
          liveEvents = await fetchLiveEventsFor({
            sources: sourcesResult.data || [],
            start_date,
            end_date,
            cache: liveEventsCache,
          });
        } catch (e) {
          console.warn('[get_events] live fetch threw — falling back to seed only:', e.message);
        }
      }

      const seen = new Set(seedEvents.map((e) => `${e.name}|${e.start_date}`));
      const merged = [...seedEvents];
      for (const ev of liveEvents) {
        const key = `${ev.name}|${ev.start_date}`;
        if (seen.has(key)) continue;
        seen.add(key);
        merged.push(ev);
      }
      merged.sort((a, b) => (a.start_date < b.start_date ? -1 : a.start_date > b.start_date ? 1 : 0));

      return { events: merged };
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
}
