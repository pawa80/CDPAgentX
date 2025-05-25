import React from 'react';

/** Toggle switch used across modules */
export default function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center space-x-2 cursor-pointer">
      <span className="text-sm">{label}</span>
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
      />
      <span className="relative inline-block w-10 h-6 bg-slate-600 rounded-full peer-checked:bg-indigo-600">
        <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
      </span>
    </label>
  );
}
