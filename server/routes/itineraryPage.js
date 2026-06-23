import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fromUrlSafe } from '../tools/tokens.js';

export function mountItineraryPage(app, { supabase, publicDir }) {
  app.get('/i/:token', async (req, res) => {
    const dbToken = fromUrlSafe(req.params.token);
    const { data: row, error } = await supabase
      .from('itineraries')
      .select('status, doc, last_error, booking_id, member_id')
      .eq('token', dbToken)
      .maybeSingle();
    if (error || !row) return res.status(404).send('Itinerary not found');

    let state;
    if (row.status === 'ready' && row.doc && Object.keys(row.doc).length) {
      state = row.doc;
    } else if (row.status === 'generation_failed') {
      state = { status: 'generation_failed', last_error: row.last_error || null };
    } else {
      // Pending: fetch enough booking metadata to render a personalised loading shell.
      let preview = null;
      try {
        const { data: booking } = await supabase
          .from('bookings')
          .select('check_in, check_out, room_type, party_size, resort:resorts(name, town, region)')
          .eq('confirmation_code', row.booking_id)
          .maybeSingle();
        const { data: member } = await supabase
          .from('members')
          .select('first_name')
          .eq('id', row.member_id)
          .maybeSingle();
        if (booking?.check_in) {
          const nights = Math.round((new Date(booking.check_out) - new Date(booking.check_in)) / 86400000);
          preview = {
            member: { first_name: member?.first_name || null },
            stay: {
              check_in: booking.check_in,
              check_out: booking.check_out,
              nights,
              room_type: booking.room_type,
              party_size: booking.party_size,
            },
            resort: booking.resort || null,
          };
        }
      } catch { /* preview is best-effort; fall through to bare loading shell */ }
      state = preview ? { status: 'pending', preview } : { status: 'pending' };
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
