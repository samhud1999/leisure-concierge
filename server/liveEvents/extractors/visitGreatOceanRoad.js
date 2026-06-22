import { load } from 'cheerio';

const CATEGORY_WORDS = {
  music: 'music',
  market: 'market',
  food: 'food_wine',
  wine: 'food_wine',
  sport: 'sport',
  family: 'family',
  culture: 'culture',
  art: 'culture',
};

function pickCategory(tagsText) {
  const lower = (tagsText || '').toLowerCase();
  for (const [word, cat] of Object.entries(CATEGORY_WORDS)) {
    if (lower.includes(word)) return cat;
  }
  return null;
}

function pickEnvironment(tagsText) {
  const lower = (tagsText || '').toLowerCase();
  if (lower.includes('indoor')) return 'indoor';
  if (lower.includes('covered')) return 'covered';
  return 'outdoor';
}

export function extract(html) {
  const $ = load(html);
  const events = [];
  $('article.event-card').each((_, el) => {
    const $el = $(el);
    const name = $el.find('.event-title').text().trim();
    const $date = $el.find('.event-date');
    const start_date = $date.attr('data-start');
    if (!name || !start_date) return;
    const end_date = $date.attr('data-end') || null;
    const event_time = $el.find('.event-meta .time').text().trim() || null;
    const location = $el.find('.event-meta .venue').text().trim() || null;
    const tagsText = $el.find('.event-tags').text();
    const description = $el.find('.event-summary').text().trim() || null;
    events.push({
      name,
      start_date,
      end_date,
      event_time,
      location,
      category: pickCategory(tagsText),
      environment: pickEnvironment(tagsText),
      description,
    });
  });
  return events;
}
