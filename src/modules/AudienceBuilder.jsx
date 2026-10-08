import React from 'react';
import Panel, { Card } from '../components/Panel';
import Slider from '../components/Slider';
import Stat from '../components/Stat';
import Callout from '../components/Callout';
import KnowledgeCheck from '../components/KnowledgeCheck';
import { useScenario } from '../state/ScenarioContext';
import { CHANNELS, CHANNEL_KEYS } from '../engine/channels';
import { fmtMoney, fmtNum, fmtPct } from '../components/format';

export default function AudienceBuilder() {
  const { scenario, update, segment, complete } = useScenario();
  const s = scenario.segment;
  const st = segment.stats;
  const currency = scenario.business.currency;

  return (
    <Panel
      step="Module 1"
      title="Audience: what rules can see"
      intro={
        <p>
          A rule-based audience is a filter on data the CDP already holds. <strong>Recency</strong> is days since the last order,{' '}
          <strong>frequency</strong> is orders in the past 12 months, and <strong>monetary</strong> is spend in that period. Tighten a
          rule and the audience shrinks. The catch is that none of these fields says who would actually respond to a message.
        </p>
      }
    >
      <div className="grid gap-6 lg:grid-cols-5">
        <Card title="Segment rules" className="space-y-5 lg:col-span-2">
          <Slider
            label="Ordered within the last"
            value={s.maxRecency}
            min={7}
            max={730}
            step={7}
            format={v => `${v} days`}
            onChange={v => update('segment.maxRecency', v)}
            hint="Lower = only recently active customers."
          />
          <Slider
            label="At least this many orders (12 months)"
            value={s.minFrequency}
            min={0}
            max={8}
            onChange={v => update('segment.minFrequency', v)}
            hint="Higher = loyal repeat buyers only."
          />
          <Slider
            label="Spent at least"
            value={s.minMonetary}
            min={0}
            max={1000}
            step={10}
            format={v => fmtMoney(v, currency)}
            onChange={v => update('segment.minMonetary', v)}
            hint="Higher = bigger spenders only."
          />
          <Slider
            label="Look-alike expansion"
            value={s.lookalike}
            min={0}
            max={2}
            step={0.1}
            format={v => (v ? `+${Math.round(v * 100)}% of seed` : 'off')}
            onChange={v => update('segment.lookalike', v)}
            hint="Adds the customers nearest to the segment's average RFM profile, like an 'audience size' slider in an ad platform."
          />
        </Card>

        <div className="space-y-4 lg:col-span-3">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <Stat label="Audience" value={fmtNum(st.count)} hint={`${fmtPct(st.share, 1)} of ${fmtNum(scenario.populationSize)} customers`} tone="accent" />
            <Stat label="From rules / look-alikes" value={`${fmtNum(segment.seedCount)} / ${fmtNum(segment.lookalikeCount)}`} />
            <Stat label="Reachable on any channel" value={fmtPct(st.count ? st.anyChannel / st.count : 0)} />
            <Stat label="Avg 12-month spend" value={fmtMoney(st.avgMonetary, currency)} />
            <Stat
              label="Will buy anyway (30 days)"
              value={fmtNum(st.expectedOrganicOrders30d)}
              hint="Predicted orders with no marketing at all"
              tone="warn"
            />
            <Stat label="Order value (profile)" value={fmtMoney(scenario.profile.aov, currency)} />
          </div>

          <Card title="Consent by channel">
            <div className="space-y-2">
              {CHANNEL_KEYS.map(ch => {
                const share = st.count ? st.reachable[ch] / st.count : 0;
                return (
                  <div key={ch} className="flex items-center gap-3 text-sm">
                    <span className="w-32 shrink-0 text-slate-300">{CHANNELS[ch].label}</span>
                    <div className="h-2.5 flex-1 rounded-full bg-slate-800">
                      <div className="h-full rounded-full bg-indigo-500" style={{ width: `${share * 100}%` }} />
                    </div>
                    <span className="w-24 text-right tabular-nums text-slate-400">
                      {fmtNum(st.reachable[ch])} · {fmtPct(share)}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-slate-500">Retargeting reach is the share that can be matched to an ad audience.</p>
          </Card>
        </div>
      </div>

      <Callout kind="lesson" title="Watch the 'will buy anyway' number">
        <p>
          The tighter and more loyal the segment, the more of its purchases would have happened anyway. A campaign sent to your
          best customers will look brilliant in last-click reporting even when it changes nothing. Module 2 puts a number on that.
        </p>
      </Callout>

      <KnowledgeCheck
        question="You tighten the segment to customers with 4+ orders in the last 30 days. Attributed revenue per message goes up. What is the most likely explanation?"
        options={[
          'The messages persuade loyal customers more effectively',
          'More of those customers would have bought anyway, so more organic purchases land inside the attribution window',
          'Smaller audiences always have higher incrementality'
        ]}
        answer={1}
        explanation="Recent, frequent buyers have a high organic purchase rate. Attribution counts those purchases if a message came first, whether or not it caused them."
        onPass={() => complete('audience')}
      />
    </Panel>
  );
}
