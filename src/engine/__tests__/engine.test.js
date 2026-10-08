import { describe, expect, it } from 'vitest';
import { generatePopulation } from '../population.js';
import { buildSegment } from '../segment.js';
import { allowedOffers, checkCopy, DEFAULT_GUARDRAILS, runExperiment, simulate } from '../simulate.js';
import { PROFILES } from '../profiles.js';

const profile = PROFILES.retail;
const population = generatePopulation(profile, 4000, 42);
const everyone = buildSegment(population, { maxRecency: 730, minFrequency: 0, minMonetary: 0 }).members;
const rules = {
  type: 'rules',
  steps: [{ channel: 'email', day: 0 }, { channel: 'sms', day: 2 }, { channel: 'push', day: 4 }],
  offer: 'ten',
  cycleDays: 7
};
const sends = r => Object.values(r.treated.sends).reduce((a, b) => a + b, 0);

describe('population', () => {
  it('is reproducible for a seed', () => {
    const again = generatePopulation(profile, 4000, 42);
    expect(again[123].monetary).toBe(population[123].monetary);
    expect(again[123].consent).toEqual(population[123].consent);
  });
});

describe('segmentation', () => {
  it('shrinks when rules tighten and grows with look-alikes', () => {
    const loose = buildSegment(population, { maxRecency: 365, minFrequency: 1, minMonetary: 0 });
    const tight = buildSegment(population, { maxRecency: 60, minFrequency: 3, minMonetary: 200 });
    const expanded = buildSegment(population, { maxRecency: 60, minFrequency: 3, minMonetary: 200, lookalike: 1 });
    expect(tight.stats.count).toBeLessThan(loose.stats.count);
    expect(expanded.lookalikeCount).toBe(tight.seedCount);
    expect(expanded.stats.count).toBe(tight.stats.count * 2);
  });
});

describe('guardrails', () => {
  it('flags banned words as whole words only', () => {
    expect(checkCopy('FREE delivery today', ['free'])).toEqual(['free']);
    expect(checkCopy('Carefree summer looks', ['free'])).toEqual([]);
  });

  it('blocks offers above the discount ceiling or with banned copy', () => {
    const { allowed, blocked } = allowedOffers({ ...DEFAULT_GUARDRAILS, maxDiscount: 0.1, bannedWords: ['next'] });
    expect(allowed).toEqual(['none']);
    expect(blocked.map(b => b.offer).sort()).toEqual(['ten', 'twenty']);
  });

  it('fewer messages are sent under a tighter weekly cap', () => {
    const loose = simulate({ audience: everyone, policy: rules, profile, days: 28, guardrails: { ...DEFAULT_GUARDRAILS, maxPerWeek: 3 } });
    const tight = simulate({ audience: everyone, policy: rules, profile, days: 28, guardrails: { ...DEFAULT_GUARDRAILS, maxPerWeek: 1 } });
    expect(sends(tight)).toBeLessThan(sends(loose));
  });
});

describe('experiments', () => {
  it('doing nothing has zero true incremental effect', () => {
    const r = runExperiment({ audience: everyone, policy: { type: 'none' }, profile, days: 28 });
    expect(r.truth.profit).toBe(0);
    expect(sends(r)).toBe(0);
  });

  it('ranks oracle above agent above rules on true incremental profit', () => {
    const big = generatePopulation(profile, 10000, 42).filter(c => c.recency <= 365);
    const run = policy => [1, 2].reduce((s, seed) => s + runExperiment({ audience: big, policy, profile, days: 56, seed }).truth.profit, 0);
    const r = run(rules);
    const a = run({ type: 'agent', method: 'thompson' });
    const o = run({ type: 'oracle' });
    expect(r).toBeGreaterThan(0);
    expect(a).toBeGreaterThan(r);
    expect(o).toBeGreaterThan(a);
  }, 30000);
});
