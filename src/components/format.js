export const fmtMoney = (v, currency = 'USD', digits = 0) => {
  if (!Number.isFinite(v)) return '—';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: digits }).format(v);
  } catch {
    return `${v.toFixed(digits)} ${currency}`;
  }
};
export const fmtNum = (v, digits = 0) => (Number.isFinite(v) ? v.toLocaleString(undefined, { maximumFractionDigits: digits }) : '—');
export const fmtPct = (v, digits = 0) => (Number.isFinite(v) ? `${(v * 100).toFixed(digits)}%` : '—');
export const signed = (s, v) => (v > 0 ? `+${s}` : s);
