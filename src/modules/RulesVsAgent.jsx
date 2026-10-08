import React from 'react';
import Panel, { Card, RunButton } from '../components/Panel';
import Slider from '../components/Slider';
import Callout from '../components/Callout';
import KnowledgeCheck from '../components/KnowledgeCheck';
import LineChart from '../components/LineChart';
import StackedBars from '../components/StackedBars';
import { useScenario, useSimulation } from '../state/ScenarioContext';
import { OFFERS } from '../engine/channels';
import { REST_BUCKETS } from '../engine/simulate';
import { fmtMoney, fmtNum, fmtPct } from '../components/format';
import { totalSends, totalUnsubs } from '../components/Results';
import { POLICY_COLORS, armColor, armLabel } from '../components/palette';
import { rulesPolicy } from './JourneyBuilder';

const METHODS = {
  thompson: { label: 'Thompson sampling', help: 'Samples from what it believes. Explores more where it is uncertain, then settles. The workhorse of production decisioning.' },
  egreedy: { label: 'ε-greedy', help: 'Does the best-known thing, except for a fixed share of random tries. Simple, but it keeps paying for exploration forever.' },
  greedy: { label: 'Greedy (exploit only)', help: 'Always does what looks best right now. It never tests alternatives, so early bad luck can lock it into a poor policy.' }
};

const POLICIES = [
  { key: 'rules', name: 'Rule journey' },
  { key: 'agent', name: 'Agent' },
  { key: 'oracle', name: 'Oracle (perfect information)' }
];

export default function RulesVsAgent() {
  const { scenario, update, complete } = useScenario();
  const sim = useSimulation();
  const a = scenario.agent;
  const currency = scenario.business.currency;
  const res = sim.results;

  const run = () =>
    sim
      .run([
        { key: 'rules', policy: rulesPolicy(scenario.journey) },
        { key: 'agent', policy: { type: 'agent', ...a } },
        { key: 'oracle', policy: { type: 'oracle' } }
      ])
      .then(() => complete('agentRun'));

  const mixRows = key =>
    res[key].actionMix.map((week, w) => ({
      label: `Week ${w + 1}`,
      parts: Object.entries(week)
        .sort(([x], [y]) => (x === 'none' ? 1 : y === 'none' ? -1 : x.localeCompare(y)))
        .map(([k, value]) => ({ key: k, value }))
    }));

  const lift = res && res.rules.truth.profit > 0 ? res.agent.truth.profit / res.rules.truth.profit - 1 : null;
  const captured =
    res && res.oracle.truth.profit > 0 ? res.agent.truth.profit / res.oracle.truth.profit : null;

  return (
    <Panel
      step="Module 4"
      title="Rules vs. agent: head to head"
      intro={
        <>
          <p>
            The agent gets the same audience, channels, offers and guardrails as your journey. Each day it decides, for each customer,
            whether to message at all, on which channel, and with which offer. It learns from what happens.
          </p>
          <p>
            Under the hood this is a <strong>contextual bandit</strong>, the same family of methods behind BrazeAI Decisioning Studio,
            Hightouch AI Decisioning and Bloomreach's contextual personalisation. It compares every option against "send nothing", so
            it optimises for <em>incremental</em> profit, not attributed conversions. The oracle sees the hidden truth and shows the
            ceiling.
          </p>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Agent settings" className="space-y-4">
          <label className="block text-sm">
            Learning method
            <select value={a.method} onChange={e => update('agent.method', e.target.value)} className="mt-1 w-full rounded bg-slate-800 p-2">
              {Object.entries(METHODS).map(([k, m]) => (
                <option key={k} value={k}>
                  {m.label}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-slate-500">{METHODS[a.method].help}</span>
          </label>
          {a.method === 'egreedy' && (
            <Slider label="Exploration rate ε" value={a.epsilon} min={0.02} max={0.5} step={0.02} format={v => fmtPct(v)} onChange={v => update('agent.epsilon', v)} />
          )}
          <label className="block text-sm">
            Reward the agent optimises
            <select value={a.reward} onChange={e => update('agent.reward', e.target.value)} className="mt-1 w-full rounded bg-slate-800 p-2">
              <option value="profit">Incremental profit (after discount, channel cost, unsubscribe risk)</option>
              <option value="conversions">Incremental conversions (ignores cost)</option>
            </select>
          </label>
          <Slider
            label="Campaign length"
            value={scenario.sim.days}
            min={28}
            max={112}
            step={14}
            format={v => `${v / 7} weeks`}
            onChange={v => update('sim.days', v)}
          />
          <Slider label="Random seed" value={scenario.sim.seed} min={1} max={20} onChange={v => update('sim.seed', v)} hint="Change it to check a result isn't luck." />
          <RunButton status={sim.status} onClick={run}>
            Run head to head
          </RunButton>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          {!res && sim.status !== 'running' && (
            <Callout>
              <p>Run the comparison. It takes a few seconds: three policies, each with its own do-nothing counterfactual.</p>
            </Callout>
          )}
          {sim.error && <Callout kind="warn">{sim.error}</Callout>}
          {res && (
            <>
              <Card title="True incremental profit, cumulative">
                <LineChart
                  ariaLabel="Cumulative true incremental profit for rules, agent and oracle"
                  series={POLICIES.map(p => ({
                    name: p.name,
                    color: POLICY_COLORS[p.key],
                    dashed: p.key === 'oracle',
                    values: res[p.key].truth.cumulative
                  }))}
                  format={v => fmtMoney(v, currency)}
                />
              </Card>
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-sm tabular-nums">
                  <thead className="bg-slate-900 text-left text-xs uppercase text-slate-400">
                    <tr>
                      <th className="p-2">Policy</th>
                      <th className="p-2">Sends</th>
                      <th className="p-2">Unsubs</th>
                      <th className="p-2">Discounts</th>
                      <th className="p-2">Attributed conv.</th>
                      <th className="p-2">Holdout-measured profit</th>
                      <th className="p-2">True inc. profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {POLICIES.map(p => {
                      const r = res[p.key];
                      return (
                        <tr key={p.key} className="border-t border-slate-800">
                          <td className="p-2 font-medium" style={{ color: POLICY_COLORS[p.key] }}>
                            {p.name}
                          </td>
                          <td className="p-2">{fmtNum(totalSends(r))}</td>
                          <td className="p-2">{fmtNum(totalUnsubs(r))}</td>
                          <td className="p-2">{fmtMoney(r.treated.discountCost, currency)}</td>
                          <td className="p-2">{fmtNum(r.treated.attributed)}</td>
                          <td className="p-2">
                            {fmtMoney(r.measured.profit, currency)}
                            <span className="block text-xs text-slate-500">
                              ±{fmtMoney((r.measured.profitHigh - r.measured.profitLow) / 2, currency)}
                            </span>
                          </td>
                          <td className="p-2 font-semibold">{fmtMoney(r.truth.profit, currency)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-slate-300">
                {lift !== null && (
                  <>
                    The agent delivered <strong className={lift >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{lift >= 0 ? '+' : ''}{fmtPct(lift)}</strong> true
                    incremental profit vs. your journey.{' '}
                  </>
                )}
                {captured !== null && <>It captured {fmtPct(captured)} of the oracle's ceiling. </>}
                Try another seed: results move, and that's the point of measuring with a holdout.
              </p>
            </>
          )}
        </div>
      </div>

      {res && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="What the agent did, week by week">
            <StackedBars rows={mixRows('agent')} colors={armColor} labels={armLabel} />
            <p className="mt-3 text-xs text-slate-500">
              Share of daily decisions for treated customers. "No message" is a decision too: the agent learns when to stay quiet.
            </p>
          </Card>
          <Card title="What it learned (customers rested 7+ days)">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-400">
                <tr>
                  <th className="py-1">Recency</th>
                  <th>Orders</th>
                  <th>Buys anyway / day</th>
                  <th>Best offer</th>
                </tr>
              </thead>
              <tbody>
                {res.agent.learned
                  .filter(l => l.rest === REST_BUCKETS[2])
                  .map(l => (
                    <tr key={`${l.recency}${l.value}`} className="border-t border-slate-800">
                      <td className="py-1.5 pr-2 text-slate-300">{l.recency}</td>
                      <td className="pr-2 text-slate-300">{l.value}</td>
                      <td className="pr-2 tabular-nums">{fmtPct(l.organicRate, 2)}</td>
                      <td>{l.bestOffer ? OFFERS[l.bestOffer].label : <span className="text-slate-500">Don't message</span>}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-slate-500">
              Channel is chosen per customer from their own click history, so it isn't shown per segment.
            </p>
          </Card>
        </div>
      )}

      <Callout kind="lesson" title="Things to try">
        <ul className="list-disc space-y-1 pl-5">
          <li>Switch to <strong>Greedy</strong>. Without exploration the agent can lock in early and stop learning.</li>
          <li>
            Set the reward to <strong>conversions</strong>. The agent hands out discounts to buy conversions it doesn't profit from.
            That's reward hacking: you get what you measure.
          </li>
          <li>
            In module 3, turn off <strong>unsubscribes as a cost</strong> and raise the cap. Watch opt-outs climb. A published RCT of agentic
            vs. rule-based messaging reported about 21% fewer unsubscribes for the agent (see Method &amp; sources).
          </li>
          <li>Run 4 weeks, then 16 weeks. Agents need data. Short tests undersell them.</li>
        </ul>
      </Callout>

      <KnowledgeCheck
        question="The agent beats your journey by 30% in a 2-week pilot, but the holdout interval is wider than the difference. What should you conclude?"
        options={[
          'The agent is 30% better; roll it out',
          'The test is underpowered. Extend it or enlarge the holdout before deciding',
          'The agent failed; go back to rules'
        ]}
        answer={1}
        explanation="If the interval is wider than the effect, the result is not distinguishable from noise. Agents also improve as they learn, so short pilots tend to understate them."
        onPass={() => complete('agent')}
      />
    </Panel>
  );
}
