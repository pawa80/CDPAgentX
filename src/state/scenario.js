import { PROFILES, DEFAULT_PROFILE } from '../engine/profiles.js';
import { DEFAULT_GUARDRAILS } from '../engine/simulate.js';

export const DEFAULT_SCENARIO = {
  profileKey: DEFAULT_PROFILE,
  profile: { ...PROFILES[DEFAULT_PROFILE] },
  populationSize: 10000,
  segment: { maxRecency: 365, minFrequency: 1, minMonetary: 0, lookalike: 0 },
  journey: {
    steps: [
      { channel: 'email', day: 0 },
      { channel: 'sms', day: 2 },
      { channel: 'push', day: 4 }
    ],
    offer: 'ten',
    suppressRecentBuyersDays: 0
  },
  guardrails: { ...DEFAULT_GUARDRAILS },
  agent: { method: 'thompson', epsilon: 0.1, reward: 'profit' },
  sim: { days: 56, seed: 1 },
  business: { customers: 250000, platformCost: 60000, currency: 'USD' }
};

/** Immutable set by dotted path, e.g. set(s, 'segment.maxRecency', 90). */
export function setPath(obj, path, value) {
  const [head, ...rest] = path.split('.');
  return { ...obj, [head]: rest.length ? setPath(obj[head] ?? {}, rest.join('.'), value) : value };
}

export function encodeScenario(s) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(s))));
}

export function decodeScenario(str) {
  try {
    const parsed = JSON.parse(decodeURIComponent(escape(atob(str))));
    return {
      ...DEFAULT_SCENARIO,
      ...parsed,
      profile: { ...DEFAULT_SCENARIO.profile, ...parsed.profile },
      guardrails: { ...DEFAULT_SCENARIO.guardrails, ...parsed.guardrails }
    };
  } catch {
    return null;
  }
}
