import React, { useEffect, useState } from 'react';
import SegmentationBasics from './modules/SegmentationBasics';
import ChannelOrchestration from './modules/ChannelOrchestration';
import GuardrailsCaps from './modules/GuardrailsCaps';
import AgenticOptimiser from './modules/AgenticOptimiser';

const STORAGE_KEY = 'cdpAgentX_progress';

export default function App() {
  const [progress, setProgress] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  return (
    <main className="container mx-auto p-4 space-y-8">
      {/* 🛈 course-intro */}
      <section className="mx-auto max-w-4xl text-center">
        <h1 className="text-3xl font-bold text-indigo-400 mb-2">CDPAgentX Mini-Course</h1>
        <p className="text-slate-300 text-sm md:text-base">
          Tweak the knobs a CDP marketer uses every day and watch the key metrics react in real&nbsp;time.
        </p>
      </section>
      <SegmentationBasics onComplete={() => setProgress(p => ({ ...p, seg: true }))} />
      <ChannelOrchestration onComplete={() => setProgress(p => ({ ...p, orch: true }))} />
      <GuardrailsCaps onComplete={() => setProgress(p => ({ ...p, guard: true }))} />
      <AgenticOptimiser onComplete={() => setProgress(p => ({ ...p, optimise: true }))} />
    </main>
  );
}
