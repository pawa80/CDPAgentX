import React from 'react';
import Panel, { Card, RunButton } from '../components/Panel';
import Slider from '../components/Slider';
import Callout from '../components/Callout';
import KnowledgeCheck from '../components/KnowledgeCheck';
import LineChart from '../components/LineChart';
import Results from '../components/Results';
import { useScenario, useSimulation } from '../state/ScenarioContext';
import { CHANNELS, CHANNEL_KEYS, OFFERS, OFFER_KEYS } from '../engine/channels';
import { fmtMoney, fmtNum } from '../components/format';
import { POLICY_COLORS } from '../components/palette';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function rulesPolicy(journey) {
  return { type: 'rules', steps: journey.steps, offer: journey.offer, cycleDays: 7, suppressRecentBuyersDays: journey.suppressRecentBuyersDays };
}

export default function JourneyBuilder() {
  const { scenario, update, segment, complete } = useScenario();
  const sim = useSimulation();
  const j = scenario.journey;
  const currency = scenario.business.currency;
  const r = sim.results?.rules;

  const setDay = (day, channel) => {
    const steps = j.steps.filter(s => s.day !== day);
    if (channel) steps.push({ channel, day });
    update('journey.steps', steps.sort((a, b) => a.day - b.day));
  };

  return (
    <Panel
      step="Module 2"
      title="Journey: a classic rule-based campaign"
      intro={
        <p>
          Build the weekly journey you'd set up in a CDP canvas: which channel goes out on which day, and with which offer. Everyone in
          the audience from module 1 gets the same treatment, limited only by consent and the caps in module 3. The simulation runs{' '}
          {scenario.sim.days / 7} weeks and keeps a random {Math.round(scenario.guardrails.holdoutShare * 100)}% of the audience as a
          holdout.
        </p>
      }
    >
      <div className="grid gap-6 lg:grid-cols-5">
        <Card title="Weekly journey" className="space-y-4 lg:col-span-2">
          <div className="grid grid-cols-7 gap-1">
            {DAYS.map((d, day) => {
              const step = j.steps.find(s => s.day === day);
              return (
                <label key={d} className="flex flex-col items-center gap-1 text-xs text-slate-400">
                  {d}
                  <select
                    aria-label={`Channel on ${d}`}
                    value={step?.channel || ''}
                    onChange={e => setDay(day, e.target.value)}
                    className={`w-full rounded px-0.5 py-1 text-center text-[11px] ${step ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                  >
                    <option value="">—</option>
                    {CHANNEL_KEYS.map(ch => (
                      <option key={ch} value={ch}>
                        {CHANNELS[ch].label.replace('Paid retargeting', 'Ads')}
                      </option>
                    ))}
                  </select>
                </label>
              );
            })}
          </div>
          <label className="block text-sm">
            Offer on every message
            <select value={j.offer} onChange={e => update('journey.offer', e.target.value)} className="mt-1 w-full rounded bg-slate-800 p-2">
              {OFFER_KEYS.map(k => (
                <option key={k} value={k}>
                  {OFFERS[k].label}
                </option>
              ))}
            </select>
          </label>
          <Slider
            label="Suppress recent buyers"
            value={j.suppressRecentBuyersDays}
            min={0}
            max={30}
            format={v => (v ? `${v} days` : 'off')}
            onChange={v => update('journey.suppressRecentBuyersDays', v)}
            hint="A common rule: don't message anyone who bought in the last N days."
          />
          <RunButton status={sim.status} onClick={() => sim.run([{ key: 'rules', policy: rulesPolicy(j) }]).then(() => complete('journeyRun'))} />
          <p className="text-xs text-slate-500">Audience: {fmtNum(segment.stats.count)} customers from module 1.</p>
        </Card>

        <div className="space-y-4 lg:col-span-3">
          {!r && sim.status !== 'running' && (
            <Callout>
              <p>Run the simulation to see the campaign read three ways: attributed, holdout-measured, and true.</p>
            </Callout>
          )}
          {sim.error && <Callout kind="warn">{sim.error}</Callout>}
          {r && (
            <>
              <Results r={r} currency={currency} />
              <Card title="True incremental profit, cumulative">
                <LineChart
                  ariaLabel="Cumulative true incremental profit of the rule-based journey"
                  series={[{ name: 'Rule journey', color: POLICY_COLORS.rules, values: r.truth.cumulative }]}
                  format={v => fmtMoney(v, currency)}
                />
              </Card>
            </>
          )}
        </div>
      </div>

      {r && (
        <Callout kind="lesson" title="Attribution is not incrementality">
          <p>
            The journey was credited with <strong>{fmtNum(r.treated.attributed)}</strong> conversions, but only about{' '}
            <strong>{fmtNum(r.truth.conversions)}</strong> would not have happened without it. The rest were customers who were going
            to buy anyway, and some of them used your discount. That's why the discount line can be bigger than the profit line.
          </p>
          <p>
            The holdout estimate is honest but noisy: look at the width of its interval. Bigger holdouts or longer tests narrow it.
            Try a 20% holdout in module 3.
          </p>
        </Callout>
      )}

      <KnowledgeCheck
        question="Your 10%-off journey shows strong attributed revenue, but the holdout says incremental profit is roughly zero. What is the most useful next experiment?"
        options={[
          'Add another channel to the journey to increase reach',
          'Test the same journey with no discount, and suppress recent buyers, against the holdout',
          'Switch attribution to a 7-day window so the campaign gets more credit'
        ]}
        answer={1}
        explanation="Blanket discounts subsidise people who would buy anyway. Removing the discount, or aiming it, usually recovers margin. A wider attribution window just inflates the report."
        onPass={() => complete('journey')}
      />
    </Panel>
  );
}
