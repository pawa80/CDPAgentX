import React from 'react';

const STYLES = {
  lesson: 'border-indigo-500/40 bg-indigo-500/10',
  warn: 'border-amber-500/40 bg-amber-500/10',
  info: 'border-slate-700 bg-slate-800/60'
};

export default function Callout({ title, children, kind = 'info' }) {
  return (
    <div className={`rounded-lg border p-4 text-sm leading-relaxed ${STYLES[kind]}`}>
      {title && <p className="mb-1 font-semibold text-slate-100">{title}</p>}
      <div className="space-y-2 text-slate-300">{children}</div>
    </div>
  );
}
