export function regenerateHighlights(doc) {
  const out = [];
  const days = Array.isArray(doc?.days) ? doc.days : [];
  if (days.length === 0) return out;

  // Count by kind across all blocks.
  const byKind = {};
  for (const d of days) for (const b of (d.blocks || [])) {
    byKind[b.kind] = (byKind[b.kind] || 0) + 1;
  }

  if (byKind.spa >= 1) {
    out.push(byKind.spa === 1 ? '1 spa treatment' : `${byKind.spa} spa treatments`);
  }

  // Surface markets / events with their day label
  const events = [];
  for (const d of days) for (const b of (d.blocks || [])) {
    if (b.kind === 'event') events.push({ title: b.title, label: d.label || d.date });
  }
  if (events.length === 1) out.push(`${events[0].title} · ${events[0].label}`);
  else if (events.length > 1) out.push(`${events.length} local events`);

  if (byKind.dining >= 2) out.push(`${byKind.dining} dining experiences`);

  // Weather summary
  const wetDays = days.filter(d => (d.weather?.precip_pct ?? 0) > 60).length;
  if (days.length > 0) {
    if (wetDays === 0)      out.push('Mostly fair weather');
    else if (wetDays === 1) out.push('Mostly fair weather, 1 wet day');
    else if (wetDays >= days.length / 2) out.push('Variable weather — indoor options included');
    else                    out.push(`Fair weather, ${wetDays} wet days`);
  }

  return out.slice(0, 4);
}
