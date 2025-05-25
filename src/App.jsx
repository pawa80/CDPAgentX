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
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold text-center text-indigo-600">CDPAgentX Mini-Course</h1>
      <SegmentationBasics onComplete={() => setProgress(p => ({ ...p, seg: true }))} />
      <ChannelOrchestration onComplete={() => setProgress(p => ({ ...p, orch: true }))} />
      <GuardrailsCaps onComplete={() => setProgress(p => ({ ...p, guard: true }))} />
      <AgenticOptimiser onComplete={() => setProgress(p => ({ ...p, optimise: true }))} />
    </div>
  );
}
