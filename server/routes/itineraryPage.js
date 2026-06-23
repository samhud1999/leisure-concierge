import { readFile } from 'node:fs/promises';
import path from 'node:path';

export function mountItineraryPage(app, { supabase, publicDir }) {
  app.get('/i/:token', async (req, res) => {
    const { token } = req.params;
    const { data: row, error } = await supabase
      .from('itineraries')
      .select('status, doc, last_error')
      .eq('token', token)
      .maybeSingle();
    if (error || !row) return res.status(404).send('Itinerary not found');

    let state;
    if (row.status === 'ready' && row.doc && Object.keys(row.doc).length) {
      state = row.doc;
    } else if (row.status === 'generation_failed') {
      state = { status: 'generation_failed', last_error: row.last_error || null };
    } else {
      state = { status: 'pending' };
    }

    const shellPath = path.join(publicDir, 'itinerary.html');
    let shell = await readFile(shellPath, 'utf8');
    // Inject state into the placeholder.
    shell = shell.replace(
      '<script id="state" type="application/json">{}</script>',
      `<script id="state" type="application/json">${JSON.stringify(state).replace(/</g, '\\u003c')}</script>`,
    );
    res.type('html').send(shell);
  });
}
