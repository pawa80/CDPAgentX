# CDPAgentX: product strategy

*Research compiled October 2026. Numbers are linked to their source. Price points marked **estimate** are not market-validated.*

## 1. The opportunity in one paragraph

Every CDP vendor now sells "agentic" marketing, but the label covers two different things. One is **generative assistants** that build campaigns from a prompt: Bloomreach Loomi (GA June 2026), Klaviyo Marketing Agent (Sept 2025), Salesforce Agentforce Campaign Optimizer, Adobe Journey Agent. The other is **decisioning agents**: reinforcement learning or contextual bandits that choose channel, offer and timing per customer and learn from outcomes. Braze bought OfferFit for $325M (closed June 2025, now BrazeAI Decisioning Studio). Hightouch AI Decisioning and Aampe are in the same space. The second kind is where the money and the confusion are. In our searching we found no **vendor-neutral, hands-on sandbox** where a marketer configures levers, rewards and guardrails, watches an agent learn against a rules baseline, and measures it properly with a holdout. Vendor training is product-specific and mostly free, because it serves enablement. Markstrat and Stukent teach brand strategy and ads, not lifecycle decisioning. That gap is CDPAgentX's position. (The search was limited, so treat "no competitor" as indicative, not proven.)

**Positioning:** *The vendor-neutral flight simulator for AI decisioning: see why agents beat rules, when they don't, and how to prove it.*

## 2. Who uses it and for what

| Buyer | Job to be done | What in CDPAgentX serves it |
|---|---|---|
| CDP / martech consultancy (incl. Bloomreach partners) | Explain "why decisioning" in pre-sales without a live tenant; run client workshops; upskill junior consultants | Modules 1–4, shareable scenario links, the business case |
| In-house CRM / lifecycle team | Build the internal case for buying BrazeAI, Hightouch, Loomi etc.; get finance and legal comfortable with holdouts and guardrails | Module 5 business case, Method & sources page, guardrails module |
| Vendor partner-enablement teams | Teach partners decisioning concepts before product training | The full course; certification later |

## 3. What changed in this version (in-house tool baseline)

The original app showed hard-coded numbers. Several were nonsensical: adding banned words *raised* compliance, and the optimiser always reported −20%. Version 2 replaces all of that with a real simulation:

- **A synthetic customer base** (10k customers). Observable CDP fields: RFM, consent and 12 months of click history. Hidden traits: persuadability, channel affinity, deal-seeking and fatigue.
- **Three ways to read every campaign:** last-touch attributed, holdout-measured (with a 95% interval), and *true* incremental. The last is possible because outcomes use common random numbers against a do-nothing counterfactual.
- **A real learning agent** (contextual Thompson-sampling bandit) and an oracle ceiling. In the default retail scenario the agent beats a blanket-discount journey by roughly 25–50% in true incremental profit and captures about 55–60% of the oracle. That is in the same ballpark as vendor-reported lifts of +10% to +43%.
- **Guardrails that bind both rules and agent:** frequency cap, minimum gap, discount ceiling, banned-word copy check, holdout size, and unsubscribes priced as a cost.
- **A business case** that takes your base size, AOV, margin, consent rates and tool cost. It reports a range across seeds and response assumptions, plus payback, and exports to Markdown or print.
- **Method & sources page:** every channel parameter is set next to a published benchmark. Poorly sourced figures (the "98% SMS open rate") are called out and not used.
- Shareable scenario links (the whole configuration lives in the URL), progress tracking, a knowledge check per module, and engine unit tests in CI.

## 4. Roadmap (prioritised)

1. **Facilitator / workshop mode.** Presenter view, team-vs-team rounds (Markstrat-style: each team configures a journey, then they compare), and a debrief export. *This is what makes it billable through consulting.*
2. **Scenario library.** Retail win-back, restaurant lapsed-guest, subscription churn save, Black Friday fatigue, fintech deadline. Each one is a share link plus a facilitator script.
3. **Bloomreach mode.** Map the levers to Bloomreach Engagement concepts: contextual personalisation, optimal send time, scenarios, Loomi. Include the documented caveat: Bloomreach advises against combining contextual personalisation with optimal send time or dynamic waits, because it breaks the attribution window the model learns from. That is a sharp, credible teaching point.
4. **Business case → branded PDF / slide.** Consultancy logo, client name, assumptions appendix.
5. **Decisioning-readiness assessment.** A 15-question maturity check on data, levers, measurement and governance, with a scored report. Works as a lead magnet.
6. **Model depth.** Delayed rewards and longer conversion windows, send-time optimisation, creative variants, and seasonality.
7. **"Foundations" badge.** Module quizzes leading to a vendor-neutral certificate.

## 5. Monetisation options

| Option | How it earns | Comparable | Notes |
|---|---|---|---|
| **Paid facilitated workshops** (fastest) | Half-day "Rules vs. Agents" / "Decisioning readiness" sessions, with the tool as the centrepiece | Consulting day rates | Works now; needs scenario library + facilitator script |
| **Open core + Pro/Workshop edition** | Free public course as lead gen; paid facilitator mode, saved scenarios, branding | n/a | Keep the simulator open for credibility |
| **White-label licence for consultancies** | Logo, colours, client-shaped scenarios, results export | Reforge Teams: from $9,995/yr for up to 10 seats ([source](https://reforge.helpscoutdocs.com/article/213-changes-to-the-reforge-membership-december-2024)) | ~$5–10k/yr per small consultancy is plausible (**estimate**) |
| **Certification** | Per-learner fee for a foundations badge | Bloomreach Academy certs ~$1,100–1,300 each (secondary extract, verify); Markstrat ~€70/student licence ([ULiège](https://www.programmes.uliege.be/cocoon/20252026/en/cours/GEST7051-1.html)) | $50–300 per learner without brand recognition (**estimate**) |
| **Partner-enablement licence to vendors / SIs** | Annual licence for a partner academy | n/a | Highest value, longest sales cycle; neutrality is the asset |

**Validate before building paywalls:** 5–10 interviews with consultancy leads and CRM managers. Ask what they would use it for in their next client conversation, and what they pay today for workshops and enablement.

## 6. Credibility rules (the moat)

- Never present a simulated number as a forecast. Always show the range, the assumptions, and "prove it with a holdout".
- Anchor channel parameters to cited benchmarks. Mark secondary or vendor figures as such.
- Show where agents *don't* win: greedy lock-in, reward hacking, underpowered pilots, short tests.
- Stay vendor-neutral in the core. Vendor-specific "modes" are add-ons.

## 7. Key sources

- Braze–OfferFit: https://www.braze.com/press-releases/braze-announces-agreement-to-acquire-offerfit
- Bloomreach Loomi agent GA: https://www.businesswire.com/news/home/20260602398920/en/
- Bloomreach contextual personalisation docs: https://documentation.bloomreach.com/engagement/docs/configure-contextual-personalization
- Hightouch on contextual bandits: https://hightouch.com/blog/contextual-bandits-for-marketers
- Aampe RCT preprint (agentic vs. rule-based messaging): https://arxiv.org/abs/2512.17462
- Klaviyo global holdout groups: https://www.klaviyo.com/blog/global-holdout-groups
- Channel benchmarks: see `src/engine/channels.js` (`BENCHMARKS`) and the in-app Method & sources page.

Caveat on the research: several vendor pages could not be opened directly from the research environment. Figures marked "verify" come from search-engine extracts of the named page and should be checked before they appear in client material.
