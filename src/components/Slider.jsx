import React from 'react';

/** Range slider with a visible value and optional helper text. */
export default function Slider({ value, onChange, min = 0, max = 100, step = 1, label, hint, format = v => v }) {
  return (
    <label className="flex w-full flex-col gap-1">
      <span className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="tabular-nums text-indigo-300">{format(value)}</span>
      </span>
      <input
        type="range"
        className="w-full accent-indigo-500"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
      />
      {hint && <span className="text-xs text-slate-500">{hint}</span>}
    </label>
  );
}
