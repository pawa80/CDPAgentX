import React, { useEffect, useState } from 'react';
import MetricCard from '../components/MetricCard';
import useSyntheticMetrics from '../hooks/useSyntheticMetrics';

/**
 * Illustrates guardrails such as message caps and banned words.
 */
export default function GuardrailsCaps({ onComplete }) {
  const [cap, setCap] = useState(5);
  const [banned, setBanned] = useState('');
  const compliance = useSyntheticMetrics(0.5);

  useEffect(() => {
    if (compliance >= 1 && onComplete) onComplete();
  }, [compliance, onComplete]);

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-amber-400">Guardrails & Caps</h2>
      <p className="text-slate-400 text-sm">
        Keep campaigns compliant by setting message caps and forbidden words.
      </p>
      <p className="text-slate-400 text-sm">
        Every region has its own anti-spam laws (e.g., GDPR, CAN-SPAM). Caps and forbidden
        words are the blunt instruments a CDP enforces automatically. In practice you’d
        layer softer guardrails—send-time capping, fatigue rules—but this slider shows
        the hard stop effect.
      </p>
      <label className="block">
        <span className="text-sm">
          Daily message cap{' '}
          <span className="text-xs text-slate-500">(max per user/day)</span>
        </span>
        <input type="number" className="w-full text-black p-1" value={cap} onChange={e => setCap(Number(e.target.value))} />
      </label>
      <label className="block">
        <span className="text-sm">
          Forbidden words{' '}
          <span className="text-xs text-slate-500">(comma-separated)</span>
        </span>
        <textarea className="w-full text-black p-1" rows="3" value={banned} onChange={e => setBanned(e.target.value)} />
      </label>
      <div className="bg-slate-800 h-4 rounded-full" aria-label="Compliance bar">
        <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${compliance * 100}%` }} />
      </div>
      <MetricCard label="Compliance" value={compliance} threshold={1} />
    </section>
  );
}
