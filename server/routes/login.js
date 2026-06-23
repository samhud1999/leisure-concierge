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

    const { data: row } = await supabase
      .from('itineraries')
      .select('token')
      .eq('member_id', m.id)
      .maybeSingle();
    if (!row) return res.status(401).json({ error: 'no_match' });   // member has no booking; treat as no-match

    res.json({ token: row.token, redirect: `/i/${row.token}` });
  });
}
