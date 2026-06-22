import { load } from 'cheerio';

function splitDateTime(iso) {
  if (typeof iso !== 'string') return [null, null];
  const m = iso.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  return m ? [m[1], m[2]] : [iso.slice(0, 10) || null, null];
}

function asArray(jsonLd) {
  if (Array.isArray(jsonLd)) return jsonLd;
  if (jsonLd && typeof jsonLd === 'object') return [jsonLd];
  return [];
}

export function extract(html) {
  const $ = load(html);
  const events = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).text();
    let parsed;
    try { parsed = JSON.parse(raw); } catch { return; }
    for (const node of asArray(parsed)) {
      if (node?.['@type'] !== 'Event') continue;
      const [start_date, start_time] = splitDateTime(node.startDate);
      const [end_date] = splitDateTime(node.endDate);
      if (!node.name || !start_date) continue;
      const location =
        typeof node.location === 'string'
          ? node.location
          : node.location?.name || null;
      events.push({
        name: node.name,
        start_date,
        end_date,
        event_time: start_time,
        location,
        description: node.description || null,
      });
    }
  });
  return events;
}
