import { CHANNEL_KEYS } from './channels.js';
import { organicDaily } from './population.js';

/**
 * Rule-based RFM filter plus an optional look-alike expansion.
 * Look-alikes are ranked by distance to the seed segment's centroid in
 * standardised (log) RFM space and the closest `expansion × seed size` are added,
 * which is how most "audience size %" look-alike tools behave.
 */
export function buildSegment(population, { maxRecency, minFrequency, minMonetary, lookalike = 0 }) {
  const seed = [];
  const rest = [];
  population.forEach(c => {
    if (c.recency <= maxRecency && c.frequency >= minFrequency && c.monetary >= minMonetary) seed.push(c);
    else rest.push(c);
  });

  let extra = [];
  if (lookalike > 0 && seed.length > 0) {
    const feat = c => [Math.log1p(c.recency), Math.log1p(c.frequency), Math.log1p(c.monetary)];
    const all = population.map(feat);
    const mean = [0, 1, 2].map(j => all.reduce((s, f) => s + f[j], 0) / all.length);
    const sd = [0, 1, 2].map(j => Math.sqrt(all.reduce((s, f) => s + (f[j] - mean[j]) ** 2, 0) / all.length) || 1);
    const z = c => feat(c).map((v, j) => (v - mean[j]) / sd[j]);
    const centroid = [0, 1, 2].map(j => seed.reduce((s, c) => s + z(c)[j], 0) / seed.length);
    const k = Math.min(rest.length, Math.round(seed.length * lookalike));
    extra = rest
      .map(c => ({ c, d: z(c).reduce((s, v, j) => s + (v - centroid[j]) ** 2, 0) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, k)
      .map(x => x.c);
  }

  const members = seed.concat(extra);
  return { members, seedCount: seed.length, lookalikeCount: extra.length, stats: segmentStats(members, population.length) };
}

export function segmentStats(members, baseSize) {
  const n = members.length;
  const reachable = {};
  CHANNEL_KEYS.forEach(ch => {
    reachable[ch] = members.filter(c => c.consent[ch]).length;
  });
  const anyChannel = members.filter(c => CHANNEL_KEYS.some(ch => c.consent[ch])).length;
  const organic30 = members.reduce((s, c) => s + 1 - Math.pow(1 - organicDaily(c, 30), 30), 0);
  return {
    count: n,
    share: baseSize ? n / baseSize : 0,
    avgMonetary: n ? members.reduce((s, c) => s + c.monetary, 0) / n : 0,
    totalMonetary: members.reduce((s, c) => s + c.monetary, 0),
    reachable,
    anyChannel,
    expectedOrganicOrders30d: organic30
  };
}
