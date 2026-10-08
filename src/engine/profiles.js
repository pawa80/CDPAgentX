/**
 * Business presets. Every number here is an editable, illustrative default —
 * the point of the tool is that teams swap in their own figures.
 */
export const PROFILES = {
  retail: {
    label: 'Fashion & lifestyle e-commerce',
    aov: 85,
    grossMargin: 0.55,
    ordersPerYear: 2.0,
    consent: { email: 0.7, sms: 0.25, push: 0.15, ads: 0.55 },
    dealSeekerShare: 0.35
  },
  restaurant: {
    label: 'Restaurant group with loyalty app',
    aov: 38,
    grossMargin: 0.65,
    ordersPerYear: 5.0,
    consent: { email: 0.6, sms: 0.2, push: 0.4, ads: 0.5 },
    dealSeekerShare: 0.45
  },
  subscription: {
    label: 'Beauty / replenishment brand',
    aov: 55,
    grossMargin: 0.7,
    ordersPerYear: 3.5,
    consent: { email: 0.75, sms: 0.35, push: 0.1, ads: 0.55 },
    dealSeekerShare: 0.3
  }
};

export const DEFAULT_PROFILE = 'retail';
