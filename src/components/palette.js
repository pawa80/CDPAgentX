import { CHANNELS } from '../engine/channels';
import { armLabel } from '../engine/simulate';

export const POLICY_COLORS = { rules: '#f59e0b', agent: '#818cf8', oracle: '#34d399', holdout: '#94a3b8' };

const CHANNEL_HUES = { email: '#6366f1', sms: '#ec4899', push: '#14b8a6', ads: '#f97316' };
const OFFER_LIGHTNESS = { none: 1, ten: 0.75, twenty: 0.5 };

export function armColor(key) {
  if (key === 'none') return '#334155';
  const [ch, offer] = key.split(':');
  const hex = CHANNEL_HUES[ch] || '#94a3b8';
  const k = OFFER_LIGHTNESS[offer] ?? 1;
  const n = parseInt(hex.slice(1), 16);
  const mix = v => Math.round(v * k + 15 * (1 - k));
  return `rgb(${mix(n >> 16)}, ${mix((n >> 8) & 255)}, ${mix(n & 255)})`;
}

export { armLabel, CHANNELS };
