import React from 'react';
import Stat from './Stat';
import { fmtMoney, fmtNum } from './format';

export const totalSends = r => Object.values(r.treated.sends).reduce((a, b) => a + b, 0);
export const totalUnsubs = r => Object.values(r.treated.unsubs).reduce((a, b) => a + b, 0);

/** The three ways to read one campaign: attributed, holdout-measured, and ground truth. */
export default function Results({ r, currency }) {
  const m = r.measured;
  const tone = v => (v > 0 ? 'good' : v < 0 ? 'bad' : 'neutral');
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Messages sent" value={fmtNum(totalSends(r))} hint={`${fmtNum(r.treated.n)} customers treated`} />
        <Stat label="Unsubscribes" value={fmtNum(totalUnsubs(r))} tone={totalUnsubs(r) > 0 ? 'warn' : 'neutral'} />
        <Stat label="Discounts given away" value={fmtMoney(r.treated.discountCost, currency)} />
        <Stat label="Channel cost" value={fmtMoney(r.treated.channelCost, currency)} />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Stat
          label="1 · Attributed conversions"
          value={fmtNum(r.treated.attributed)}
          hint="Purchases within 3 days of a message. This is what a last-touch report shows."
          tone="warn"
        />
        <Stat
          label="2 · Holdout-measured profit"
          value={fmtMoney(m.profit, currency)}
          hint={`95% interval ${fmtMoney(m.profitLow, currency)} to ${fmtMoney(m.profitHigh, currency)}. What a well-run test reports, ${fmtNum(r.control.n)} held out.`}
          tone={tone(m.profit)}
        />
        <Stat
          label="3 · True incremental profit"
          value={fmtMoney(r.truth.profit, currency)}
          hint={`${fmtNum(r.truth.conversions)} purchases that would not have happened otherwise. Only a simulator can show you this.`}
          tone={tone(r.truth.profit)}
        />
      </div>
      {r.warnings?.map(w => (
        <p key={w} className="rounded border border-amber-500/40 bg-amber-500/10 p-2 text-sm text-amber-200">
          {w}
        </p>
      ))}
    </div>
  );
}
