import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeEvent } from '../normalize.js';

const DEFAULTS = { source_url: 'https://example.org/events', environment: 'outdoor' };

test('fills defaults and nulls', () => {
  const out = normalizeEvent(
    { name: 'Farmers Market', start_date: '2026-06-27' },
    DEFAULTS
  );
  assert.deepEqual(out, {
    name: 'Farmers Market',
    start_date: '2026-06-27',
    end_date: null,
    event_time: null,
    location: null,
    category: null,
    environment: 'outdoor',
    source_url: 'https://example.org/events',
    description: null,
  });
});

test('passes through provided fields', () => {
  const out = normalizeEvent(
    {
      name: 'Sunset Gig',
      start_date: '2026-06-27',
      end_date: '2026-06-27',
      event_time: '6pm-9pm',
      location: 'Torquay Hotel',
      category: 'music',
      environment: 'indoor',
      description: 'Live band on the deck.',
    },
    DEFAULTS
  );
  assert.equal(out.event_time, '6pm-9pm');
  assert.equal(out.category, 'music');
  assert.equal(out.environment, 'indoor');
  assert.equal(out.source_url, DEFAULTS.source_url);
});

test('returns null if name is missing', () => {
  assert.equal(normalizeEvent({ start_date: '2026-06-27' }, DEFAULTS), null);
});

test('returns null if start_date is missing', () => {
  assert.equal(normalizeEvent({ name: 'X' }, DEFAULTS), null);
});

test('trims whitespace from name and description', () => {
  const out = normalizeEvent(
    { name: '  Market  ', start_date: '2026-06-27', description: '\n  hi  \n' },
    DEFAULTS
  );
  assert.equal(out.name, 'Market');
  assert.equal(out.description, 'hi');
});

test('coerces unknown environment to default', () => {
  const out = normalizeEvent(
    { name: 'X', start_date: '2026-06-27', environment: 'underwater' },
    DEFAULTS
  );
  assert.equal(out.environment, 'outdoor');
});
