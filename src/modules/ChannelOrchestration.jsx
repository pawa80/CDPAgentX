import React, { useEffect, useState } from 'react';
import MetricCard from '../components/MetricCard';
import useSyntheticMetrics from '../hooks/useSyntheticMetrics';

/**
 * Simple reordering of channel steps to illustrate orchestration concepts.
 */
export default function ChannelOrchestration({ onComplete }) {
  const [steps, setSteps] = useState(['Email', 'Push', 'Ads']);
  const lift = useSyntheticMetrics(0.03);

  // signal completion when lift sufficiently high
  useEffect(() => {
    if (lift > 0.05 && onComplete) onComplete();
  }, [lift, onComplete]);

  const move = (index, dir) => {
    const arr = [...steps];
    const [removed] = arr.splice(index, 1);
    arr.splice(index + dir, 0, removed);
    setSteps(arr);
  };

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-amber-400">Channel Orchestration</h2>
      <p className="text-slate-400 text-sm">
        Drag channels to test how mix and order boost open/click lift.
      </p>
      <p className="text-slate-400 text-sm">
        The order matters because each touch pays a diminishing return. The first channel
        gets headline attention; later touches act as nudges or reminders. Drag channels
        until the lift number stops climbing—past that point you’re spamming.
      </p>
      <ul className="space-y-2">
        {steps.map((step, i) => (
          <li key={step} className="flex justify-between items-center bg-slate-800 p-2 rounded">
            <span>{step}</span>
            <div className="space-x-1">
              <button onClick={() => move(i, -1)} disabled={i === 0} className="px-2 py-1 bg-slate-700 rounded">↑</button>
              <button onClick={() => move(i, 1)} disabled={i === steps.length - 1} className="px-2 py-1 bg-slate-700 rounded">↓</button>
            </div>
          </li>
        ))}
      </ul>
      <span className="text-xs text-slate-500 ml-2">(first touch carries most weight)</span>
      <MetricCard label="Open/Click lift" value={lift} threshold={0.05} />
    </section>
  );
}
