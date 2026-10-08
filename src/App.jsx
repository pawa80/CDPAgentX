import React, { useEffect, useState } from 'react';
import { ScenarioProvider, useScenario } from './state/ScenarioContext';
import { PROFILES } from './engine/profiles';
import Intro from './modules/Intro';
import AudienceBuilder from './modules/AudienceBuilder';
import JourneyBuilder from './modules/JourneyBuilder';
import Guardrails from './modules/Guardrails';
import RulesVsAgent from './modules/RulesVsAgent';
import BusinessCase from './modules/BusinessCase';
import Method from './modules/Method';

const PAGES = [
  { key: 'intro', label: 'Start', Component: Intro },
  { key: 'audience', label: '1 · Audience', Component: AudienceBuilder, done: ['audience'] },
  { key: 'journey', label: '2 · Journey', Component: JourneyBuilder, done: ['journey', 'journeyRun'] },
  { key: 'guardrails', label: '3 · Guardrails', Component: Guardrails, done: ['guardrails'] },
  { key: 'agent', label: '4 · Rules vs. agent', Component: RulesVsAgent, done: ['agent', 'agentRun'] },
  { key: 'business', label: '5 · Business case', Component: BusinessCase, done: ['business'] },
  { key: 'method', label: 'Method & sources', Component: Method }
];

function pageFromHash() {
  const m = window.location.hash.match(/p=([a-z]+)/);
  return PAGES.some(p => p.key === m?.[1]) ? m[1] : 'intro';
}

function Shell() {
  const { scenario, setScenario, reset, progress, shareUrl } = useScenario();
  const [page, setPage] = useState(pageFromHash);
  const [shared, setShared] = useState(false);

  // The scenario is read from a shared link once at load; after that the hash only tracks the page.
  useEffect(() => {
    window.history.replaceState(null, '', `#p=${page}`);
    window.scrollTo(0, 0);
  }, [page]);

  const go = key => setPage(key);
  const { Component } = PAGES.find(p => p.key === page);
  const tracked = PAGES.filter(p => p.done);
  const doneCount = tracked.filter(p => p.done.every(k => progress[k])).length;

  const share = async () => {
    const url = shareUrl(page);
    try {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      window.prompt('Copy this link', url);
    }
  };

  const switchProfile = key =>
    setScenario(s => ({ ...s, profileKey: key, profile: { ...PROFILES[key] } }));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/90 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <button onClick={() => go('intro')} className="text-lg font-bold text-indigo-300">
            CDPAgentX
          </button>
          <span className="hidden text-xs text-slate-500 md:inline">Rules vs. AI decisioning simulator</span>
          <div className="ml-auto flex flex-wrap items-center gap-2 text-sm">
            <label className="flex items-center gap-2">
              <span className="text-slate-400">Business</span>
              <select value={scenario.profileKey} onChange={e => switchProfile(e.target.value)} className="rounded bg-slate-800 p-1.5">
                {Object.entries(PROFILES).map(([k, p]) => (
                  <option key={k} value={k}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <button onClick={share} className="rounded border border-slate-700 px-3 py-1.5 hover:border-slate-500" title="Copy a link that reproduces every setting">
              {shared ? 'Link copied ✓' : 'Share scenario'}
            </button>
            <button onClick={reset} className="rounded border border-slate-700 px-3 py-1.5 text-slate-400 hover:border-slate-500">
              Reset
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2" aria-label="Modules">
          {PAGES.map(p => {
            const done = p.done && p.done.every(k => progress[k]);
            return (
              <button
                key={p.key}
                onClick={() => go(p.key)}
                aria-current={page === p.key ? 'page' : undefined}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm ${
                  page === p.key ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {p.label}
                {done && <span className="ml-1 text-emerald-400">✓</span>}
              </button>
            );
          })}
          <span className="ml-auto self-center whitespace-nowrap pl-3 text-xs text-slate-500">
            {doneCount}/{tracked.length} complete
          </span>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Component go={go} />
      </main>
      <footer className="mx-auto max-w-6xl px-4 pb-10 text-xs text-slate-500 print:hidden">
        Synthetic data only. No customer data leaves your browser. Open source under the MIT licence.
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ScenarioProvider>
      <Shell />
    </ScenarioProvider>
  );
}
