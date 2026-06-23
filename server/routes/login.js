import { toUrlSafe } from '../tools/tokens.js';

export function mountLoginRoute(app, { supabase }) {
  app.post('/api/login', async (req, res) => {
    const { member_number, surname } = req.body || {};
    if (!member_number || !surname) return res.status(400).json({ error: 'missing_fields' });

    const { data: m } = await supabase
      .from('members')
      .select('id')
      .eq('member_number', String(member_number).trim())
      .ilike('surname', String(surname).trim())
      .maybeSingle();
    if (!m) return res.status(401).json({ error: 'no_match' });

    const { data: rows } = await supabase
      .from('itineraries')
      .select('token, created_at')
      .eq('member_id', m.id)
      .order('created_at', { ascending: false })
      .limit(1);
    const row = rows?.[0];
    if (!row) return res.status(401).json({ error: 'no_match' });   // member has no booking; treat as no-match

    const urlToken = toUrlSafe(row.token);
    res.json({ token: urlToken, redirect: `/i/${urlToken}` });
  });
}
