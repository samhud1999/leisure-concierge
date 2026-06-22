import { extract as torquayCowrieMarket } from './torquayCowrieMarket.js';
import { extract as visitGreatOceanRoad } from './visitGreatOceanRoad.js';
import { extract as surfCoastEvents } from './surfCoastEvents.js';

const REGISTRY = [
  { match: /^https?:\/\/torquaycowriemarket\.com\b/, extract: torquayCowrieMarket },
  { match: /^https?:\/\/visitgreatoceanroad\.org\.au\/torquaylife\/whats-on/, extract: visitGreatOceanRoad },
  { match: /^https?:\/\/surfcoastevents\.com\.au\b/, extract: surfCoastEvents },
];

export function resolveExtractor(url) {
  const entry = REGISTRY.find((e) => e.match.test(url));
  return entry?.extract ?? null;
}
