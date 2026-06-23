// All 12 tool definitions (5 read-only + 7 mutation) in Anthropic SDK shape.
// Read-only tools delegate to makeReadonlyHandlers() in server/tools/readonlyHandlers.js.
// Mutation tools delegate to ./mutator.js.

const j = (props, required) => ({ type: 'object', properties: props, required });

export const READ_TOOLS = [
  { name: 'member_lookup',          description: 'Verify a member by member number AND surname.',          input_schema: j({ member_number: { type: 'string' }, surname: { type: 'string' } }, ['member_number','surname']) },
  { name: 'get_booking',            description: "Retrieve the verified member's own booking(s).",          input_schema: j({ member_id: { type: 'integer' } }, ['member_id']) },
  { name: 'get_resort_knowledge',   description: 'Get resort amenities, dining, experiences, room types.', input_schema: j({ resort_slug: { type: 'string' } }, ['resort_slug']) },
  { name: 'get_events',             description: 'Local events in a date range for a resort.',             input_schema: j({ resort_slug: { type: 'string' }, start_date: { type: 'string' }, end_date: { type: 'string' } }, ['resort_slug','start_date','end_date']) },
  { name: 'get_weather',            description: 'Daily forecast for a resort over a date range.',         input_schema: j({ resort_slug: { type: 'string' }, start_date: { type: 'string' }, end_date: { type: 'string' } }, ['resort_slug','start_date','end_date']) },
];

export const MUTATION_TOOLS = [
  { name: 'add_activity',     description: 'Append an activity block to a day.',           input_schema: j({ day_id: { type: 'string' }, time_of_day: { type: 'string' }, kind: { type: 'string' }, title: { type: 'string' }, description: { type: 'string' }, venue: { type: 'string' }, source_url: { type: 'string' } }, ['day_id','time_of_day','kind','title']) },
  { name: 'swap_activity',    description: 'Replace a block (preserves id; rejects pinned).', input_schema: j({ block_id: { type: 'string' }, replacement: { type: 'object' } }, ['block_id','replacement']) },
  { name: 'remove_activity',  description: 'Remove a block (rejects pinned).',               input_schema: j({ block_id: { type: 'string' } }, ['block_id']) },
  { name: 'reorder_day',      description: 'Reorder blocks within a day by id.',             input_schema: j({ day_id: { type: 'string' }, block_ids: { type: 'array', items: { type: 'string' } } }, ['day_id','block_ids']) },
  { name: 'set_preference',   description: 'Set a member preference: party_kind|dietary|pace|interests.', input_schema: j({ key: { type: 'string' }, value: {} }, ['key','value']) },
  { name: 'pin_block',        description: 'Pin or unpin a block (pinned blocks resist swap/remove).',    input_schema: j({ block_id: { type: 'string' }, pinned: { type: 'boolean' } }, ['block_id','pinned']) },
  { name: 'regenerate_day',   description: 'Ask the model to rewrite ONE day, respecting pinned blocks.', input_schema: j({ day_id: { type: 'string' }, reason: { type: 'string' } }, ['day_id','reason']) },
];

export const CHAT_TOOLS = [...READ_TOOLS, ...MUTATION_TOOLS];
