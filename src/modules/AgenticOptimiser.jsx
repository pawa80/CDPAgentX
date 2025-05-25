import React, { useEffect, useState } from 'react';
import Slider from '../components/Slider';
import MetricCard from '../components/MetricCard';
import useSyntheticMetrics from '../hooks/useSyntheticMetrics';

/**
 * Demonstrates agentic optimisation loop aiming to hit a revenue goal.
 */
export default function AgenticOptimiser({ onComplete }) {
  const [target, setTarget] = useState(1000);
  const [tolerance, setTolerance] = useState(5);
  const [explore, setExplore] = useState(50);

  // delta oscillates around zero
  const delta = useSyntheticMetrics(0.5) - 0.5;

  useEffect(() => {
    if (delta <= 0 && onComplete) onComplete();
  }, [delta, onComplete]);

  // track last 30 points for sparkline
  const [points, setPoints] = useState([]);
  useEffect(() => {
    setPoints(p => [...p.slice(-29), delta]);
  }, [delta]);

  const width = 200;
  const height = 80;
  const path = points.map((d, i) => `${(i / 29) * width},${height - ((d + 1) / 2) * height}`).join(' ');

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-amber-400">Agentic Optimiser</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="flex flex-col space-y-1">
          <span className="text-sm">Revenue target</span>
          <input type="number" className="p-1 text-black" value={target} onChange={e => setTarget(Number(e.target.value))} />
        </label>
        <label className="flex flex-col space-y-1">
          <span className="text-sm">Tolerance %</span>
          <input type="number" className="p-1 text-black" value={tolerance} onChange={e => setTolerance(Number(e.target.value))} />
        </label>
        <Slider label="Explore vs Exploit" value={explore} onChange={setExplore} min={0} max={100} />
      </div>
      <svg width={width} height={height} className="bg-slate-800 rounded">
        <polyline points={path} fill="none" stroke="#10b981" strokeWidth="2" />
      </svg>
      <MetricCard label="Goal delta" value={1 - Math.max(Math.min(delta + 1, 1), 0)} threshold={1} />
    </section>
  );
}
