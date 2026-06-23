import { generateItinerary as defaultGenerate } from '../itinerary/generator.js';

export function mountItineraryApi(app, opts) {
  const { supabase, anthropic, model } = opts;
  const generateItinerary = opts.generateItinerary || defaultGenerate;

  app.post('/api/itinerary/:token/generate', async (req, res) => {
    const { token } = req.params;
    try {
      const itinerary = await generateItinerary({ token, supabase, anthropic, model });
      res.json({ itinerary });
    } catch (e) {
      const status = e.httpStatus || 500;
      res.status(status).json({ error: e.message, errors: e.errors });
    }
  });
}
