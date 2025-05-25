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
      <label className="block">
        <span className="text-sm">Daily message cap</span>
        <input type="number" className="w-full text-black p-1" value={cap} onChange={e => setCap(Number(e.target.value))} />
      </label>
      <label className="block">
        <span className="text-sm">Forbidden words</span>
        <textarea className="w-full text-black p-1" rows="3" value={banned} onChange={e => setBanned(e.target.value)} />
      </label>
      <div className="bg-slate-800 h-4 rounded-full" aria-label="Compliance bar">
        <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${compliance * 100}%` }} />
      </div>
      <MetricCard label="Compliance" value={compliance} threshold={1} />
    </section>
  );
}
