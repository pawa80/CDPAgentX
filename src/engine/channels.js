/**
 * Channel parameters used by the simulator.
 *
 * Two kinds of numbers live here:
 *  - `benchmark`: published industry figures, shown in the UI with their source
 *    so learners can sanity-check the model.
 *  - model parameters (cost, engageRate, upliftRate, unsubRate): the simulator's
 *    per-send assumptions. They are calibrated to sit in the range of the
 *    benchmarks but are NOT measurements — override them with your own data.
 */
export const CHANNELS = {
  email: {
    label: 'Email',
    consent: 'email',
    cost: 0.001,
    engageRate: 0.02, // click rate per send
    upliftRate: 0.004, // incremental purchase probability per send (model assumption)
    upliftPrior: 0.004,
    unsubRate: 0.002,
    fatigueWeight: 1
  },
  sms: {
    label: 'SMS',
    consent: 'sms',
    cost: 0.012,
    engageRate: 0.07,
    upliftRate: 0.009,
    upliftPrior: 0.009,
    unsubRate: 0.008,
    fatigueWeight: 1.6
  },
  push: {
    label: 'Push',
    consent: 'push',
    cost: 0.0002,
    engageRate: 0.025,
    upliftRate: 0.003,
    upliftPrior: 0.003,
    unsubRate: 0.004,
    fatigueWeight: 1.2
  },
  ads: {
    label: 'Paid retargeting',
    consent: 'ads',
    cost: 0.03,
    engageRate: 0.017,
    upliftRate: 0.002,
    upliftPrior: 0.002,
    unsubRate: 0,
    fatigueWeight: 0.4
  }
};

export const CHANNEL_KEYS = Object.keys(CHANNELS);

/** Offers the rule journey or the agent can attach to a message. */
export const OFFERS = {
  none: { label: 'No discount', discount: 0, copy: 'New arrivals picked for you' },
  ten: { label: '10% off', discount: 0.1, copy: 'Take 10% off your next order' },
  twenty: { label: '20% off', discount: 0.2, copy: 'FREE delivery + 20% off, today only!' }
};

export const OFFER_KEYS = Object.keys(OFFERS);

/**
 * Published benchmarks shown next to the model so learners can sanity-check it.
 * Researched October 2026. `confidence: 'verify'` means the figure came from a
 * secondary extract and should be checked against the primary page.
 */
export const BENCHMARKS = [
  { channel: 'email', metric: 'Click rate (median)', value: '2.09%', source: 'MailerLite email benchmarks 2025', url: 'https://www.mailerlite.com/blog/email-marketing-benchmarks', confidence: 'good' },
  { channel: 'email', metric: 'Unsubscribe rate (median)', value: '0.22%', source: 'MailerLite email benchmarks 2025', url: 'https://www.mailerlite.com/blog/email-marketing-benchmarks', confidence: 'good' },
  { channel: 'email', metric: 'E-commerce click / unsubscribe', value: '1.74% / 0.19%', source: 'Mailchimp benchmarks (2023 data)', url: 'https://mailchimp.com/resources/email-marketing-benchmarks/', confidence: 'good' },
  { channel: 'email', metric: 'Open rate', value: 'Not used', source: 'Apple Mail Privacy Protection inflates opens; the simulator rewards clicks and purchases instead', url: 'https://mailchimp.com/resources/email-marketing-benchmarks/', confidence: 'note' },
  { channel: 'sms', metric: 'US campaign click rate, "good" tier', value: '8.9–14.5%', source: 'Klaviyo help center: SMS campaign benchmarks', url: 'https://help.klaviyo.com/hc/en-us/articles/360051110111', confidence: 'good' },
  { channel: 'sms', metric: 'US campaign unsubscribe, "good" tier', value: '0.6–1.4%', source: 'Klaviyo help center: SMS campaign benchmarks', url: 'https://help.klaviyo.com/hc/en-us/articles/360051110111', confidence: 'good' },
  { channel: 'sms', metric: '"98% open rate"', value: 'Not used', source: 'Widely quoted, no primary source found, and SMS has no open tracking', url: 'https://blog.burstsms.com.au/sms-marketing/2015/12/1/how-accurate-is-the-98-sms-open-rate/', confidence: 'note' },
  { channel: 'push', metric: 'E-commerce CTR (Android / iOS)', value: '3.78% / 3.05%', source: 'Pushwoosh push benchmarks 2025', url: 'https://www.pushwoosh.com/blog/push-notification-benchmarks/', confidence: 'good' },
  { channel: 'push', metric: 'Opt-in median 2025 (Android / iOS)', value: '53.3% / 48.9%', source: 'Airship mobile benchmarks 2026', url: 'https://www.airship.com/mobile-app-push-notification-benchmarks-for-2026/', confidence: 'verify' },
  { channel: 'ads', metric: 'Facebook traffic-campaign CTR', value: '1.71%', source: 'WordStream / LocaliQ Facebook ads benchmarks 2025', url: 'https://www.wordstream.com/blog/facebook-ads-benchmarks-2025', confidence: 'good' },
  { channel: 'decisioning', metric: 'Agentic vs rule-based messaging (RCT)', value: '~21% fewer unsubscribes', source: 'Jeunen & Wheeler, "Behavioural Effects of Agentic Messaging" (preprint, Aampe)', url: 'https://arxiv.org/abs/2512.17462', confidence: 'verify' },
  { channel: 'decisioning', metric: 'Vendor-reported AI decisioning lifts', value: '+10% to +43%', source: 'Hightouch (WHOOP +10% conversion), Aampe (14–43% GMV). Vendor claims, use-case dependent', url: 'https://hightouch.com/customers/whoop-ai-decisioning', confidence: 'vendor' }
];

/** Model parameters with no published benchmark behind them. Shown as assumptions. */
export const ASSUMPTIONS = [
  'Per-send costs (email $0.001, SMS $0.012, push $0.0002, retargeting $0.03 per reached customer) are rough list-price assumptions.',
  'Incremental purchase probability per send (upliftRate) has no public benchmark. No credible "typical holdout lift" figure exists, so it is a model choice.',
  'Push opt-out per send (0.4%) and the fatigue curve are assumptions.'
];
