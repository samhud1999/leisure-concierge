// URL-safe base64 token normalization.
// DB stores standard base64 (gen_random_bytes + encode); URLs use URL-safe
// base64 (no +, /, =). Helpers convert between the two.

export function toUrlSafe(dbToken) {
  return String(dbToken).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

export function fromUrlSafe(urlToken) {
  let t = String(urlToken).replaceAll('-', '+').replaceAll('_', '/');
  // Pad back to a multiple of 4 with '=' so SELECT WHERE token = ? matches.
  while (t.length % 4) t += '=';
  return t;
}
