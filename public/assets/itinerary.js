// ===========================================================================
// RACV Concierge V2 — itinerary artifact rendering
// Vanilla JS, no framework. Driven by an inlined JSON state in #state.
// Uses inline SVG icons (no emojis).
// ===========================================================================

const state = JSON.parse(document.getElementById('state').textContent || '{}');
const $itin = document.getElementById('itinerary-pane');
const $chat = document.getElementById('chat-pane');

// --- Inline SVG icon set ---------------------------------------------------
const ICONS = {
  // Block kinds
  arrival:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 19h18M2 13l10-8 4 5 5 1-9 4z"/></svg>',
  departure: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 19h18M22 8L12 13 9 9 4 11l5 4 13-2z"/></svg>',
  dining:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3v8a3 3 0 0 0 3 3v7M8 3v8M11 3v8M15 8a3 3 0 0 1 6 0v6a2 2 0 0 1-2 2v5"/></svg>',
  activity:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13" cy="4" r="2"/><path d="M13 7v4l-3 4 2 5M13 11l3 3-1 4M9 9l-3 2"/></svg>',
  spa:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c-5-5-9-8-9-13 0-2 2-4 4-4s4 2 5 4c1-2 3-4 5-4s4 2 4 4c0 5-4 8-9 13z"/></svg>',
  event:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z"/><path d="M9 6v12"/></svg>',
  free:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  // Section labels
  calendar:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>',
  people:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="7" r="3"/><path d="M2 21v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1"/><circle cx="17" cy="9" r="2"/><path d="M15 14h2a4 4 0 0 1 4 4v1"/></svg>',
  pace:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  bed:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 18V8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10M2 14h20M6 10h4M2 18v2M22 18v2"/></svg>',
  weather:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"/></svg>',
  days:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
  info:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v.01M11 12h1v4h1"/></svg>',
  pin:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6l-1 5 3 3-3 2-2-1v7l-1 1-1-1v-7l-2 1-3-2 3-3z"/></svg>',
  swap:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h14l-3-3M20 17H6l3 3"/></svg>',
  remove:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  chevron:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
};

function weatherIcon(condition, precipPct = 0) {
  const c = String(condition || '').toLowerCase();
  if (precipPct > 60 || /rain|drizzle|shower|storm|thunder/.test(c)) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 14a4 4 0 0 1 .4-8 5 5 0 0 1 9.4 1.6A3.3 3.3 0 0 1 16 14z"/><path d="M8 17l-1 3M14 17l-1 3"/></svg>';
  }
  if (/snow/.test(c)) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v16M4 12h16M6 6l12 12M18 6L6 18"/></svg>';
  }
  if (/(cloud|overcast|fog)/.test(c) && !/clear/.test(c)) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 16a4 4 0 0 1 .4-8 5 5 0 0 1 9.4 1.6A3.3 3.3 0 0 1 16 16z"/></svg>';
  }
  if (/(partly|mainly clear|fair)/.test(c)) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="9" r="3.2"/><path d="M9 3v1.5M3 9h1.5M4.8 4.8l1 1M13.2 4.8l-1 1"/><path d="M11 18a3 3 0 0 1 .3-6 4 4 0 0 1 7.5 1.2A2.6 2.6 0 0 1 18.5 18z"/></svg>';
  }
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"/></svg>';
}

function timeMarker(time_of_day) {
  return ({ morning: 'AM', midday: 'NOON', afternoon: 'PM', evening: 'EVE' }[time_of_day]) || '';
}

function fmtDayHead(dateStr) {
  const d = new Date(dateStr + 'T00:00');
  return d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' });
}
function fmtDateShort(dateStr) {
  const d = new Date(dateStr + 'T00:00');
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}
function fmtWeekdayShort(dateStr) {
  const d = new Date(dateStr + 'T00:00');
  return d.toLocaleDateString('en-AU', { weekday: 'short' });
}

function titleCase(s) {
  return String(s || '').replace(/[-_]/g, ' ').replace(/\b\w/g, m => m.toUpperCase());
}
function seasonName(dateStr) {
  const m = new Date(dateStr + 'T00:00').getMonth();
  if (m <= 1 || m === 11) return 'Summer';
  if (m <= 4) return 'Autumn';
  if (m <= 7) return 'Winter';
  return 'Spring';
}

// --- Bootstrap router ------------------------------------------------------
if (!state || state.status === 'pending' || Object.keys(state).length === 0) {
  renderLoadingShell();
  triggerGenerate();
} else if (state.status === 'generation_failed') {
  renderErrorShell(state.last_error);
} else {
  renderItinerary(state);
}
renderChatPanel(state);

// --- Itinerary rendering ---------------------------------------------------
function renderItinerary(doc) {
  $itin.innerHTML = '';
  $itin.appendChild(renderHero(doc));
  $itin.appendChild(renderWeatherStrip(doc));
  $itin.appendChild(renderSectionLabel('Day by day', ICONS.days));

  const nights = doc.stay?.nights ?? 0;
  const isLong = nights >= 7;
  const expandedDefault = (i) => {
    if (nights <= 3) return true;
    if (nights <= 6) return i === 0 || i === 1;
    return i === 0;
  };
  if (isLong) $itin.appendChild(renderDayNav(doc));
  if (nights > 5) $itin.appendChild(renderToolbar());

  doc.days?.forEach((d, i) => {
    if (isLong && i > 0 && i % 7 === 0) {
      const divider = document.createElement('div');
      divider.className = 'week-divider';
      divider.textContent = `Week ${Math.floor(i / 7) + 1}`;
      $itin.appendChild(divider);
    }
    $itin.appendChild(renderDay(d, i, expandedDefault(i)));
  });

  if (doc.summary?.highlights?.length) {
    $itin.appendChild(renderSectionLabel('Highlights', ICONS.info));
    $itin.appendChild(renderHighlights(doc.summary.highlights));
  }
}

function renderHero(doc) {
  const el = document.createElement('header');
  el.className = 'art-hero';
  const stay = doc.stay || {};
  const partyText = stay.party_size === 1 ? '1 guest' : `${stay.party_size ?? '?'} guests`;
  const paceText = doc.preferences?.pace ? `${titleCase(doc.preferences.pace)} pace` : 'Balanced pace';
  const year = stay.check_in ? new Date(stay.check_in + 'T00:00').getFullYear() : '';
  el.innerHTML = `
    <p class="kicker">Your ${stay.nights}-night stay</p>
    <h1>${escapeHtml(doc.resort?.name ?? 'RACV')}</h1>
    <p class="sub">${escapeHtml(doc.resort?.town ?? '')}${doc.resort?.region ? ', ' + escapeHtml(doc.resort.region) : ''}</p>
    <div class="meta-row">
      <span class="art-chip">${ICONS.calendar}<span>${escapeHtml(fmtDateShort(stay.check_in))} to ${escapeHtml(fmtDateShort(stay.check_out))} ${year}</span></span>
      <span class="art-chip">${ICONS.people}<span>${escapeHtml(partyText)}</span></span>
      <span class="art-chip">${ICONS.bed}<span>${escapeHtml(stay.room_type || 'Room')}</span></span>
      <span class="art-chip">${ICONS.pace}<span>${escapeHtml(paceText)}</span></span>
      <span class="art-chip">${ICONS.weather}<span>${escapeHtml(seasonName(stay.check_in))}</span></span>
    </div>`;
  return el;
}

function renderWeatherStrip(doc) {
  const wrap = document.createElement('div');
  const days = (doc.days || []).slice(0, Math.min(7, (doc.days || []).length));
  wrap.appendChild(renderSectionLabel('Weather at a glance', ICONS.weather));
  const grid = document.createElement('div');
  grid.className = 'weather-grid';
  grid.style.gridTemplateColumns = `repeat(${Math.max(days.length, 1)}, 1fr)`;
  grid.innerHTML = days.map(d => {
    const w = d.weather || {};
    return `
      <div class="wcard">
        <div class="wd">${escapeHtml(fmtWeekdayShort(d.date))}</div>
        <div class="wdate">${escapeHtml(fmtDateShort(d.date))}</div>
        <div class="wi">${weatherIcon(w.condition, w.precip_pct)}</div>
        <div class="wt">${w.temp_max_c ?? '?'}&deg;</div>
        <div class="wlo">${w.temp_min_c ?? '?'}&deg; low</div>
        <div class="wcond">${escapeHtml(w.condition || '')}</div>
      </div>`;
  }).join('');
  wrap.appendChild(grid);
  return wrap;
}

function renderSectionLabel(text, iconSvg) {
  const el = document.createElement('div');
  el.className = 'section-label';
  el.innerHTML = `${iconSvg}<span>${escapeHtml(text)}</span>`;
  return el;
}

function renderHighlights(highlights) {
  const el = document.createElement('div');
  el.className = 'kb';
  el.innerHTML = `<ul>${highlights.map(h => `<li>${escapeHtml(h)}</li>`).join('')}</ul>`;
  return el;
}

function renderDay(day, index, expanded) {
  const details = document.createElement('details');
  details.className = 'day';
  details.id = day.id;
  details.dataset.dayId = day.id;
  if (expanded) details.setAttribute('open', '');
  const w = day.weather || {};
  const weatherMini = w.condition
    ? `${weatherIcon(w.condition, w.precip_pct)}<span>${escapeHtml(w.condition)} &middot; ${w.temp_max_c ?? '?'}&deg; / ${w.temp_min_c ?? '?'}&deg;</span>`
    : '';
  const dayTitle = dayTitleFromBlocks(day);
  details.innerHTML = `
    <summary class="daysum">
      <div class="daynum"><small>DAY</small><span>${index + 1}</span></div>
      <div class="dayhead">
        <div class="dh-day">${escapeHtml(fmtDayHead(day.date))}</div>
        <div class="dh-title">${escapeHtml(dayTitle)}</div>
        <div class="dh-mini">${weatherMini}</div>
      </div>
      <span class="chev" aria-hidden="true">${ICONS.chevron}</span>
    </summary>
    <div class="daybody">
      <ul class="tl">
        ${(day.blocks || []).map(renderBlock).join('')}
      </ul>
    </div>`;
  return details;
}

function dayTitleFromBlocks(day) {
  const blocks = day.blocks || [];
  if (blocks.length === 0) return 'Rest day';
  if (blocks[0]?.kind === 'arrival') return 'Arrive and settle in';
  if (blocks[blocks.length - 1]?.kind === 'departure') return 'Farewell day';
  const titles = blocks.filter(b => b.kind !== 'free' && b.title).map(b => b.title);
  return titles[0] || 'Stay highlights';
}

function renderBlock(b) {
  const kindIcon = ICONS[b.kind] || ICONS.free;
  return `
    <li class="kind-${escapeHtml(b.kind)}${b.pinned ? ' pinned' : ''}" data-block-id="${escapeHtml(b.id)}">
      <span class="tm">${escapeHtml(timeMarker(b.time_of_day))}</span>
      <span class="dot" aria-hidden="true">${kindIcon}</span>
      <div class="act">${escapeHtml(b.title || '')}${b.pinned ? '<span class="pin-flag" aria-label="pinned">' + ICONS.pin + '</span>' : ''}</div>
      ${b.description ? `<div class="desc">${escapeHtml(b.description)}</div>` : ''}
      ${b.venue ? `<div class="venue">${escapeHtml(b.venue)}</div>` : ''}
      <div class="block-actions">
        <button type="button" data-action="pin" class="ba-btn">${ICONS.pin}<span>${b.pinned ? 'Unpin' : 'Pin'}</span></button>
        ${b.pinned ? '' : `<button type="button" data-action="swap" class="ba-btn">${ICONS.swap}<span>Swap</span></button>`}
        ${b.pinned ? '' : `<button type="button" data-action="remove" class="ba-btn">${ICONS.remove}<span>Remove</span></button>`}
      </div>
    </li>`;
}

function renderDayNav(doc) {
  const el = document.createElement('nav');
  el.className = 'day-nav';
  el.setAttribute('aria-label', 'Jump to day');
  el.innerHTML = '<h6>Jump to</h6>' + (doc.days || []).map((d, i) => {
    const weekStart = i % 7 === 0 && i > 0;
    return (weekStart ? `<div class="week-label">Week ${Math.floor(i / 7) + 1}</div>` : '') +
           `<a href="#${escapeHtml(d.id)}">Day ${i + 1}: ${escapeHtml(fmtDateShort(d.date))}</a>`;
  }).join('');
  return el;
}

function renderToolbar() {
  const el = document.createElement('div');
  el.className = 'toolbar';
  el.innerHTML = `
    <button type="button" class="btn-text" data-action="expand-all">Expand all</button>
    <button type="button" class="btn-text" data-action="collapse-all">Collapse all</button>`;
  el.addEventListener('click', (e) => {
    const action = e.target?.dataset?.action;
    if (!action) return;
    document.querySelectorAll('details.day').forEach((d) => {
      if (action === 'expand-all') d.setAttribute('open', '');
      else d.removeAttribute('open');
    });
  });
  return el;
}

async function renderChatPanel(initial) {
  const { initChat } = await import('./chat.js');
  const m = location.pathname.match(/^\/i\/([^/]+)/);
  if (!m) return;
  initChat({
    token: m[1],
    onUpdate: ({ version }) => refetchItinerary(version),
  });
}

async function refetchItinerary(sinceVersion) {
  const m = location.pathname.match(/^\/i\/([^/]+)/);
  if (!m) return;
  const token = m[1];
  for (let attempt = 0; attempt < 3; attempt++) {
    const r = await fetch(`/api/itinerary/${token}?since=${(sinceVersion ?? 1) - 1}`);
    if (r.status === 204) { await new Promise(r2 => setTimeout(r2, 300)); continue; }
    if (r.ok) {
      const data = await r.json();
      if (data.itinerary && data.itinerary.days) {
        renderItinerary(data.itinerary);
        document.querySelectorAll('[data-block-id]').forEach(b => b.classList.add('changed'));
        setTimeout(() => document.querySelectorAll('.changed').forEach(b => b.classList.remove('changed')), 1300);
        return;
      }
    }
    await new Promise(r2 => setTimeout(r2, 400));
  }
}

function renderLoadingShell() {
  $itin.innerHTML = `
    <div class="loading-wrap">
      <h2>Building your stay</h2>
      <div class="shimmer"></div>
      <ul class="steps" id="steps">
        <li id="step-1" class="active">Pulling your booking</li>
        <li id="step-2" class="pending">Checking the weather</li>
        <li id="step-3" class="pending">Finding local experiences</li>
        <li id="step-4" class="pending">Building your day-by-day plan</li>
      </ul>
      <p style="color:var(--racv-muted)">About 30 to 60 seconds. Hold tight. We only do this once.</p>
    </div>`;
  const advance = (from, to) => {
    const f = document.getElementById(`step-${from}`); const t = document.getElementById(`step-${to}`);
    if (f) { f.classList.remove('active'); f.classList.add('done'); }
    if (t) { t.classList.remove('pending'); t.classList.add('active'); }
  };
  setTimeout(() => advance(1, 2), 4000);
  setTimeout(() => advance(2, 3), 12000);
  setTimeout(() => advance(3, 4), 28000);
}

function renderErrorShell(lastError) {
  $itin.innerHTML = `
    <div class="error-wrap">
      <h2>We couldn't build your stay just yet</h2>
      <p>${escapeHtml(lastError || 'The generator reported an error.')}</p>
      <button class="btn btn-yellow" id="retry">Try again</button>
    </div>`;
  document.getElementById('retry').addEventListener('click', triggerGenerate);
}

async function triggerGenerate() {
  const m = location.pathname.match(/^\/i\/([^/]+)/);
  if (!m) return;
  const token = m[1];
  try {
    const r = await fetch(`/api/itinerary/${token}/generate`, { method: 'POST' });
    if (!r.ok) {
      const detail = await r.json().catch(() => ({}));
      renderErrorShell(detail.error || `HTTP ${r.status}`);
      return;
    }
    const data = await r.json();
    renderItinerary(data.itinerary);
  } catch (e) {
    renderErrorShell(e.message);
  }
}

// --- Helpers ---
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

// --- Block action handler (Pin direct API; Swap/Remove via inline-action) ---
$itin.addEventListener('click', async (e) => {
  const btn = e.target.closest('.block-actions button');
  if (!btn) return;
  e.preventDefault();
  e.stopPropagation();
  const blockEl = btn.closest('[data-block-id]');
  const blockId = blockEl?.dataset.blockId;
  if (!blockId) return;
  const action = btn.dataset.action;
  const m = location.pathname.match(/^\/i\/([^/]+)/);
  if (!m) return;
  const token = m[1];
  try {
    if (action === 'pin') {
      const pinned = !blockEl.classList.contains('pinned');
      const r = await fetch(`/api/itinerary/${token}/pin`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ block_id: blockId, pinned }),
      });
      if (r.ok) {
        const data = await r.json();
        await refetchItinerary(data.version);
      }
    } else if (action === 'swap' || action === 'remove') {
      const msg = action === 'swap'
        ? `Swap block ${blockId} for something different (preferably indoor if the weather is poor).`
        : `Remove block ${blockId}.`;
      window.dispatchEvent(new CustomEvent('inline-action', { detail: { text: msg } }));
    }
  } catch (err) {
    console.error('inline action failed', err);
  }
});
