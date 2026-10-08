import React from 'react';

/** Page section with heading, intro and body. */
export default function Panel({ step, title, intro, children }) {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        {step && <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">{step}</p>}
        <h2 className="text-2xl font-bold text-slate-50">{title}</h2>
        {intro && <div className="max-w-3xl space-y-2 text-slate-300">{intro}</div>}
      </header>
      {children}
    </section>
  );
}

export function Card({ title, children, className = '' }) {
  return (
    <div className={`rounded-xl border border-slate-800 bg-slate-900/50 p-4 ${className}`}>
      {title && <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">{title}</h3>}
      {children}
    </div>
  );
}

export function RunButton({ onClick, status, children = 'Run simulation' }) {
  const running = status === 'running';
  return (
    <button
      onClick={onClick}
      disabled={running}
      className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500 disabled:cursor-wait disabled:opacity-60"
    >
      {running ? 'Simulating…' : children}
    </button>
  );
}
