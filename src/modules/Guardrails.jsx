import React, { useState } from 'react';
import Panel, { Card, RunButton } from '../components/Panel';
import Slider from '../components/Slider';
import Toggle from '../components/Toggle';
import Callout from '../components/Callout';
import KnowledgeCheck from '../components/KnowledgeCheck';
import { useScenario, useSimulation } from '../state/ScenarioContext';
import { OFFERS, OFFER_KEYS } from '../engine/channels';
import { allowedOffers, checkCopy } from '../engine/simulate';
import { fmtMoney, fmtNum, fmtPct } from '../components/format';
import { totalSends, totalUnsubs } from '../components/Results';
import { rulesPolicy } from './JourneyBuilder';

const CAPS = [1, 2, 3, 4, 5, 7];

export default function Guardrails() {
  const { scenario, update, complete } = useScenario();
  const g = scenario.guardrails;
  const sim = useSimulation();
  const [bannedText, setBannedText] = useState(g.bannedWords.join(', '));
  const { blocked } = allowedOffers(g);
  const currency = scenario.business.currency;

  const sweep = () =>
    sim
      .run(
        CAPS.map(cap => ({ key: `cap${cap}`, policy: rulesPolicy(scenario.journey), guardrails: { ...g, maxPerWeek: cap } })).concat(
          CAPS.map(cap => ({ key: `agent${cap}`, policy: { type: 'agent', ...scenario.agent }, guardrails: { ...g, maxPerWeek: cap } }))
        )
      )
      .then(() => complete('guardrailsRun'));

  const rows = sim.results
    ? CAPS.map(cap => ({ cap, rules: sim.results[`cap${cap}`], agent: sim.results[`agent${cap}`] }))
    : null;
  const best = key => rows && Math.max(...rows.map(r => r[key].truth.profit));

  return (
    <Panel
      step="Module 3"
      title="Guardrails: the rules agents must obey"
      intro={
        <p>
          Guardrails are hard limits that apply to rules and agents alike. An agent optimises <em>inside</em> them, so they are where
          the business, legal and brand teams keep control. Every setting here feeds the simulations in modules 2 and 4.
        </p>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Contact policy" className="space-y-5">
          <Slider
            label="Max messages per customer per week"
            value={g.maxPerWeek}
            min={1}
            max={7}
            onChange={v => update('guardrails.maxPerWeek', v)}
            hint="Frequency cap across all channels."
          />
          <Slider
            label="Min days between messages"
            value={g.minGapDays}
            min={0}
            max={6}
            onChange={v => update('guardrails.minGapDays', v)}
          />
          <Slider
            label="Max discount"
            value={g.maxDiscount}
            min={0}
            max={0.2}
            step={0.1}
            format={v => fmtPct(v)}
            onChange={v => update('guardrails.maxDiscount', v)}
            hint="Margin protection: offers above this can't be sent."
          />
          <Slider
            label="Holdout group"
            value={g.holdoutShare}
            min={0.05}
            max={0.3}
            step={0.05}
            format={v => fmtPct(v)}
            onChange={v => update('guardrails.holdoutShare', v)}
            hint="A bigger holdout gives a tighter measurement but less reach. 5–20% is the usual range."
          />
          <Toggle
            checked={g.protectList}
            onChange={v => update('guardrails.protectList', v)}
            label="Count unsubscribes as a cost (agent)"
            hint="The agent treats an opt-out as losing roughly one future order's profit. Turn it off to see a myopic agent."
          />
        </Card>

        <Card title="Brand & compliance copy check" className="space-y-4">
          <label className="block text-sm">
            Banned words and phrases <span className="text-slate-500">(comma-separated)</span>
            <input
              value={bannedText}
              onChange={e => {
                setBannedText(e.target.value);
                update('guardrails.bannedWords', e.target.value.split(',').map(w => w.trim()).filter(Boolean));
              }}
              className="mt-1 w-full rounded bg-slate-800 p-2"
              placeholder="e.g. free, guaranteed, risk-free"
            />
          </label>
          {OFFER_KEYS.map(k => {
            const copy = g.offerCopy[k] ?? OFFERS[k].copy;
            const hits = checkCopy(copy, g.bannedWords);
            const block = blocked.find(b => b.offer === k);
            return (
              <label key={k} className="block text-sm">
                <span className="flex justify-between">
                  <span>{OFFERS[k].label} message</span>
                  <span className={block ? 'text-rose-400' : 'text-emerald-400'}>{block ? `Blocked: ${block.reason}` : 'Approved'}</span>
                </span>
                <input
                  value={copy}
                  onChange={e => update(`guardrails.offerCopy.${k}`, e.target.value)}
                  className={`mt-1 w-full rounded bg-slate-800 p-2 ${hits.length ? 'ring-1 ring-rose-500' : ''}`}
                />
              </label>
            );
          })}
          <p className="text-xs text-slate-500">
            Try banning "free": the 20% offer is blocked and neither the journey nor the agent can use it. Generative agents write
            their own copy, so checks like this run on every message they produce.
          </p>
        </Card>
      </div>

      <Card title="What does the frequency cap cost or earn?" className="space-y-4">
        <p className="text-sm text-slate-300">
          Runs your module 2 journey and the module 4 agent at six different weekly caps, with all other guardrails as set above.
        </p>
        <RunButton status={sim.status} onClick={sweep}>
          Run cap comparison
        </RunButton>
        {rows && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm tabular-nums">
              <thead className="text-left text-xs uppercase text-slate-400">
                <tr>
                  <th className="py-2 pr-3">Cap / week</th>
                  <th className="pr-3">Rules: sends</th>
                  <th className="pr-3">Rules: unsubs</th>
                  <th className="pr-3">Rules: true profit</th>
                  <th className="pr-3">Agent: sends</th>
                  <th className="pr-3">Agent: unsubs</th>
                  <th>Agent: true profit</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.cap} className="border-t border-slate-800">
                    <td className="py-2 pr-3">{r.cap}</td>
                    <td className="pr-3">{fmtNum(totalSends(r.rules))}</td>
                    <td className="pr-3">{fmtNum(totalUnsubs(r.rules))}</td>
                    <td className={`pr-3 ${r.rules.truth.profit === best('rules') ? 'font-bold text-emerald-400' : ''}`}>
                      {fmtMoney(r.rules.truth.profit, currency)}
                    </td>
                    <td className="pr-3">{fmtNum(totalSends(r.agent))}</td>
                    <td className="pr-3">{fmtNum(totalUnsubs(r.agent))}</td>
                    <td className={r.agent.truth.profit === best('agent') ? 'font-bold text-emerald-400' : ''}>
                      {fmtMoney(r.agent.truth.profit, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-slate-500">
              Unsubscribed customers are lost for good. The 8-week profit understates that cost.
            </p>
          </div>
        )}
      </Card>

      <KnowledgeCheck
        question="Which of these belongs in a guardrail rather than in the agent's objective?"
        options={[
          '"Maximise incremental profit per customer"',
          '"Never send more than 3 messages a week, and never offer more than 10% to customers who bought in the last 30 days"',
          '"Prefer the channel each customer engages with most"'
        ]}
        answer={1}
        explanation="Objectives say what to aim for; the agent trades them off. Guardrails are hard constraints it can't trade away, so put legal, brand and margin limits there."
        onPass={() => complete('guardrails')}
      />
    </Panel>
  );
}
