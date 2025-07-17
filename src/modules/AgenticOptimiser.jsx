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

  // performance metric that responds to exploration vs exploitation
  const performance = useSyntheticMetrics(0.8, { explore, target, tolerance });
  
  // calculate goal delta based on how close we are to target
  const goalDelta = Math.abs(performance - (target / 1000)) / (target / 1000);

  useEffect(() => {
    if (goalDelta <= tolerance / 100 && onComplete) onComplete();
  }, [goalDelta, tolerance, onComplete]);

  // track last 30 points for sparkline
  const [points, setPoints] = useState([]);
  useEffect(() => {
    setPoints(p => [...p.slice(-29), performance]);
  }, [performance]);

  const width = 200;
  const height = 80;
  const path = points.map((d, i) => `${(i / 29) * width},${height - d * height}`).join(' ');

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-amber-400">Agentic Optimiser</h2>
      <p className="text-slate-400 text-sm">
        This optimiser is a stand-in for Bloomreach’s Experiment engine or any reinforcement
        learning loop. Give it a revenue target and it will test tactics (<em>explore</em>)
        while exploiting winners (<em>exploit</em>). The green goal delta means you’re within
        tolerance. Lower tolerance for stricter goals or slide Explore to see how volatility
        changes. The smoothed line updates once per second so you can link your actions to
        the trend.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="flex flex-col space-y-1">
          <span className="text-sm">
            Revenue target <span className="text-xs text-slate-500">(USD)</span>
          </span>
          <input type="number" className="p-1 text-black" value={target} onChange={e => setTarget(Number(e.target.value))} />
        </label>
        <label className="flex flex-col space-y-1">
          <span className="text-sm">
            Tolerance % <span className="text-xs text-slate-500">(acceptable drift)</span>
          </span>
          <input type="number" className="p-1 text-black" value={tolerance} onChange={e => setTolerance(Number(e.target.value))} />
        </label>
        <Slider
          label={
            <span>
              Explore vs Exploit{' '}
              <span className="text-xs text-slate-500">(0 = exploit only)</span>
            </span>
          }
          value={explore}
          onChange={setExplore}
          min={0}
          max={100}
        />
      </div>
      <svg width={width} height={height} className="bg-slate-800 rounded">
        <polyline points={path} fill="none" stroke="#10b981" strokeWidth="2" />
      </svg>
      <MetricCard label="Goal delta" value={1 - goalDelta} threshold={0.9} />
    </section>
  );
}
