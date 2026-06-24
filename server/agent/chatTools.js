// All 12 tool definitions (5 read-only + 7 mutation) in OpenAI tool shape.
// Read-only tools delegate to makeReadonlyHandlers() in server/tools/readonlyHandlers.js.
// Mutation tools delegate to ./mutator.js.

const j = (props, required) => ({ type: 'object', properties: props, required });

const fn = (name, description, properties, required) => ({
  type: 'function',
  function: { name, description, parameters: j(properties, required) },
});

export const READ_TOOLS = [
  fn('member_lookup',        'Verify a member by member number AND surname.',          { member_number: { type: 'string' }, surname: { type: 'string' } }, ['member_number','surname']),
  fn('get_booking',          "Retrieve the verified member's own booking(s).",          { member_id: { type: 'integer' } }, ['member_id']),
  fn('get_resort_knowledge', 'Get resort amenities, dining, experiences, room types.',  { resort_slug: { type: 'string' } }, ['resort_slug']),
  fn('get_events',           'Local events in a date range for a resort.',              { resort_slug: { type: 'string' }, start_date: { type: 'string' }, end_date: { type: 'string' } }, ['resort_slug','start_date','end_date']),
  fn('get_weather',          'Daily forecast for a resort over a date range.',          { resort_slug: { type: 'string' }, start_date: { type: 'string' }, end_date: { type: 'string' } }, ['resort_slug','start_date','end_date']),
];

export const MUTATION_TOOLS = [
  fn('add_activity',     'Append an activity block to a day.',                            { day_id: { type: 'string' }, time_of_day: { type: 'string' }, kind: { type: 'string' }, title: { type: 'string' }, description: { type: 'string' }, venue: { type: 'string' }, source_url: { type: 'string' } }, ['day_id','time_of_day','kind','title']),
  fn('swap_activity',    'Replace a block (preserves id; rejects pinned).',               { block_id: { type: 'string' }, replacement: { type: 'object' } }, ['block_id','replacement']),
  fn('remove_activity',  'Remove a block (rejects pinned).',                              { block_id: { type: 'string' } }, ['block_id']),
  fn('reorder_day',      'Reorder blocks within a day by id.',                            { day_id: { type: 'string' }, block_ids: { type: 'array', items: { type: 'string' } } }, ['day_id','block_ids']),
  fn('set_preference',   'Set a member preference: party_kind|dietary|pace|interests.',   { key: { type: 'string' }, value: {} }, ['key','value']),
  fn('pin_block',        'Pin or unpin a block (pinned blocks resist swap/remove).',      { block_id: { type: 'string' }, pinned: { type: 'boolean' } }, ['block_id','pinned']),
  fn('regenerate_day',   'Ask the model to rewrite ONE day, respecting pinned blocks.',   { day_id: { type: 'string' }, reason: { type: 'string' } }, ['day_id','reason']),
];

export const CHAT_TOOLS = [...READ_TOOLS, ...MUTATION_TOOLS];

// Convenience: flat list of tool names. Tests assert against these.
export const CHAT_TOOL_NAMES = CHAT_TOOLS.map(t => t.function.name);
