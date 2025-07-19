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
      'Email': 0.12,    // Email first = 12% base lift (2025: ~22% avg open rate, 3.5% CTR)
      'Push': 0.08,     // Push first = 8% base lift (2025: ~15% open rate, mobile-first)
      'SMS': 0.15,      // SMS first = 15% base lift (2025: ~98% open rate, 6% CTR)
      'Ads': 0.04,      // Ads first = 4% base lift (2025: ~2.5% CTR, iOS changes impact)
      'Direct Mail': 0.06, // Direct Mail = 6% base lift (2025: ~5.1% response rate)
      'Social': 0.03    // Social = 3% base lift (2025: ~1.2% engagement rate)
    };

    const synergies = {
      'Email,Push': 0.025,     // Email → Push adds 2.5% (strong mobile synergy)
      'Email,SMS': 0.035,      // Email → SMS adds 3.5% (best synergy 2025)
      'Email,Ads': 0.02,       // Email → Ads adds 2% (retargeting boost)
      'SMS,Push': 0.03,        // SMS → Push adds 3% (mobile-native sequence)
      'SMS,Email': 0.015,      // SMS → Email adds 1.5% (reverse funnel)
      'Push,Email': 0.015,     // Push → Email adds 1.5%
      'Push,Ads': 0.02,        // Push → Ads adds 2% (mobile retargeting)
      'Ads,Email': 0.01,       // Ads → Email adds 1%
      'Ads,Push': 0.01,        // Ads → Push adds 1%
      'Direct Mail,Email': 0.025, // Direct Mail → Email adds 2.5% (offline-to-online)
      'Social,Email': 0.015    // Social → Email adds 1.5%
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

    return Math.min(totalLift, 0.25); // Cap at 25% for 2025 multi-channel reality
  };

  const lift = calculateLift(steps);

  // Signal completion when lift is optimized (Email → Push → Ads typically best)
  useEffect(() => {
    if (lift > 0.16 && onComplete) onComplete();
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
          <li><strong>SMS first</strong> gets highest attention (~15% lift, 98% open rate)</li>
          <li><strong>Email first</strong> is reliable starter (~12% lift, 22% open rate)</li>
          <li><strong>Push notifications</strong> work well as follow-ups (~8% base)</li>
          <li><strong>Paid ads</strong> face iOS headwinds (~4% base, privacy changes)</li>
          <li><strong>Each subsequent touch</strong> has 60% effectiveness of previous</li>
          <li><strong>Best synergy 2025:</strong> Email→SMS or SMS→Push sequences</li>
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
        <p>💡 Try: SMS → Email → Push for 2025 optimal sequence</p>
        <p>⚠️ More channels ≠ better results due to diminishing returns</p>
      </div>

      <MetricCard label="Open/Click lift" value={lift} threshold={0.16} />
    </section>
  );
}