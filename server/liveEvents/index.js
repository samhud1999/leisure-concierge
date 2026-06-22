import { httpFetch } from './httpFetch.js';
import { createTtlCache } from './cache.js';
import { resolveExtractor } from './extractors/index.js';
import { normalizeEvent } from './normalize.js';

export const CACHE = createTtlCache({ ttlMs: 12 * 60 * 60 * 1000 }); // 12 hours

function overlaps(ev, start, end) {
  const evStart = ev.start_date;
  const evEnd = ev.end_date || ev.start_date;
  return evStart <= end && evEnd >= start;
}

export async function fetchLiveEventsFor({ sources, start_date, end_date, fetcher = httpFetch, cache = null }) {
  if (!cache) cache = createTtlCache({ ttlMs: 12 * 60 * 60 * 1000 });
  const results = [];
  for (const src of sources) {
    const extract = resolveExtractor(src.url);
    if (!extract) continue;
    let html;
    try {
      html = await cache.getOrCompute(src.url, () => fetcher(src.url));
    } catch (e) {
      console.warn(`[liveEvents] fetch failed: ${src.url} — ${e.message}`);
      continue;
    }
    let raw;
    try {
      raw = extract(html);
    } catch (e) {
      console.warn(`[liveEvents] extract failed: ${src.url} — ${e.message}`);
      continue;
    }
    const defaults = { source_url: src.url, environment: 'outdoor' };
    for (const item of raw) {
      const normalized = normalizeEvent(item, defaults);
      if (!normalized) continue;
      if (overlaps(normalized, start_date, end_date)) results.push(normalized);
    }
  }
  return results;
}
