import React, { useState } from 'react';

/**
 * Minimal multi-series line chart (SVG, no dependencies).
 * series: [{ name, color, values: number[], dashed? }]
 */
export default function LineChart({ series, height = 220, xLabel = 'Day', format = v => Math.round(v), ariaLabel }) {
  const [hover, setHover] = useState(null);
  const width = 640;
  const pad = { l: 64, r: 12, t: 12, b: 28 };
  const n = Math.max(...series.map(s => s.values.length));
  const all = series.flatMap(s => s.values);
  const min = Math.min(0, ...all);
  const max = Math.max(1, ...all);
  const x = i => pad.l + (i / Math.max(1, n - 1)) * (width - pad.l - pad.r);
  const y = v => pad.t + (1 - (v - min) / (max - min || 1)) * (height - pad.t - pad.b);
  const ticks = [min, min + (max - min) / 2, max];

  const onMove = e => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * width;
    const i = Math.round(((px - pad.l) / (width - pad.l - pad.r)) * (n - 1));
    setHover(i >= 0 && i < n ? i : null);
  };

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={ariaLabel}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        {ticks.map(t => (
          <g key={t}>
            <line x1={pad.l} x2={width - pad.r} y1={y(t)} y2={y(t)} stroke="#334155" strokeWidth="1" />
            <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#94a3b8">
              {format(t)}
            </text>
          </g>
        ))}
        {min < 0 && <line x1={pad.l} x2={width - pad.r} y1={y(0)} y2={y(0)} stroke="#64748b" strokeWidth="1" />}
        <text x={(width + pad.l) / 2} y={height - 6} textAnchor="middle" fontSize="11" fill="#94a3b8">
          {xLabel}
        </text>
        {series.map(s => (
          <polyline
            key={s.name}
            fill="none"
            stroke={s.color}
            strokeWidth="2.5"
            strokeDasharray={s.dashed ? '5 4' : undefined}
            points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
          />
        ))}
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={height - pad.b} stroke="#94a3b8" strokeDasharray="2 3" />
            {series.map(s => s.values[hover] !== undefined && <circle key={s.name} cx={x(hover)} cy={y(s.values[hover])} r="4" fill={s.color} />)}
          </g>
        )}
      </svg>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-300">
        {series.map(s => (
          <span key={s.name} className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4" style={{ background: s.color }} />
            {s.name}
            {hover !== null && s.values[hover] !== undefined && (
              <span className="tabular-nums text-slate-400">· {format(s.values[hover])}</span>
            )}
          </span>
        ))}
        {hover !== null && <span className="text-slate-500">{xLabel} {hover + 1}</span>}
      </div>
    </div>
  );
}
