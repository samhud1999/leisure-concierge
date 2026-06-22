import { load } from 'cheerio';

const TIME_RE = /(\d{1,2}\s*(?:am|pm)[^—]*?\d{1,2}\s*(?:am|pm))/i;
const LOCATION_RE = /at\s+([^.]+)$/i;

export function extract(html) {
  const $ = load(html);
  const events = [];
  $('ul.market-dates li').each((_, el) => {
    const $el = $(el);
    const date = $el.find('time').attr('datetime');
    if (!date) return;
    const text = $el.text().replace(/\s+/g, ' ').trim();
    const time = text.match(TIME_RE)?.[1]?.trim() || null;
    const location = text.match(LOCATION_RE)?.[1]?.trim() || null;
    events.push({
      name: 'Torquay Cowrie Market',
      start_date: date,
      event_time: time,
      location,
      category: 'market',
      environment: 'outdoor',
    });
  });
  return events;
}
