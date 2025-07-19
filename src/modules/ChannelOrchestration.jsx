import React, { useEffect, useState } from 'react';
import MetricCard from '../components/MetricCard';

/**
 * Realistic channel orchestration showing diminishing returns and channel synergy.
 */
export default function ChannelOrchestration({ onComplete }) {
  const [steps, setSteps] = useState(['Email', 'Push', 'Ads']);

  // Calculate realistic lift based on channel order and synergy
  const calculateLift = (channels) => {
    const channelWeights = {
      'Email': 0.08,    // Email first = 8% base lift
      'Push': 0.05,     // Push first = 5% base lift  
      'Ads': 0.03       // Ads first = 3% base lift
    };

    const synergies = {
      'Email,Push': 0.02,      // Email → Push adds 2%
      'Email,Ads': 0.015,      // Email → Ads adds 1.5%
      'Push,Email': 0.01,      // Push → Email adds 1%
      'Push,Ads': 0.01,        // Push → Ads adds 1%
      'Ads,Email': 0.005,      // Ads → Email adds 0.5%
      'Ads,Push': 0.005        // Ads → Push adds 0.5%
    };

    let totalLift = 0;

    // Base lift from first channel
    if (channels.length > 0) {
      totalLift += channelWeights[channels[0]] || 0;
    }

    // Diminishing returns for subsequent channels
    for (let i = 1; i < channels.length; i++) {
      const baseWeight = channelWeights[channels[i]] || 0;
      const diminishingFactor = Math.pow(0.6, i); // Each subsequent touch is 60% as effective
      totalLift += baseWeight * diminishingFactor;

      // Add synergy bonus for this sequence
      const sequence = `${channels[i-1]},${channels[i]}`;
      totalLift += synergies[sequence] || 0;
    }

    return Math.min(totalLift, 0.15); // Cap at 15% to keep realistic
  };

  const lift = calculateLift(steps);

  // Signal completion when lift is optimized (Email → Push → Ads typically best)
  useEffect(() => {
    if (lift > 0.11 && onComplete) onComplete();
  }, [lift, onComplete]);

  const move = (index, dir) => {
    const arr = [...steps];
    const [removed] = arr.splice(index, 1);
    arr.splice(index + dir, 0, removed);
    setSteps(arr);
  };

  const addChannel = () => {
    const available = ['SMS', 'Direct Mail', 'Social'].filter(ch => !steps.includes(ch));
    if (available.length > 0) {
      setSteps([...steps, available[0]]);
    }
  };

  const removeChannel = (index) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-amber-400">Channel Orchestration</h2>
      <p className="text-slate-400 text-sm">
        Reorder channels to see how sequence affects lift. Each touch has diminishing returns.
      </p>
      <div className="bg-slate-800 p-3 rounded text-sm space-y-1">
        <p className="text-amber-300">💡 Real-world insights:</p>
        <ul className="text-slate-300 space-y-1 pl-4 list-disc">
          <li><strong>Email first</strong> gets highest attention (~8% lift)</li>
          <li><strong>Push notifications</strong> work well as follow-ups (~5% base)</li>
          <li><strong>Paid ads</strong> are great for retargeting (~3% base)</li>
          <li><strong>Each subsequent touch</strong> has 60% effectiveness of previous</li>
          <li><strong>Channel synergy</strong> adds bonus lift for smart sequences</li>
        </ul>
      </div>
      
      <div className="space-y-2">
        {steps.map((step, i) => (
          <div key={step} className="flex justify-between items-center bg-slate-800 p-3 rounded">
            <div className="flex items-center space-x-3">
              <span className="text-xs bg-slate-700 px-2 py-1 rounded">{i + 1}</span>
              <span className="font-medium">{step}</span>
              {i === 0 && <span className="text-xs text-emerald-400">(primary touch)</span>}
              {i > 0 && <span className="text-xs text-amber-400">(follow-up)</span>}
            </div>
            <div className="flex space-x-1">
              <button 
                onClick={() => move(i, -1)} 
                disabled={i === 0} 
                className="px-2 py-1 bg-slate-700 rounded disabled:opacity-50 hover:bg-slate-600"
              >
                ↑
              </button>
              <button 
                onClick={() => move(i, 1)} 
                disabled={i === steps.length - 1} 
                className="px-2 py-1 bg-slate-700 rounded disabled:opacity-50 hover:bg-slate-600"
              >
                ↓
              </button>
              <button 
                onClick={() => removeChannel(i)}
                disabled={steps.length <= 1}
                className="px-2 py-1 bg-red-700 rounded disabled:opacity-50 hover:bg-red-600 text-xs"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {steps.length < 6 && (
        <button 
          onClick={addChannel}
          className="w-full py-2 bg-indigo-700 rounded hover:bg-indigo-600 text-sm"
        >
          + Add Channel
        </button>
      )}

      <div className="text-xs text-slate-500 space-y-1">
        <p>💡 Try: Email → Push → Ads for optimal sequence</p>
        <p>⚠️ More channels ≠ better results due to diminishing returns</p>
      </div>

      <MetricCard label="Open/Click lift" value={lift} threshold={0.11} />
    </section>
  );
}