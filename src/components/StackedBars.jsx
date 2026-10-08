import React from 'react';

/** Horizontal 100%-stacked bars, one per row. rows: [{ label, parts: [{ key, value }] }] */
export default function StackedBars({ rows, colors, labels }) {
  const keys = Array.from(new Set(rows.flatMap(r => r.parts.map(p => p.key))));
  return (
    <div className="space-y-2">
      {rows.map(r => {
        const total = r.parts.reduce((s, p) => s + p.value, 0) || 1;
        return (
          <div key={r.label} className="flex items-center gap-3">
            <span className="w-16 shrink-0 text-xs text-slate-400">{r.label}</span>
            <div className="flex h-4 flex-1 overflow-hidden rounded bg-slate-800">
              {r.parts.map(p => (
                <div
                  key={p.key}
                  title={`${labels(p.key)}: ${((p.value / total) * 100).toFixed(1)}%`}
                  style={{ width: `${(p.value / total) * 100}%`, background: colors(p.key) }}
                />
              ))}
            </div>
          </div>
        );
      })}
      <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-slate-300">
        {keys.map(k => (
          <span key={k} className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ background: colors(k) }} />
            {labels(k)}
          </span>
        ))}
      </div>
    </div>
  );
}
