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
      {/* 🛈 rfm-definitions */}
      <ul className="text-slate-400 text-sm space-y-1 pl-4 list-disc">
        <li>
          <strong>Recency (R)</strong>: how many days since the customer’s last
          purchase or engagement. Lower means “freshly active”.
        </li>
        <li>
          <strong>Frequency (F)</strong>: how often the customer bought or
          engaged within the look-back window. Higher = loyal repeaters.
        </li>
        <li>
          <strong>Monetary (M)</strong>: the customer’s total spend (or LTV) in
          the same window. Higher means bigger spenders.
        </li>
      </ul>
      <p className="text-slate-400 text-sm mt-2">
        In real CDPs you rarely set R, F, M in isolation. You’ll combine them with geography,
        lifecycle stage, or predictive scores. The sliders here isolate the principle:
        <em>tighten a rule and the pool shrinks; loosen and it grows.</em> Notice how 70 % reach
        is the “green” zone—large enough to test, small enough to stay relevant.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Slider
          label={
            <span>
              Recency days
              <span className="ml-2 text-xs text-amber-300 italic">
                (drag left to include customers who’ve been quiet longer)
              </span>
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
              Frequency
              <span className="ml-2 text-xs text-amber-300 italic">
                (drag right to require more repeat activity)
              </span>
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
              Monetary $
              <span className="ml-2 text-xs text-amber-300 italic">
                (drag right to target higher spenders)
              </span>
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
