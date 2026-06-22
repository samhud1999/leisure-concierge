import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchLiveEventsFor } from '../index.js';

const SOURCES = [
  { url: 'https://torquaycowriemarket.com/', name: 'Cowrie Market' },
  { url: 'https://visitgreatoceanroad.org.au/torquaylife/whats-on', name: 'VGOR Torquay' },
];

function fakeFetcher(map) {
  return async (url) => {
    if (!(url in map)) throw new Error(`no fixture for ${url}`);
    const v = map[url];
    if (v instanceof Error) throw v;
    return v;
  };
}

const COWRIE_HTML = `
  <ul class="market-dates">
    <li><time datetime="2026-06-27">27 Jun</time> — 9am to 1pm at Elephant Walk Reserve</li>
    <li><time datetime="2026-07-25">25 Jul</time> — 9am to 1pm at Elephant Walk Reserve</li>
  </ul>`;
const VGOR_HTML = `
  <article class="event-card">
    <h3 class="event-title">Torquay Sunset Sessions</h3>
    <p class="event-date" data-start="2026-06-26">26 Jun</p>
    <p class="event-meta"><span class="time">5pm – 8pm</span> · <span class="venue">Foreshore</span></p>
    <p class="event-tags">Music · Outdoor</p>
  </article>`;

test('orchestrator returns events from multiple sources within window', async () => {
  const fetcher = fakeFetcher({
    'https://torquaycowriemarket.com/': COWRIE_HTML,
    'https://visitgreatoceanroad.org.au/torquaylife/whats-on': VGOR_HTML,
  });
  const out = await fetchLiveEventsFor({
    sources: SOURCES,
    start_date: '2026-06-25',
    end_date: '2026-06-28',
    fetcher,
  });
  // Cowrie 27 Jun in-window, Cowrie 25 Jul out, VGOR 26 Jun in-window.
  assert.equal(out.length, 2);
  const names = out.map((e) => e.name).sort();
  assert.deepEqual(names, ['Torquay Cowrie Market', 'Torquay Sunset Sessions']);
  for (const e of out) {
    assert.ok(e.source_url, 'source_url is set on every event');
    assert.ok(['indoor', 'outdoor', 'covered'].includes(e.environment));
  }
});

test('orchestrator skips a source whose fetcher rejects', async () => {
  const fetcher = fakeFetcher({
    'https://torquaycowriemarket.com/': COWRIE_HTML,
    'https://visitgreatoceanroad.org.au/torquaylife/whats-on': new Error('network down'),
  });
  const out = await fetchLiveEventsFor({
    sources: SOURCES,
    start_date: '2026-06-25',
    end_date: '2026-06-28',
    fetcher,
  });
  assert.equal(out.length, 1);
  assert.equal(out[0].name, 'Torquay Cowrie Market');
});

test('orchestrator skips sources with no registered extractor', async () => {
  const out = await fetchLiveEventsFor({
    sources: [{ url: 'https://random-unregistered.example/events' }],
    start_date: '2026-06-25',
    end_date: '2026-06-28',
    fetcher: fakeFetcher({ 'https://random-unregistered.example/events': '<p>x</p>' }),
  });
  assert.deepEqual(out, []);
});
