const VALID_ENV = new Set(['indoor', 'outdoor', 'covered']);

function clean(s) {
  return typeof s === 'string' ? s.trim() : null;
}

export function normalizeEvent(raw, defaults) {
  const name = clean(raw?.name);
  const start_date = clean(raw?.start_date);
  if (!name || !start_date) return null;

  const env = VALID_ENV.has(raw.environment) ? raw.environment : defaults.environment;

  return {
    name,
    start_date,
    end_date: clean(raw.end_date) || null,
    event_time: clean(raw.event_time) || null,
    location: clean(raw.location) || null,
    category: clean(raw.category) || null,
    environment: env,
    source_url: clean(raw.source_url) || defaults.source_url,
    description: clean(raw.description) || null,
  };
}
