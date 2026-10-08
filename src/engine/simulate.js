import { mulberry32, normal } from './rng.js';
import { CHANNELS, CHANNEL_KEYS, OFFERS, OFFER_KEYS } from './channels.js';
import { organicDaily, recencyMultiplier } from './population.js';

export const REDEEM_WINDOW = 0; // offers are "today only": redeemable on the send day
export const ATTRIBUTION_WINDOW = 3; // last-touch window used for "attributed" conversions

const OFFER_RESPONSE = {
  dealSeeker: { none: 0.6, ten: 1.8, twenty: 3 },
  regular: { none: 1, ten: 1.25, twenty: 1.4 }
};

export const DEFAULT_GUARDRAILS = {
  maxPerWeek: 3,
  minGapDays: 1,
  maxDiscount: 0.2,
  bannedWords: ['guaranteed', 'risk-free'],
  offerCopy: Object.fromEntries(OFFER_KEYS.map(k => [k, OFFERS[k].copy])),
  holdoutShare: 0.1,
  protectList: true
};

export const RECENCY_BUCKETS = ['Active (≤30d)', 'Cooling (31–120d)', 'Lapsed (>120d)'];
export const VALUE_BUCKETS = ['1 order', '2–3 orders', '4+ orders'];

/** Banned words found in a piece of copy (case-insensitive, whole words). */
export function checkCopy(copy, bannedWords) {
  const text = (copy || '').toLowerCase();
  return bannedWords
    .map(w => w.trim().toLowerCase())
    .filter(Boolean)
    .filter(w => new RegExp(`(^|[^a-z0-9])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`).test(text));
}

/** Which offers survive the guardrails, and why the others were blocked. */
export function allowedOffers(guardrails) {
  const allowed = [];
  const blocked = [];
  OFFER_KEYS.forEach(k => {
    const hits = checkCopy(guardrails.offerCopy?.[k] ?? OFFERS[k].copy, guardrails.bannedWords || []);
    if (OFFERS[k].discount > guardrails.maxDiscount + 1e-9) blocked.push({ offer: k, reason: 'above discount ceiling' });
    else if (hits.length) blocked.push({ offer: k, reason: `copy contains "${hits.join('", "')}"` });
    else allowed.push(k);
  });
  return { allowed, blocked };
}

/** Deterministic uniform in [0,1) per (seed, customer, day, stream): common random numbers across runs. */
function uni(seed, id, day, stream) {
  let h = (seed * 0x9e3779b1) ^ (id * 0x85ebca6b) ^ (day * 0xc2b2ae35) ^ (stream * 0x27d4eb2f);
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Ground-truth incremental purchase probability of one message (hidden from policies). */
export function trueUplift(c, recency, fatigue, channel, offer) {
  const ch = CHANNELS[channel];
  const offerMult = OFFER_RESPONSE[c._dealSeeker ? 'dealSeeker' : 'regular'][offer];
  const valueMult = Math.min(2, Math.max(0.3, Math.sqrt(c._rate / 2)));
  const fatigueMult = Math.exp(-fatigue / c._fatigueTolerance);
  const scale = c._upliftScale ?? 1;
  return scale * ch.upliftRate * c._affinity[channel] * c._responsiveness * offerMult * valueMult * recencyMultiplier(recency) * fatigueMult;
}

export const REST_BUCKETS = ['Messaged ≤2d ago', 'Messaged 3–6d ago', 'Rested 7d+'];
const NCTX = 27;

/** Agent context: purchase recency × order count × days since last message. */
function contextOf(recency, frequency, sinceMsg) {
  const r = recency <= 30 ? 0 : recency <= 120 ? 1 : 2;
  const v = frequency <= 1 ? 0 : frequency <= 3 ? 1 : 2;
  const m = sinceMsg <= 2 ? 0 : sinceMsg <= 6 ? 1 : 2;
  return (r * 3 + v) * 3 + m;
}

function emptyTotals() {
  return {
    n: 0,
    conversions: 0,
    revenue: 0,
    profit: 0,
    discountCost: 0,
    channelCost: 0,
    attributed: 0,
    sends: Object.fromEntries(CHANNEL_KEYS.map(c => [c, 0])),
    unsubs: Object.fromEntries(CHANNEL_KEYS.map(c => [c, 0]))
  };
}

/**
 * Run one campaign over `days` for an audience.
 *
 * policy:
 *  - { type: 'none' } — do nothing (counterfactual baseline)
 *  - { type: 'rules', steps: [{ channel, day }], offer, cycleDays, suppressRecentBuyersDays }
 *  - { type: 'agent', method: 'thompson' | 'greedy' | 'egreedy', epsilon, reward: 'profit' | 'conversions' }
 *
 * The agent makes two learned choices per customer per day:
 *  1. which channel, from that customer's own engagement history (frequent signal);
 *  2. whether to send and with which offer, from a Beta-Bernoulli bandit per
 *     context (recency × order-count bucket) whose arms are "no message" and
 *     "message with offer X". Comparing every arm to "no message" is what
 *     makes the agent optimise for incremental, not attributed, outcomes.
 */
export function simulate({ audience, policy, guardrails = DEFAULT_GUARDRAILS, profile, days = 56, seed = 7 }) {
  const n = audience.length;
  const margin = profile.grossMargin;
  const C = CHANNEL_KEYS.length;
  const { allowed, blocked } = allowedOffers(guardrails);
  const warnings = [];

  const recency = new Float64Array(n);
  const frequency = new Float64Array(n);
  const fatigue = new Float64Array(n);
  const lastSend = new Float64Array(n).fill(-99);
  const weekCount = new Uint8Array(n);
  const offerDiscount = new Float64Array(n);
  const offerExpiry = new Float64Array(n).fill(-1);
  const holdout = new Uint8Array(n);
  const customerProfit = new Float64Array(n);
  const consent = audience.map(c => ({ ...c.consent }));

  audience.forEach((c, i) => {
    recency[i] = c.recency;
    frequency[i] = c.frequency;
    holdout[i] = uni(seed, c.id, 0, 99) < guardrails.holdoutShare ? 1 : 0;
  });

  const treated = emptyTotals();
  const control = emptyTotals();
  for (let i = 0; i < n; i += 1) (holdout[i] ? control : treated).n += 1;
  const dailyTreatedProfit = new Float64Array(days);
  const dailyControlProfit = new Float64Array(days);
  const actionMix = [];

  // ----- rule journey setup
  let ruleOffer = policy.offer || 'none';
  if (policy.type === 'rules' && !allowed.includes(ruleOffer)) {
    const fallback = allowed.filter(k => OFFERS[k].discount <= OFFERS[ruleOffer].discount).pop() || 'none';
    warnings.push(
      `Journey offer "${OFFERS[ruleOffer].label}" was blocked by guardrails (${blocked.find(b => b.offer === ruleOffer)?.reason}); sent "${OFFERS[fallback].label}" instead.`
    );
    ruleOffer = fallback;
  }

  // ----- agent setup: arm 0 = no message, arm j = message with offer allowed[j-1]
  const offerArms = ['none-sent', ...allowed];
  const A = offerArms.length;
  const PRIOR_A = 1;
  const PRIOR_B = 200;
  const convA = new Float64Array(NCTX * A).fill(PRIOR_A);
  const convB = new Float64Array(NCTX * A).fill(PRIOR_B);
  const unsubA = new Float64Array(NCTX * C).fill(1);
  const unsubB = new Float64Array(NCTX * C).fill(400);
  // the agent starts from the engagement history already in the CDP
  const engSends = new Float64Array(n * C);
  const engHits = new Float64Array(n * C);
  audience.forEach((c, i) =>
    CHANNEL_KEYS.forEach((ch, ci) => {
      engSends[i * C + ci] = c.engagement?.[ch]?.sends || 0;
      engHits[i * C + ci] = c.engagement?.[ch]?.clicks || 0;
    })
  );
  const agentRng = mulberry32(seed * 7919 + 13);
  const subscriberValue = guardrails.protectList ? profile.aov * margin : 0;
  const rewardIsProfit = policy.reward !== 'conversions';
  const sampled = new Float64Array(NCTX * A);

  const eligible = (i, ch, day) =>
    consent[i][CHANNELS[ch].consent] && weekCount[i] < guardrails.maxPerWeek && day - lastSend[i] >= guardrails.minGapDays;

  /** Agent's channel pick for customer i: best (sampled) engagement relative to channel prior. */
  const pickChannel = (i, day, explore) => {
    let best = null;
    let bestScore = -Infinity;
    for (let ci = 0; ci < C; ci += 1) {
      const ch = CHANNEL_KEYS[ci];
      if (!eligible(i, ch, day)) continue;
      const p0 = CHANNELS[ch].engageRate;
      const a = engHits[i * C + ci] + 4 * p0;
      const b = engSends[i * C + ci] - engHits[i * C + ci] + 4 * (1 - p0);
      const mean = a / (a + b);
      const sd = Math.sqrt((mean * (1 - mean)) / (a + b + 1));
      const draw = explore ? Math.max(0, mean + sd * normal(agentRng)) : mean;
      const affinity = draw / p0;
      // value a send by expected affinity-weighted response, net of cost
      const score = affinity * CHANNELS[ch].upliftPrior * profile.aov * margin - CHANNELS[ch].cost;
      if (score > bestScore) {
        bestScore = score;
        best = { ch, ci, affinity };
      }
    }
    return best;
  };

  for (let day = 0; day < days; day += 1) {
    if (day % 7 === 0) {
      weekCount.fill(0);
      actionMix.push({});
    }
    const mix = actionMix[actionMix.length - 1];

    if (policy.type === 'agent') {
      for (let idx = 0; idx < NCTX * A; idx += 1) {
        sampled[idx] = convA[idx] / (convA[idx] + convB[idx]);
      }
    }

    for (let i = 0; i < n; i += 1) {
      const c = audience[i];
      let channel = null;
      let offer = 'none';
      let agentArm = 0;
      const ctx = contextOf(recency[i], frequency[i], day - lastSend[i]);

      if (!holdout[i]) {
        if (policy.type === 'rules') {
          const pos = day % (policy.cycleDays || 7);
          const step = policy.steps.find(s => s.day === pos);
          const suppressed = policy.suppressRecentBuyersDays > 0 && recency[i] < policy.suppressRecentBuyersDays;
          if (step && !suppressed && eligible(i, step.channel, day)) {
            channel = step.channel;
            offer = ruleOffer;
          }
        } else if (policy.type === 'oracle') {
          // perfect-information ceiling: uses the hidden ground truth no real system has
          const p0 = organicDaily(c, recency[i]);
          let best = 0;
          CHANNEL_KEYS.forEach(ch => {
            if (!eligible(i, ch, day)) return;
            const fr = (fatigue[i] + CHANNELS[ch].fatigueWeight) / c._fatigueTolerance;
            const unsubP = CHANNELS[ch].unsubRate * (1 + fr * fr);
            allowed.forEach(o => {
              const d = OFFERS[o].discount;
              const u = trueUplift(c, recency[i], fatigue[i], ch, o);
              const gain = (p0 + u) * c.aov * (margin - d) - p0 * c.aov * margin - CHANNELS[ch].cost - unsubP * subscriberValue;
              if (gain > best) {
                best = gain;
                channel = ch;
                offer = o;
              }
            });
          });
        } else if (policy.type === 'agent') {
          const explore = policy.method === 'thompson';
          const pick = pickChannel(i, day, explore);
          if (pick) {
            const aov = c.frequency > 0 ? c.monetary / c.frequency : profile.aov;
            const draw = idx => {
              if (!explore) return sampled[idx];
              const a = convA[idx];
              const b = convB[idx];
              const m = a / (a + b);
              return Math.max(0, m + Math.sqrt((m * (1 - m)) / (a + b + 1)) * normal(agentRng));
            };
            const p0 = draw(ctx * A);
            const uIdx = ctx * C + pick.ci;
            const unsubRisk = unsubA[uIdx] / (unsubA[uIdx] + unsubB[uIdx]);
            if (policy.method === 'egreedy' && agentRng() < (policy.epsilon ?? 0.1)) {
              agentArm = Math.floor(agentRng() * A);
            } else {
              let best = 0;
              for (let a = 1; a < A; a += 1) {
                const d = OFFERS[offerArms[a]].discount;
                const pSend = p0 + (draw(ctx * A + a) - p0) * Math.min(3, pick.affinity);
                const gain = rewardIsProfit
                  ? pSend * aov * (margin - d) - p0 * aov * margin - CHANNELS[pick.ch].cost - unsubRisk * subscriberValue
                  : pSend - p0;
                if (gain > best) {
                  best = gain;
                  agentArm = a;
                }
              }
            }
            if (agentArm > 0) {
              channel = pick.ch;
              offer = offerArms[agentArm];
            }
          }
        }
      }

      let p = organicDaily(c, recency[i]);
      if (channel) {
        p += trueUplift(c, recency[i], fatigue[i], channel, offer);
        const ch = CHANNELS[channel];
        const ci = CHANNEL_KEYS.indexOf(channel);
        treated.sends[channel] += 1;
        treated.channelCost += ch.cost;
        customerProfit[i] -= ch.cost;
        dailyTreatedProfit[day] -= ch.cost;
        const key = `${channel}:${offer}`;
        mix[key] = (mix[key] || 0) + 1;
        weekCount[i] += 1;
        lastSend[i] = day;
        fatigue[i] += ch.fatigueWeight;
        if (OFFERS[offer].discount > 0) {
          offerDiscount[i] = OFFERS[offer].discount;
          offerExpiry[i] = day + REDEEM_WINDOW;
        }
        engSends[i * C + ci] += 1;
        const fatigueRatio = fatigue[i] / c._fatigueTolerance;
        if (uni(seed, c.id, day, 2) < Math.min(0.9, ch.engageRate * c._affinity[channel] * Math.sqrt(c._responsiveness) * Math.exp(-fatigueRatio))) {
          engHits[i * C + ci] += 1;
        }
        const unsub = ch.unsubRate > 0 && uni(seed, c.id, day, 3) < ch.unsubRate * (1 + fatigueRatio * fatigueRatio);
        if (unsub) {
          consent[i][ch.consent] = false;
          treated.unsubs[channel] += 1;
        }
        if (policy.type === 'agent') {
          unsubA[ctx * C + ci] += unsub ? 1 : 0;
          unsubB[ctx * C + ci] += unsub ? 0 : 1;
        }
      } else if (!holdout[i] && policy.type !== 'none') {
        mix.none = (mix.none || 0) + 1;
      }

      const converted = uni(seed, c.id, day, 1) < Math.min(0.95, p);
      if (converted) {
        const group = holdout[i] ? control : treated;
        const d = offerExpiry[i] >= day ? offerDiscount[i] : 0;
        const orderProfit = c.aov * (margin - d);
        group.conversions += 1;
        group.revenue += c.aov * (1 - d);
        group.discountCost += c.aov * d;
        group.profit += orderProfit;
        customerProfit[i] += orderProfit;
        if (holdout[i]) dailyControlProfit[day] += orderProfit;
        else dailyTreatedProfit[day] += orderProfit;
        if (!holdout[i] && day - lastSend[i] <= ATTRIBUTION_WINDOW) group.attributed += 1;
        offerExpiry[i] = -1;
        recency[i] = 0;
        frequency[i] += 1;
      } else {
        recency[i] += 1;
      }
      fatigue[i] *= 0.85;

      if (policy.type === 'agent' && !holdout[i]) {
        const idx = ctx * A + agentArm;
        convA[idx] += converted ? 1 : 0;
        convB[idx] += converted ? 0 : 1;
      }
    }
  }

  treated.profit -= treated.channelCost;

  // Holdout read-out with a 95% interval, as a real team would report it.
  const scale = control.n ? treated.n / control.n : 0;
  let sT = 0;
  let sC = 0;
  for (let i = 0; i < n; i += 1) {
    const mean = holdout[i] ? control.profit / control.n : treated.profit / treated.n;
    const dev = (customerProfit[i] - mean) ** 2;
    if (holdout[i]) sC += dev;
    else sT += dev;
  }
  const se =
    control.n > 1 && treated.n > 1 ? treated.n * Math.sqrt(sT / (treated.n - 1) / treated.n + sC / (control.n - 1) / control.n) : Infinity;
  const measured = {
    conversions: treated.conversions - control.conversions * scale,
    revenue: treated.revenue - control.revenue * scale,
    profit: treated.profit - control.profit * scale,
    profitLow: treated.profit - control.profit * scale - 1.96 * se,
    profitHigh: treated.profit - control.profit * scale + 1.96 * se
  };

  let learned = null;
  if (policy.type === 'agent') {
    learned = [];
    for (let ctx = 0; ctx < NCTX; ctx += 1) {
      const p0 = convA[ctx * A] / (convA[ctx * A] + convB[ctx * A]);
      let best = { offer: null, gain: 0 };
      let trials = 0;
      for (let a = 0; a < A; a += 1) {
        const idx = ctx * A + a;
        trials += convA[idx] + convB[idx] - PRIOR_A - PRIOR_B;
        if (a === 0) continue;
        const pa = convA[idx] / (convA[idx] + convB[idx]);
        const d = OFFERS[offerArms[a]].discount;
        const gain = pa * profile.aov * (margin - d) - p0 * profile.aov * margin;
        if (gain > best.gain) best = { offer: offerArms[a], gain };
      }
      const seg = Math.floor(ctx / 3);
      learned.push({
        recency: RECENCY_BUCKETS[Math.floor(seg / 3)],
        value: VALUE_BUCKETS[seg % 3],
        rest: REST_BUCKETS[ctx % 3],
        organicRate: p0,
        bestOffer: best.offer,
        gainPerSend: best.gain,
        trials
      });
    }
  }

  return {
    treated,
    control,
    measured,
    dailyTreatedProfit: Array.from(dailyTreatedProfit),
    dailyControlProfit: Array.from(dailyControlProfit),
    actionMix,
    learned,
    blocked,
    warnings,
    days
  };
}

/**
 * Run a policy and the do-nothing counterfactual on the same customers.
 * Because outcomes use common random numbers, the difference is the policy's
 * true incremental effect, something a real team never observes directly.
 */
export function runExperiment(args) {
  const run = simulate(args);
  const baseline = simulate({ ...args, policy: { type: 'none' } });
  const trueIncProfit = run.treated.profit - baseline.treated.profit;
  const trueIncConversions = run.treated.conversions - baseline.treated.conversions;
  let cum = 0;
  const cumulativeTrue = run.dailyTreatedProfit.map((v, d) => (cum += v - baseline.dailyTreatedProfit[d]));
  return { ...run, baseline, truth: { profit: trueIncProfit, conversions: trueIncConversions, cumulative: cumulativeTrue } };
}

export function armLabel(key) {
  if (key === 'none') return 'No message';
  const [ch, offer] = key.split(':');
  return `${CHANNELS[ch].label} · ${OFFERS[offer].label}`;
}
