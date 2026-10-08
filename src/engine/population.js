import { mulberry32, gamma, lognormal, poisson } from './rng.js';
import { CHANNELS, CHANNEL_KEYS } from './channels.js';

/** Sends per channel in the 12-month history a CDP would already hold. */
export const HISTORY_SENDS = { email: 100, sms: 25, push: 50, ads: 150 };

/**
 * Generate a synthetic customer base.
 *
 * Observable fields (what a CDP would show you): recency, frequency, monetary,
 * aov, consent and 12 months of per-channel engagement history. Latent fields (what only the simulator knows, prefixed `_`):
 * true purchase rate, channel affinity, deal-seeking and fatigue tolerance.
 * The gap between the two is exactly what rules can't see and agents try to learn.
 */
export function generatePopulation(profile, size = 10000, seed = 42) {
  const rng = mulberry32(seed);
  const customers = new Array(size);
  const shape = 0.9;

  for (let i = 0; i < size; i += 1) {
    const rate = (gamma(rng, shape) / shape) * profile.ordersPerYear;
    const recency = Math.min(730, Math.round(-Math.log(1 - rng() * 0.999) * (365 / Math.max(rate, 0.25))));
    const frequency = recency > 365 ? 0 : 1 + poisson(rng, (rate * (365 - recency)) / 365);
    const aov = lognormal(rng, profile.aov, 0.35);

    const consent = {};
    const affinity = {};
    CHANNEL_KEYS.forEach(c => {
      consent[c] = rng() < profile.consent[c];
      affinity[c] = lognormal(rng, 1, 0.9);
    });

    const responsiveness = lognormal(rng, 1, 0.9);
    const engagement = {};
    CHANNEL_KEYS.forEach(c => {
      const sends = consent[c] ? HISTORY_SENDS[c] : 0;
      const p = Math.min(0.9, CHANNELS[c].engageRate * affinity[c] * Math.sqrt(responsiveness));
      engagement[c] = { sends, clicks: Math.min(sends, poisson(rng, sends * p)) };
    });

    customers[i] = {
      id: i,
      recency,
      frequency,
      monetary: Math.round(frequency * aov),
      aov,
      consent,
      engagement,
      _rate: rate,
      _affinity: affinity,
      _dealSeeker: rng() < profile.dealSeekerShare,
      _responsiveness: responsiveness,
      // lets a business case test conservative / optimistic response assumptions
      _upliftScale: profile.upliftScale ?? 1,
      _fatigueTolerance: lognormal(rng, 2.5, 0.5)
    };
  }
  return customers;
}

/** Expected organic (unprompted) purchase probability for one day. */
export function organicDaily(c, recency) {
  const justBought = recency <= 7 ? 0.5 : 1;
  return Math.min(0.5, (c._rate / 365) * justBought);
}

/** How persuadable a customer is at a given recency (lapsing customers respond most). */
export function recencyMultiplier(recency) {
  if (recency <= 14) return 0.5;
  if (recency <= 60) return 1;
  if (recency <= 180) return 1.3;
  if (recency <= 365) return 0.9;
  return 0.4;
}
