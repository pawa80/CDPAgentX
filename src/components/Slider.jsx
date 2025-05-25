import React from 'react';

/** Basic range slider */
export default function Slider({ value, onChange, min = 0, max = 100, step = 1, label }) {
  return (
    <label className="flex flex-col space-y-1 w-full">
      <span className="text-sm">{label}: {value}</span>
      <input
        type="range"
        className="w-full"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
      />
    </label>
  );
}
