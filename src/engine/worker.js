import { generatePopulation } from './population.js';
import { buildSegment } from './segment.js';
import { runExperiment } from './simulate.js';

/**
 * Runs experiments off the main thread.
 * message: { id, scenario, jobs: [{ key, policy, guardrails?, seed?, audience?: 'segment' | 'all' }] }
 * 'all' = every customer active in the last 12 months.
 */
self.onmessage = e => {
  const { id, scenario, jobs } = e.data;
  try {
    const population = generatePopulation(scenario.profile, scenario.populationSize, 42);
    const segment = buildSegment(population, scenario.segment).members;
    const results = {};
    jobs.forEach(job => {
      const audience = job.audience === 'all' ? population.filter(c => c.recency <= 365) : segment;
      const r = runExperiment({
        audience,
        policy: job.policy,
        guardrails: job.guardrails || scenario.guardrails,
        profile: scenario.profile,
        days: scenario.sim.days,
        seed: job.seed ?? scenario.sim.seed
      });
      delete r.baseline;
      results[job.key] = { ...r, audienceSize: audience.length };
    });
    self.postMessage({ id, results });
  } catch (err) {
    self.postMessage({ id, error: String(err?.message || err) });
  }
};
