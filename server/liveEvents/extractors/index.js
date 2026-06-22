import { extract as torquayCowrieMarket } from './torquayCowrieMarket.js';

const REGISTRY = [
  { match: /^https?:\/\/torquaycowriemarket\.com\b/, extract: torquayCowrieMarket },
];

export function resolveExtractor(url) {
  const entry = REGISTRY.find((e) => e.match.test(url));
  return entry?.extract ?? null;
}
