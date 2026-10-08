import React from 'react';
import Panel, { Card } from '../components/Panel';
import { ASSUMPTIONS, BENCHMARKS, CHANNELS } from '../engine/channels';
import { fmtPct } from '../components/format';

const CONFIDENCE = {
  good: { label: 'Primary source', cls: 'text-emerald-400' },
  verify: { label: 'Secondary extract, verify', cls: 'text-amber-300' },
  vendor: { label: 'Vendor claim', cls: 'text-amber-300' },
  note: { label: 'Deliberately not used', cls: 'text-slate-400' }
};

export default function Method() {
  return (
    <Panel
      step="Reference"
      title="Method & sources"
      intro={<p>What the simulator assumes, where the numbers come from, and where it is deliberately simple.</p>}
    >
      <Card title="Model parameters vs. published benchmarks">
        <div className="overflow-x-auto">
          <table className="w-full text-sm tabular-nums">
            <thead className="text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="py-2 pr-3">Channel</th>
                <th className="pr-3">Click / engage per send</th>
                <th className="pr-3">Opt-out per send</th>
                <th className="pr-3">Cost per send</th>
                <th>Incremental purchase per send</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(CHANNELS).map(c => (
                <tr key={c.label} className="border-t border-slate-800">
                  <td className="py-2 pr-3">{c.label}</td>
                  <td className="pr-3">{fmtPct(c.engageRate, 1)}</td>
                  <td className="pr-3">{c.unsubRate ? fmtPct(c.unsubRate, 1) : 'n/a'}</td>
                  <td className="pr-3">${c.cost}</td>
                  <td>{fmtPct(c.upliftRate, 2)} (assumption)</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          These are averages. Each simulated customer's response is scaled by hidden traits, so individuals vary widely around them.
        </p>
      </Card>

      <Card title="Published benchmarks (researched October 2026)">
        <ul className="divide-y divide-slate-800 text-sm">
          {BENCHMARKS.map(b => (
            <li key={b.metric + b.source} className="flex flex-col gap-1 py-2 md:flex-row md:items-baseline md:gap-4">
              <span className="w-24 shrink-0 text-xs uppercase text-slate-500">{b.channel}</span>
              <span className="flex-1 text-slate-200">
                {b.metric}: <strong>{b.value}</strong>
                <a href={b.url} target="_blank" rel="noreferrer" className="block text-xs text-indigo-300 underline">
                  {b.source}
                </a>
              </span>
              <span className={`text-xs ${CONFIDENCE[b.confidence].cls}`}>{CONFIDENCE[b.confidence].label}</span>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Assumptions without a benchmark">
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-300">
            {ASSUMPTIONS.map(a => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </Card>
        <Card title="How the model works">
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-300">
            <li>Each customer has a hidden yearly purchase rate (gamma-distributed). Recency, frequency and spend are generated from it.</li>
            <li>
              A message adds an incremental purchase probability: the channel's base rate × the customer's channel affinity × their
              persuadability × an offer effect (much stronger for deal-seekers) × a recency effect (lapsing customers respond most) ×
              fatigue.
            </li>
            <li>Fatigue builds with each message and decays about 15% a day. It cuts response and raises opt-out risk.</li>
            <li>Offers are "today only". Anyone who buys that day gets the discount, including people who would have bought anyway.</li>
            <li>
              Outcomes use common random numbers, so the same customer on the same day has the same luck in every run. That lets us
              compare each policy to a do-nothing run of the same customers and get the <em>true</em> incremental effect.
            </li>
            <li>
              The agent is a Beta-Bernoulli contextual bandit. Context is 27 cells: recency × order count × days since last message. Its
              arms are "no message" and "message with offer X". Channel is chosen per customer from their click history, which starts
              from 12 months of simulated history.
            </li>
          </ul>
        </Card>
      </div>

      <Card title="Known simplifications">
        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-300">
          <li>Purchases are attributed to a decision on the same day only. Real systems handle delayed rewards and longer conversion windows.</li>
          <li>No send-time optimisation, creative variants or cross-customer effects (word of mouth, cannibalisation between channels).</li>
          <li>The business case annualises an 8-week campaign linearly. It ignores seasonality and long-run list erosion.</li>
          <li>The oracle is a one-step greedy policy with perfect information. It is a practical ceiling, not a true optimum.</li>
        </ul>
      </Card>
    </Panel>
  );
}
