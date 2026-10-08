import React from 'react';
import Panel, { Card } from '../components/Panel';
import Callout from '../components/Callout';

const USES = [
  {
    title: 'Learn',
    body: 'Six short modules take a CRM marketer from RFM rules to a learning agent, with a question at the end of each.'
  },
  {
    title: 'Run a workshop',
    body: 'Every setting lives in the share link. Set up a scenario, send the link, and everyone starts from the same customer base and the same numbers.'
  },
  {
    title: 'Build the business case',
    body: 'Put in your own base size, order value, margin and consent rates to get a simulated range for rules vs. AI decisioning. Every assumption is shown.'
  }
];

export default function Intro({ go }) {
  return (
    <Panel
      step="Start here"
      title="A flight simulator for AI decisioning"
      intro={
        <>
          <p>
            Every CDP vendor now sells "agentic" marketing: Bloomreach Loomi, BrazeAI Decisioning Studio (formerly OfferFit),
            Hightouch AI Decisioning, Salesforce Agentforce. Underneath the label is a simple idea. A rule-based journey sends the
            same thing to everyone who matches a filter. A decisioning agent picks a channel, offer and timing <em>per customer</em>,
            then learns from what happens.
          </p>
          <p>
            CDPAgentX lets you see that difference on a simulated customer base, and measure it the way a real team would: against a
            holdout.
          </p>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        {USES.map(u => (
          <Card key={u.title} title={u.title}>
            <p className="text-sm text-slate-300">{u.body}</p>
          </Card>
        ))}
      </div>

      <Callout kind="lesson" title="How the simulator works">
        <p>
          It generates a synthetic customer base. Each customer has <strong>observable</strong> data a CDP would hold: recency,
          frequency, spend, consent and 12 months of click history. Each also has <strong>hidden</strong> traits: how persuadable
          they are, which channel they actually respond to, whether they only buy on discount, and how quickly they tire of
          messages.
        </p>
        <p>
          Rules and agents only ever see the observable data. Because the simulator knows the hidden truth, it can show you
          something no real team gets to see: the <em>true</em> incremental effect of a campaign, alongside the noisy holdout
          estimate you would actually report.
        </p>
      </Callout>

      <Callout kind="warn" title="What this is not">
        <p>
          It's not a forecast of your results. The channel numbers are anchored to published benchmarks (see{' '}
          <button className="underline" onClick={() => go('method')}>
            Method &amp; sources
          </button>
          ). The response model is a teaching model. Use it to build intuition and to frame a business case, then prove it with a
          real holdout test.
        </p>
      </Callout>

      <button onClick={() => go('audience')} className="rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold hover:bg-indigo-500">
        Start with module 1: Audience →
      </button>
    </Panel>
  );
}
