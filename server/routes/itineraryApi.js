import { generateItinerary as defaultGenerate } from '../itinerary/generator.js';
import { runChatAgent as defaultRunChatAgent } from '../agent/chatAgent.js';
import { loadStore, pinBlock } from '../itinerary/mutator.js';
import { fromUrlSafe } from '../tools/tokens.js';

export function mountItineraryApi(app, opts) {
  const { anthropic, model } = opts;
  const supabase = opts.supabase ?? null;
  const generateItinerary = opts.generateItinerary || defaultGenerate;
  const runChatAgent = opts.runChatAgent || defaultRunChatAgent;

  app.post('/api/itinerary/:token/generate', async (req, res) => {
    const dbToken = fromUrlSafe(req.params.token);
    try {
      const itinerary = await generateItinerary({ token: dbToken, supabase, anthropic, model });
      res.json({ itinerary });
    } catch (e) {
      // Persist failure state so the frontend can show an error shell and stop retrying.
      // Only write for non-404 errors (404 means the row doesn't exist yet).
      if ((e.httpStatus || 500) !== 404 && supabase) {
        await supabase.from('itineraries')
          .update({ status: 'generation_failed', last_error: String(e.message || e) })
          .eq('token', dbToken);
      }
      res.status(e.httpStatus || 500).json({ error: e.message, errors: e.errors });
    }
  });

  app.post('/api/itinerary/:token/regenerate', async (req, res) => {
    const dbToken = fromUrlSafe(req.params.token);
    try {
      // Force regenerate by clearing status first.
      await supabase.from('itineraries').update({ status: 'pending', doc: {} }).eq('token', dbToken);
      const itinerary = await generateItinerary({ token: dbToken, supabase, anthropic, model });
      res.json({ itinerary });
    } catch (e) {
      res.status(e.httpStatus || 500).json({ error: e.message, errors: e.errors });
    }
  });

  app.get('/api/itinerary/:token', async (req, res) => {
    const dbToken = fromUrlSafe(req.params.token);
    const since = parseInt(req.query.since ?? '0', 10);
    const { data, error } = await supabase
      .from('itineraries').select('doc, version, status').eq('token', dbToken).maybeSingle();
    if (error || !data) return res.status(404).json({ error: 'itinerary_not_found' });
    if (data.status !== 'ready') return res.json({ itinerary: { status: data.status } });
    if ((data.version ?? 0) <= since) return res.status(204).end();
    res.json({ itinerary: data.doc });
  });

  app.post('/api/itinerary/:token/chat', async (req, res) => {
    const dbToken = fromUrlSafe(req.params.token);
    try {
      const out = await runChatAgent({
        token: dbToken,
        messages: req.body.messages || [],
        supabase, anthropic, model,
      });
      res.json(out);
    } catch (e) {
      res.status(e.httpStatus || 500).json({ error: e.message });
    }
  });

  app.post('/api/itinerary/:token/pin', async (req, res) => {
    const dbToken = fromUrlSafe(req.params.token);
    const { block_id, pinned } = req.body || {};
    if (!block_id) return res.status(400).json({ error: 'missing_block_id' });
    try {
      const store = loadStore(supabase, dbToken);
      const out = await pinBlock({ store, block_id, pinned: Boolean(pinned) });
      res.json(out);
    } catch (e) {
      res.status(e.httpStatus || 500).json({ error: e.message });
    }
  });
}
