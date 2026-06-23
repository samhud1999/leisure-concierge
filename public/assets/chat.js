let _token = null;
let _onUpdate = null;
const $pane = () => document.getElementById('chat-pane');

const FALLBACK_CHIPS = {
  type: 'chips',
  options: ['Add a dinner reservation', 'Swap an outdoor activity for indoor', 'I have dietary needs'],
};

let messages = [];
let lastUiHint = FALLBACK_CHIPS;

export function initChat({ token, onUpdate }) {
  _token = token;
  _onUpdate = onUpdate;
  // Listen for inline-action events emitted by itinerary.js in Task 18
  window.addEventListener('inline-action', (e) => {
    if (e.detail?.text) sendText(e.detail.text);
  });
  render();
}

function render() {
  $pane().innerHTML = `
    <div class="chat-header">
      <h3>Refine your stay</h3>
      <p>Anything you'd like to add or swap?</p>
    </div>
    <div id="chat-history" class="chat-history"></div>
    <div class="chat-controls">
      <div id="adaptive"></div>
      <form id="composer" class="composer">
        <textarea id="composer-input" rows="2" placeholder="Tell me what you'd like…"></textarea>
        <button type="submit" class="btn btn-yellow" id="send">Send</button>
      </form>
    </div>`;
  renderAdaptive(lastUiHint);
  renderHistory();
  document.getElementById('composer').addEventListener('submit', onSubmit);
}

function renderHistory() {
  const el = document.getElementById('chat-history');
  el.innerHTML = messages.filter(m => m.role !== 'tool').map(m => {
    const text = typeof m.content === 'string'
      ? m.content
      : (m.content?.find?.(b => b.type === 'text')?.text ?? '');
    if (!text) return '';
    return `<div class="chat-msg ${m.role === 'user' ? 'user' : 'assistant'}">${escapeHtml(text)}</div>`;
  }).join('');
  el.scrollTop = el.scrollHeight;
}

function renderAdaptive(hint) {
  const el = document.getElementById('adaptive');
  if (!hint || hint.type === 'none') { el.innerHTML = ''; return; }
  switch (hint.type) {
    case 'chips':
      el.innerHTML = `<div class="chips">${(hint.options || []).map(o => `<button type="button" class="chip" data-chip="${escapeAttr(o)}">${escapeHtml(o)}</button>`).join('')}</div>`;
      el.querySelectorAll('.chip').forEach(b => b.addEventListener('click', () => sendText(b.dataset.chip)));
      break;
    case 'radio':
      el.innerHTML = `${hint.question ? `<p>${escapeHtml(hint.question)}</p>` : ''}<div class="radio-grid">${(hint.options || []).map(o => `<button type="button" class="radio-tile" data-id="${escapeAttr(o.id)}">${escapeHtml(o.label)}</button>`).join('')}</div>`;
      el.querySelectorAll('.radio-tile').forEach(b => b.addEventListener('click', () => sendText(`${hint.question || ''} ${b.dataset.id}`.trim())));
      break;
    case 'multi': {
      const selected = new Set();
      el.innerHTML = `${hint.question ? `<p>${escapeHtml(hint.question)}</p>` : ''}<div class="multi-grid">${(hint.options || []).map(o => `<button type="button" class="multi-tile" data-id="${escapeAttr(o.id)}">${escapeHtml(o.label)}</button>`).join('')}</div><button type="button" class="btn btn-yellow" id="multi-apply" style="margin-top:8px">Apply</button>`;
      el.querySelectorAll('.multi-tile').forEach(b => b.addEventListener('click', () => {
        if (selected.has(b.dataset.id)) { selected.delete(b.dataset.id); b.classList.remove('selected'); }
        else { selected.add(b.dataset.id); b.classList.add('selected'); }
      }));
      el.querySelector('#multi-apply').addEventListener('click', () => sendText(`${hint.question || 'Selected'}: ${[...selected].join(', ')}`));
      break;
    }
    case 'form': {
      el.innerHTML = `<div class="form-grid">${(hint.fields || []).map(f => `
        <div><label>${escapeHtml(f.label)}</label>
        <select data-field="${escapeAttr(f.id)}">
          ${(f.options || []).map(o => `<option value="${escapeAttr(o)}">${escapeHtml(o)}</option>`).join('')}
        </select></div>`).join('')}</div><button type="button" class="btn btn-yellow" id="form-apply" style="margin-top:8px">Apply</button>`;
      el.querySelector('#form-apply').addEventListener('click', () => {
        const payload = [...el.querySelectorAll('select')].map(s => `${s.dataset.field}=${s.value}`).join(', ');
        sendText(`Form: ${payload}`);
      });
      break;
    }
  }
}

async function onSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('composer-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  await sendText(text);
}

async function sendText(text) {
  messages.push({ role: 'user', content: text });
  renderHistory();
  // Typing indicator
  const histEl = document.getElementById('chat-history');
  const typing = document.createElement('div'); typing.className = 'chat-msg assistant typing'; typing.textContent = 'Thinking…';
  histEl.appendChild(typing); histEl.scrollTop = histEl.scrollHeight;
  try {
    const r = await fetch(`/api/itinerary/${_token}/chat`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    messages = data.messages || messages;
    // Inject the final reply as a clean assistant message for display
    messages.push({ role: 'assistant', content: data.reply || '' });
    lastUiHint = data.ui_hint || FALLBACK_CHIPS;
    typing.remove();
    renderHistory();
    renderAdaptive(lastUiHint);
    if (_onUpdate) _onUpdate({ version: data.version });
  } catch (err) {
    typing.remove();
    messages.push({ role: 'assistant', content: `⚠️ ${err.message}` });
    renderHistory();
  }
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}
function escapeAttr(s) { return escapeHtml(s).replace(/"/g, '&quot;'); }
