export const BLOCK_KINDS = new Set([
  'arrival', 'dining', 'activity', 'spa', 'event', 'departure', 'free',
]);
export const TIMES_OF_DAY = new Set(['morning','midday','afternoon','evening']);
export const PREF_KEYS = new Set(['party_kind','dietary','pace','interests']);

const ICON_FOR_KIND = {
  arrival: '🛬', dining: '🍽', activity: '🥾', spa: '💆',
  event: '🎫', departure: '🛫', free: '●',
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isString(v) { return typeof v === 'string'; }
function isObj(v)    { return v && typeof v === 'object' && !Array.isArray(v); }
function isArr(v)    { return Array.isArray(v); }

function pushErr(errs, path, msg) { errs.push(`${path}: ${msg}`); }

// --- validateGenerated -----------------------------------------------------

export function validateGenerated(partial) {
  const errors = [];
  if (!isObj(partial)) {
    return { ok: false, errors: ['root: not an object'] };
  }
  if (!isObj(partial.preferences)) pushErr(errors, 'preferences', 'missing or not object');
  if (!isObj(partial.summary) || !isArr(partial.summary?.highlights)) {
    pushErr(errors, 'summary.highlights', 'missing or not an array');
  }
  if (!isArr(partial.days)) {
    pushErr(errors, 'days', 'missing or not an array');
    return { ok: false, errors };
  }

  const seenIds = new Set();
  partial.days.forEach((d, i) => {
    const dp = `days[${i}]`;
    if (!isString(d?.id))    pushErr(errors, `${dp}.id`, 'missing');
    if (!isString(d?.date) || !ISO_DATE.test(d.date)) pushErr(errors, `${dp}.date`, 'not YYYY-MM-DD');
    if (!isString(d?.label)) pushErr(errors, `${dp}.label`, 'missing');
    if (!isObj(d?.weather))  pushErr(errors, `${dp}.weather`, 'missing or not object');
    if (!isArr(d?.blocks)) {
      pushErr(errors, `${dp}.blocks`, 'missing or not array');
      return;
    }
    d.blocks.forEach((b, j) => {
      const bp = `${dp}.blocks[${j}]`;
      if (!isString(b?.id))     pushErr(errors, `${bp}.id`, 'missing');
      else if (seenIds.has(b.id)) pushErr(errors, `${bp}.id`, `duplicate "${b.id}"`);
      else seenIds.add(b.id);
      if (!BLOCK_KINDS.has(b?.kind)) pushErr(errors, `${bp}.kind`, `unknown kind "${b?.kind}"`);
      if (!TIMES_OF_DAY.has(b?.time_of_day)) pushErr(errors, `${bp}.time_of_day`, `unknown "${b?.time_of_day}"`);
      if (!isString(b?.title) || b.title.length > 40) pushErr(errors, `${bp}.title`, 'missing or > 40 chars');
      if (b?.description != null && (!isString(b.description) || b.description.length > 140)) {
        pushErr(errors, `${bp}.description`, 'not a string or > 140 chars');
      }
    });
  });

  return errors.length ? { ok: false, errors } : { ok: true, doc: partial, errors: [] };
}

// --- validateFull ----------------------------------------------------------

export function validateFull(doc) {
  const partialResult = validateGenerated(doc);
  const errors = [...partialResult.errors];

  if (!isObj(doc?.stay)) {
    pushErr(errors, 'stay', 'missing');
  } else {
    const expected = (doc.stay.nights ?? 0) + 1;
    if (!isArr(doc.days) || doc.days.length !== expected) {
      pushErr(errors, 'days', `day count ${doc.days?.length ?? 0} != nights+1 (${expected})`);
    } else {
      if (doc.days[0]?.date !== doc.stay.check_in) {
        pushErr(errors, 'days[0].date', `must equal stay.check_in ${doc.stay.check_in}`);
      }
      const last = doc.days[doc.days.length - 1];
      if (last?.date !== doc.stay.check_out) {
        pushErr(errors, `days[${doc.days.length - 1}].date`, `must equal stay.check_out ${doc.stay.check_out}`);
      }
    }
  }
  for (const required of ['version','booking_id','token','member','resort']) {
    if (doc?.[required] == null) pushErr(errors, required, 'missing');
  }
  return errors.length ? { ok: false, errors } : { ok: true, doc, errors: [] };
}

// --- softRepair ------------------------------------------------------------

export function softRepair(partial, input) {
  if (!isObj(partial)) return partial;
  const out = structuredClone(partial);
  if (isArr(out.days)) {
    for (const day of out.days) {
      if (!isObj(day.weather) && isObj(input?.weather) && isArr(input.weather.days)) {
        const w = input.weather.days.find(x => x.date === day.date);
        if (w) day.weather = w;
      }
      if (isArr(day.blocks)) {
        for (const b of day.blocks) {
          if (!BLOCK_KINDS.has(b.kind)) b.kind = 'activity';
          if (!b.icon) b.icon = ICON_FOR_KIND[b.kind] || '●';
          if (typeof b.description === 'string' && b.description.length > 140) {
            b.description = b.description.slice(0, 139) + '…';
          }
          if (typeof b.title === 'string' && b.title.length > 40) {
            b.title = b.title.slice(0, 39) + '…';
          }
          if (b.pinned == null) b.pinned = false;
        }
      }
    }
  }
  return out;
}
