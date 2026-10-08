// Maintainer tool: compare policies outside the UI when tuning the model.
// Usage: node scripts/calibrate.mjs <populationSize> <days>
import { generatePopulation } from '../src/engine/population.js';
import { buildSegment } from '../src/engine/segment.js';
import { runExperiment, DEFAULT_GUARDRAILS } from '../src/engine/simulate.js';
import { PROFILES } from '../src/engine/profiles.js';
const [size = 10000, days = 56] = process.argv.slice(2).map(Number);
const profile = PROFILES.retail;
const pop = generatePopulation(profile, size, 42);
const seg = buildSegment(pop, { maxRecency: 365, minFrequency: 1, minMonetary: 0 });
const rules = { type: 'rules', steps: [{ channel: 'email', day: 0 }, { channel: 'sms', day: 2 }, { channel: 'push', day: 4 }], offer: 'ten', cycleDays: 7 };
for (const [name, policy] of [['rules', rules], ['thompson', { type: 'agent', method: 'thompson' }], ['egreedy', { type: 'agent', method: 'egreedy', epsilon: 0.1 }], ['oracle', { type: 'oracle' }]]) {
  const t0 = Date.now();
  const r = runExperiment({ audience: seg.members, policy, profile, guardrails: DEFAULT_GUARDRAILS, days, seed: 1 });
  const cum = r.truth.cumulative;
  const weekly = [];
  for (let w = 0; w < days / 7; w++) weekly.push(Math.round(cum[w * 7 + 6] - (w ? cum[w * 7 - 1] : 0)));
  const sends = Object.values(r.treated.sends).reduce((a, b) => a + b, 0);
  console.log(name.padEnd(9), `${Date.now() - t0}ms`, 'sends', sends, 'trueProfit', Math.round(r.truth.profit), 'weekly', weekly.join(' '));
}
