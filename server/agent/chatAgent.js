import { CHAT_TOOLS } from './chatTools.js';
import { buildChatSystemPrompt } from './systemPrompt.js';
import { makeReadonlyHandlers } from '../tools/readonlyHandlers.js';
import { fetchLiveEventsFor, CACHE as LIVE_EVENTS_CACHE } from '../liveEvents/index.js';
import {
  addActivity, swapActivity, removeActivity, reorderDay,
  setPreference, pinBlock, regenerateDay, loadStore,
} from '../itinerary/mutator.js';

export { buildChatSystemPrompt, CHAT_TOOLS };

const FALLBACK_CHIPS = {
  type: 'chips',
  options: ['Add a dinner reservation', 'Swap an outdoor activity for an indoor one', 'I have dietary needs'],
};

export async function runChatAgent({ token, messages, supabase, llm, model }) {
  // 1. Load current itinerary as system-prompt context.
  const { data: row } = await supabase
    .from('itineraries').select('doc, version').eq('token', token).maybeSingle();
  if (!row?.doc) throw Object.assign(new Error('itinerary_not_found'), { httpStatus: 404 });
  const userMessage = messages.findLast?.(m => m.role === 'user')?.content
    ?? messages.filter(m => m.role === 'user').slice(-1)[0]?.content
    ?? '';
  const system = buildChatSystemPrompt({ itinerary: row.doc, userMessage });

  // 2. Build read-only handlers bound to this request's supabase client.
  // Live events are wired here; do NOT remove fetchLiveEventsFor / LIVE_EVENTS_CACHE.
  const readHandlers = makeReadonlyHandlers(supabase, {
    fetchLiveEventsFor,
    liveEventsCache: LIVE_EVENTS_CACHE,
  });

  // 3. Compose OpenAI-style messages array (system goes inside the array).
  const oaiMessages = [{ role: 'system', content: system }, ...messages];

  // 4. Run agent loop (max 8 turns).
  const store = loadStore(supabase, token);
  let turn = 0;
  while (turn++ < 8) {
    const resp = await llm.chat.completions.create({
      model,
      max_completion_tokens: 2000,
      messages: oaiMessages,
      tools: CHAT_TOOLS,
    });
    const choice = resp.choices?.[0];
    const msg = choice?.message ?? {};
    oaiMessages.push(msg);

    const toolCalls = msg.tool_calls || [];
    if (choice?.finish_reason !== 'tool_calls' && toolCalls.length === 0) {
      const text = String(msg.content ?? '').trim();
      const cleaned = text.replace(/^```json\s*/i,'').replace(/```\s*$/i,'').trim();
      let parsed;
      try { parsed = JSON.parse(cleaned); } catch { parsed = { reply: text, ui_hint: FALLBACK_CHIPS }; }
      const ui_hint = parsed.ui_hint && typeof parsed.ui_hint === 'object' ? parsed.ui_hint : FALLBACK_CHIPS;
      const { data: latest } = await supabase.from('itineraries').select('version').eq('token', token).maybeSingle();
      return { reply: parsed.reply || '', ui_hint, messages: oaiMessages, version: latest?.version ?? row.version };
    }

    for (const call of toolCalls) {
      let input = {};
      try { input = JSON.parse(call.function?.arguments || '{}'); } catch { input = {}; }
      let result;
      try {
        result = await dispatchTool({
          name: call.function?.name,
          input, store, supabase, llm, model, readHandlers,
        });
      } catch (e) {
        result = { error: e.message };
      }
      oaiMessages.push({
        role: 'tool',
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }
  }
  // Loop exceeded.
  return { reply: "Sorry — I couldn't complete that. Try a smaller change.", ui_hint: FALLBACK_CHIPS, messages: oaiMessages, version: row.version };
}

async function dispatchTool({ name, input, store, supabase, llm, model, readHandlers }) {
  // Read-only tools — delegate to handlers bound to the current supabase client.
  if (readHandlers[name]) return readHandlers[name](input);

  // Mutation tools.
  switch (name) {
    case 'add_activity':    return addActivity({ store, ...input });
    case 'swap_activity':   return swapActivity({ store, ...input });
    case 'remove_activity': return removeActivity({ store, ...input });
    case 'reorder_day':     return reorderDay({ store, ...input });
    case 'set_preference':  return setPreference({ store, ...input });
    case 'pin_block':       return pinBlock({ store, ...input });
    case 'regenerate_day':  return regenerateDay({ store, llm, model, ...input });
    default: return { error: `unknown_tool: ${name}` };
  }
}
