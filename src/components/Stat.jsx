import React from 'react';

const TONES = {
  neutral: 'text-slate-100',
  good: 'text-emerald-400',
  bad: 'text-rose-400',
  warn: 'text-amber-300',
  accent: 'text-indigo-300'
};

/** Single KPI tile. */
export default function Stat({ label, value, hint, tone = 'neutral' }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-xl font-semibold tabular-nums ${TONES[tone]}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
