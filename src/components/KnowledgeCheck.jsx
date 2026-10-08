import React, { useState } from 'react';

/** One multiple-choice question with explanation; calls onPass when answered correctly. */
export default function KnowledgeCheck({ question, options, answer, explanation, onPass }) {
  const [picked, setPicked] = useState(null);
  const correct = picked === answer;
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-400">Check your understanding</p>
      <p className="mt-1 font-medium text-slate-100">{question}</p>
      <div className="mt-3 grid gap-2">
        {options.map((o, i) => (
          <button
            key={o}
            onClick={() => {
              setPicked(i);
              if (i === answer && onPass) onPass();
            }}
            className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
              picked === i
                ? i === answer
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-rose-500 bg-rose-500/10'
                : 'border-slate-700 hover:border-slate-500'
            }`}
          >
            {o}
          </button>
        ))}
      </div>
      {picked !== null && (
        <p className={`mt-3 text-sm ${correct ? 'text-emerald-300' : 'text-rose-300'}`}>
          {correct ? 'Correct. ' : 'Not quite. '}
          <span className="text-slate-300">{explanation}</span>
        </p>
      )}
    </div>
  );
}
