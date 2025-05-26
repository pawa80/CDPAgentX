import React, { useEffect, useState } from 'react';
import Slider from '../components/Slider';
import Toggle from '../components/Toggle';
import MetricCard from '../components/MetricCard';
import useSyntheticMetrics from '../hooks/useSyntheticMetrics';

/**
 * Demonstrates basic rule-based segmentation with optional similarity search.
 */
export default function SegmentationBasics({ onComplete }) {
  const [recency, setRecency] = useState(30);
  const [frequency, setFrequency] = useState(3);
  const [monetary, setMonetary] = useState(100);
  const [similarity, setSimilarity] = useState(false);

  // synthetic % of reachable audience
  const reach = useSyntheticMetrics(0.5);

  // flag completion when audience reach high
  useEffect(() => {
    if (reach >= 0.7 && onComplete) onComplete();
  }, [reach, onComplete]);

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-amber-400">Segmentation Basics</h2>
      {/* 🛈 section-explainer */}
      <p className="text-slate-400 text-sm">
        Adjust RFM thresholds to see how strict rules narrow or widen your audience.
        Toggle “Similarity search” to bring in look-alike customers.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Slider
          label={
            <span>
              Recency days{' '}
              <span className="text-xs text-slate-500">(lower includes dormant users)</span>
            </span>
          }
          value={recency}
          onChange={setRecency}
          min={0}
          max={60}
        />
        <Slider
          label={
            <span>
              Frequency{' '}
              <span className="text-xs text-slate-500">(higher = power shoppers)</span>
            </span>
          }
          value={frequency}
          onChange={setFrequency}
          min={1}
          max={10}
        />
        <Slider
          label={
            <span>
              Monetary ${' '}
              <span className="text-xs text-slate-500">(minimum lifetime spend)</span>
            </span>
          }
          value={monetary}
          onChange={setMonetary}
          min={0}
          max={500}
        />
      </div>
      <Toggle
        label={
          <span>
            Similarity search{' '}
            <span className="text-xs text-slate-500">(vector look-alikes)</span>
          </span>
        }
        checked={similarity}
        onChange={setSimilarity}
      />
      <MetricCard label="Reachable audience" value={reach} threshold={0.7} />
    </section>
  );
}
