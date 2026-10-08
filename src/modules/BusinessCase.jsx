import React, { useState } from 'react';
import Panel, { Card, RunButton } from '../components/Panel';
import Callout from '../components/Callout';
import Stat from '../components/Stat';
import { useScenario, useSimulation } from '../state/ScenarioContext';
import { CHANNELS, CHANNEL_KEYS } from '../engine/channels';
import { fmtMoney, fmtNum, fmtPct } from '../components/format';
import { rulesPolicy } from './JourneyBuilder';

const SEEDS = [1, 2, 3];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'NOK', 'SEK', 'DKK'];
const RESPONSE = [
  { value: 0.5, label: 'Conservative: customers respond half as much' },
  { value: 1, label: 'Central: simulator defaults' },
  { value: 1.5, label: 'Optimistic: customers respond 50% more' }
];

function NumberField({ label, value, onChange, step = 1, suffix, hint }) {
  return (
    <label className="block text-sm">
      {label}
      <span className="mt-1 flex items-center gap-2">
        <input
          type="number"
          value={value}
          step={step}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full rounded bg-slate-800 p-2 tabular-nums"
        />
        {suffix && <span className="text-slate-400">{suffix}</span>}
      </span>
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

/**
 * Scale the simulated per-customer effect to the user's own base.
 * Simulated profit is per treated customer over the sim period; we annualise linearly.
 */
function annualise(r, customers, days) {
  return (r.truth.profit / r.treated.n) * customers * (365 / days);
}

export default function BusinessCase() {
  const { scenario, update, complete } = useScenario();
  const sim = useSimulation();
  const [copied, setCopied] = useState(false);
  const p = scenario.profile;
  const b = scenario.business;
  const currency = b.currency;

  const run = () =>
    sim
      .run(
        SEEDS.flatMap(seed => [
          { key: `rules${seed}`, policy: rulesPolicy(scenario.journey), seed, audience: 'all' },
          { key: `agent${seed}`, policy: { type: 'agent', ...scenario.agent }, seed, audience: 'all' }
        ])
      )
      .then(() => complete('business'));

  let out = null;
  if (sim.results) {
    const rules = SEEDS.map(s => annualise(sim.results[`rules${s}`], b.customers, scenario.sim.days));
    const agent = SEEDS.map(s => annualise(sim.results[`agent${s}`], b.customers, scenario.sim.days));
    const diff = SEEDS.map((_, i) => agent[i] - rules[i]);
    const mid = arr => arr.reduce((x, y) => x + y, 0) / arr.length;
    const gain = mid(diff);
    out = {
      rules: { low: Math.min(...rules), mid: mid(rules), high: Math.max(...rules) },
      agent: { low: Math.min(...agent), mid: mid(agent), high: Math.max(...agent) },
      diff: { low: Math.min(...diff), mid: gain, high: Math.max(...diff) },
      relative: mid(rules) > 0 ? gain / mid(rules) : null,
      paybackMonths: gain > 0 ? (b.platformCost / gain) * 12 : null,
      roi: b.platformCost > 0 ? (gain - b.platformCost) / b.platformCost : null
    };
  }

  const summary = out
    ? [
        `# AI decisioning business case (simulated)`,
        ``,
        `Base: ${fmtNum(b.customers)} customers active in the last 12 months · AOV ${fmtMoney(p.aov, currency)} · gross margin ${fmtPct(p.grossMargin)} · ${p.ordersPerYear} orders/customer/year`,
        `Consent: ${CHANNEL_KEYS.map(c => `${CHANNELS[c].label} ${fmtPct(p.consent[c])}`).join(', ')}`,
        ``,
        `| | Low | Mid | High |`,
        `|---|---|---|---|`,
        `| Rule journey, incremental profit / yr | ${fmtMoney(out.rules.low, currency)} | ${fmtMoney(out.rules.mid, currency)} | ${fmtMoney(out.rules.high, currency)} |`,
        `| AI decisioning, incremental profit / yr | ${fmtMoney(out.agent.low, currency)} | ${fmtMoney(out.agent.mid, currency)} | ${fmtMoney(out.agent.high, currency)} |`,
        `| Uplift from decisioning / yr | ${fmtMoney(out.diff.low, currency)} | ${fmtMoney(out.diff.mid, currency)} | ${fmtMoney(out.diff.high, currency)} |`,
        ``,
        `Response assumption: ${RESPONSE.find(r => r.value === (p.upliftScale ?? 1))?.label ?? p.upliftScale}. Decisioning vs. rules: ${out.relative !== null ? fmtPct(out.relative) : 'n/a'}.`,
        ``,
        `Platform cost ${fmtMoney(b.platformCost, currency)}/yr. Payback: ${out.paybackMonths ? `${out.paybackMonths.toFixed(1)} months` : 'not reached'}.`,
        ``,
        `Method: CDPAgentX synthetic simulation, ${scenario.sim.days / 7}-week campaign, ${SEEDS.length} random seeds, annualised linearly. The range reflects simulation noise only, not model uncertainty. Validate with a holdout test before committing budget.`
      ].join('\n')
    : '';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Panel
      step="Module 5"
      title="Business case: put in your own numbers"
      intro={
        <p>
          Replace the illustrative defaults with your business's figures. The simulator rebuilds the customer base, runs your module 2
          journey and the module 4 agent across {SEEDS.length} random seeds on everyone active in the last 12 months, and scales the
          result to your base. You get a range to discuss, not a promise.
        </p>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Your business" className="space-y-4">
          <NumberField label="Customers active in the last 12 months" value={b.customers} step={1000} onChange={v => update('business.customers', v)} />
          <label className="block text-sm">
            Currency
            <select value={currency} onChange={e => update('business.currency', e.target.value)} className="mt-1 w-full rounded bg-slate-800 p-2">
              {CURRENCIES.map(c => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <NumberField label="Average order value" value={p.aov} onChange={v => update('profile.aov', v)} suffix={currency} />
          <NumberField label="Gross margin" value={Math.round(p.grossMargin * 100)} onChange={v => update('profile.grossMargin', v / 100)} suffix="%" />
          <NumberField label="Orders per customer per year" value={p.ordersPerYear} step={0.1} onChange={v => update('profile.ordersPerYear', v)} />
          <NumberField
            label="Annual cost of the decisioning tool"
            value={b.platformCost}
            step={5000}
            onChange={v => update('business.platformCost', v)}
            suffix={currency}
            hint="Licence plus implementation, spread per year."
          />
        </Card>
        <Card title="Consent / reachability" className="space-y-4">
          {CHANNEL_KEYS.map(c => (
            <NumberField
              key={c}
              label={CHANNELS[c].label}
              value={Math.round(p.consent[c] * 100)}
              onChange={v => update(`profile.consent.${c}`, v / 100)}
              suffix="%"
            />
          ))}
          <label className="block text-sm">
            Response assumption
            <select
              value={p.upliftScale ?? 1}
              onChange={e => update('profile.upliftScale', Number(e.target.value))}
              className="mt-1 w-full rounded bg-slate-800 p-2"
            >
              {RESPONSE.map(r => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-slate-500">How strongly messages move purchases. Nobody publishes this, so test all three.</span>
          </label>
          <NumberField
            label="Share who mainly buy on discount"
            value={Math.round(p.dealSeekerShare * 100)}
            onChange={v => update('profile.dealSeekerShare', v / 100)}
            suffix="%"
            hint="If you don't know, leave the default."
          />
        </Card>
        <div className="space-y-4">
          <RunButton status={sim.status} onClick={run}>
            Build business case
          </RunButton>
          {sim.error && <Callout kind="warn">{sim.error}</Callout>}
          {out && (
            <>
              <Stat
                label="Uplift from decisioning / year"
                value={fmtMoney(out.diff.mid, currency)}
                hint={`${out.relative !== null ? `${fmtPct(out.relative)} over the rule journey. ` : ''}Range ${fmtMoney(out.diff.low, currency)} to ${fmtMoney(out.diff.high, currency)} across seeds`}
                tone={out.diff.mid > 0 ? 'good' : 'bad'}
              />
              <Stat label="Rule journey / year" value={fmtMoney(out.rules.mid, currency)} hint="True incremental profit" />
              <Stat label="AI decisioning / year" value={fmtMoney(out.agent.mid, currency)} hint="True incremental profit" tone="accent" />
              <Stat
                label="Payback on tool cost"
                value={out.paybackMonths ? `${out.paybackMonths.toFixed(1)} months` : 'Not reached'}
                hint={out.roi !== null ? `First-year ROI ${fmtPct(out.roi)}` : undefined}
                tone={out.paybackMonths && out.paybackMonths <= 12 ? 'good' : 'warn'}
              />
              <div className="flex gap-2">
                <button onClick={copy} className="flex-1 rounded-lg border border-slate-700 px-3 py-2 text-sm hover:border-slate-500">
                  {copied ? 'Copied ✓' : 'Copy summary (Markdown)'}
                </button>
                <button onClick={() => window.print()} className="flex-1 rounded-lg border border-slate-700 px-3 py-2 text-sm hover:border-slate-500">
                  Print / PDF
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <Callout kind="warn" title="Read this before you put the number in a deck">
        <p>
          The range reflects simulation noise only. The bigger uncertainty is the response model itself: how persuadable your
          customers are, and how much they differ from each other. No public benchmark pins those down. Vendor-reported lifts from AI
          decisioning range from about +10% to +43% (see Method &amp; sources), and each vendor picks its own baseline.
        </p>
        <p>
          The comparison is only as fair as your baseline. Before you trust the uplift, make the module 2 journey as good as you
          would really run it: try no discount, suppress recent buyers, and choose sensible channels. A blanket discount journey
          makes any agent look brilliant.
        </p>
        <p>
          Use this to decide whether a pilot is worth running and how to size it. Then run the pilot with a holdout.
        </p>
      </Callout>
    </Panel>
  );
}
