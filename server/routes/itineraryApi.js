import { generateItinerary as defaultGenerate } from '../itinerary/generator.js';
import { runChatAgent as defaultRunChatAgent } from '../agent/chatAgent.js';
import { loadStore, pinBlock } from '../itinerary/mutator.js';

export function mountItineraryApi(app, opts) {
  const { supabase, anthropic, model } = opts;
  const generateItinerary = opts.generateItinerary || defaultGenerate;
  const runChatAgent = opts.runChatAgent || defaultRunChatAgent;

  app.post('/api/itinerary/:token/generate', async (req, res) => {
    try {
      const itinerary = await generateItinerary({ token: req.params.token, supabase, anthropic, model });
      res.json({ itinerary });
    } catch (e) {
      res.status(e.httpStatus || 500).json({ error: e.message, errors: e.errors });
    }
  });

  app.post('/api/itinerary/:token/regenerate', async (req, res) => {
    try {
      // Force regenerate by clearing status first.
      await supabase.from('itineraries').update({ status: 'pending', doc: {} }).eq('token', req.params.token);
      const itinerary = await generateItinerary({ token: req.params.token, supabase, anthropic, model });
      res.json({ itinerary });
    } catch (e) {
      res.status(e.httpStatus || 500).json({ error: e.message, errors: e.errors });
    }
  });

  app.get('/api/itinerary/:token', async (req, res) => {
    const since = parseInt(req.query.since ?? '0', 10);
    const { data, error } = await supabase
      .from('itineraries').select('doc, version, status').eq('token', req.params.token).maybeSingle();
    if (error || !data) return res.status(404).json({ error: 'itinerary_not_found' });
    if (data.status !== 'ready') return res.json({ itinerary: { status: data.status } });
    if ((data.version ?? 0) <= since) return res.status(204).end();
    res.json({ itinerary: data.doc });
  });

  app.post('/api/itinerary/:token/chat', async (req, res) => {
    try {
      const out = await runChatAgent({
        token: req.params.token,
        messages: req.body.messages || [],
        supabase, anthropic, model,
      });
      res.json(out);
    } catch (e) {
      res.status(e.httpStatus || 500).json({ error: e.message });
    }
  });

  app.post('/api/itinerary/:token/pin', async (req, res) => {
    const { block_id, pinned } = req.body || {};
    if (!block_id) return res.status(400).json({ error: 'missing_block_id' });
    try {
      const store = loadStore(supabase, req.params.token);
      const out = await pinBlock({ store, block_id, pinned: Boolean(pinned) });
      res.json(out);
    } catch (e) {
      res.status(e.httpStatus || 500).json({ error: e.message });
    }
  });
}
