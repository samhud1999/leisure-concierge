const state = JSON.parse(document.getElementById('state').textContent || '{}');

const $itin = document.getElementById('itinerary-pane');
const $chat = document.getElementById('chat-pane');

// --- Bootstrap router ---
if (!state || state.status === 'pending' || Object.keys(state).length === 0) {
  renderLoadingShell();
  triggerGenerate();
} else if (state.status === 'generation_failed') {
  renderErrorShell(state.last_error);
} else {
  renderItinerary(state);
}
renderChatPlaceholder();

// --- Renderers ---
function renderItinerary(doc) {
  $itin.innerHTML = '';
  $itin.appendChild(renderHero(doc));
  if (doc.summary?.highlights?.length) $itin.appendChild(renderSummary(doc.summary));
  const nights = doc.stay?.nights ?? 0;
  const defaultExpanded = nights <= 3
    ? () => true                                              // all
    : (i) => i === 0;                                         // today only
  doc.days?.forEach((d, i) => $itin.appendChild(renderDay(d, defaultExpanded(i))));
}

function renderHero(doc) {
  const el = document.createElement('section'); el.className = 'stay-hero';
  const hero = doc.resort?.hero_image || '/img/hero-resort.jpg';
  el.innerHTML = `
    <img src="${hero}" alt="" onerror="this.style.display='none'">
    <div class="overlay">
      <h2>Your stay at ${escapeHtml(doc.resort?.name ?? 'RACV')}</h2>
      <p>${formatStayLine(doc.stay)}</p>
    </div>`;
  return el;
}

function renderSummary(summary) {
  const el = document.createElement('div'); el.className = 'summary-card';
  el.innerHTML = `<h3>Highlights</h3><ul>${summary.highlights.map(h => `<li>${escapeHtml(h)}</li>`).join('')}</ul>`;
  return el;
}

function renderDay(day, expanded) {
  const el = document.createElement('section'); el.className = 'day'; el.dataset.dayId = day.id;
  const w = day.weather || {};
  const weatherPill = w.condition ? `<span class="weather-pill">${escapeHtml(w.condition)} · ${w.temp_max_c ?? '?'}°C · ${w.precip_pct ?? 0}% rain</span>` : '';
  el.innerHTML = `
    <div class="day-header" role="button" aria-expanded="${expanded}" tabindex="0">
      <span class="chev">▶</span>
      <h4>${escapeHtml(day.label || day.date)}</h4>
      ${weatherPill}
      <span class="count">${day.blocks?.length ?? 0} activities</span>
    </div>
    <div class="day-body" ${expanded ? '' : 'hidden'}>
      ${(day.blocks || []).map(renderBlock).join('')}
    </div>`;
  const header = el.querySelector('.day-header');
  header.addEventListener('click', () => toggleDay(el));
  header.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDay(el); } });
  return el;
}

function renderBlock(b) {
  const cls = `block kind-${b.kind}${b.pinned ? ' pinned' : ''}`;
  return `
    <div class="${cls}" data-block-id="${b.id}">
      <div class="bar"></div>
      <div class="icon">${escapeHtml(b.icon || '●')}</div>
      <div class="body">
        <h5>${escapeHtml(b.title || '')}</h5>
        ${b.description ? `<p>${escapeHtml(b.description)}</p>` : ''}
        ${b.venue ? `<p class="venue">${escapeHtml(b.venue)}</p>` : ''}
        <span class="time">${escapeHtml(b.time_of_day || '')}</span>
        <div class="actions">
          <button data-action="pin">${b.pinned ? '✕ Unpin' : '📌 Pin'}</button>
          ${b.pinned ? '' : '<button data-action="swap">↔ Swap</button>'}
          <button data-action="remove">✕ Remove</button>
        </div>
      </div>
    </div>`;
}

function renderChatPlaceholder() {
  $chat.innerHTML = `<div class="chat-placeholder">Chat refinement arrives in Phase 4. The itinerary view is read-only for now.</div>`;
}

function renderLoadingShell() {
  $itin.innerHTML = `
    <div class="loading-wrap">
      <h2>Building your stay…</h2>
      <div class="shimmer"></div>
      <ul class="steps" id="steps">
        <li id="step-1" class="active">Pulling your booking</li>
        <li id="step-2" class="pending">Checking the weather</li>
        <li id="step-3" class="pending">Finding local experiences</li>
        <li id="step-4" class="pending">Building your day-by-day plan</li>
      </ul>
      <p style="color:var(--racv-muted)">~30–60 seconds. Hold tight; we only do this once.</p>
    </div>`;
  // Fake-progress timers (no SSE, per spec).
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

// --- Actions ---
function toggleDay(el) {
  const header = el.querySelector('.day-header');
  const body = el.querySelector('.day-body');
  const expanded = header.getAttribute('aria-expanded') === 'true';
  header.setAttribute('aria-expanded', String(!expanded));
  body.hidden = expanded;
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
function formatStayLine(s) {
  if (!s) return '';
  const fmt = (d) => new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
  return `${fmt(s.check_in)} – ${fmt(s.check_out)} · ${s.nights} night${s.nights === 1 ? '' : 's'} · ${escapeHtml(s.room_type)} for ${s.party_size}`;
}
