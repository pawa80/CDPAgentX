import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_SCENARIO, decodeScenario, encodeScenario, setPath } from './scenario';
import { generatePopulation } from '../engine/population';
import { buildSegment } from '../engine/segment';

const ScenarioCtx = createContext(null);
const PROGRESS_KEY = 'cdpAgentX_progress_v2';

function readStorage(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

function initialScenario() {
  const match = window.location.hash.match(/s=([^&]+)/);
  return (match && decodeScenario(match[1])) || DEFAULT_SCENARIO;
}

export function ScenarioProvider({ children }) {
  const [scenario, setScenario] = useState(initialScenario);
  const [progress, setProgress] = useState(() => readStorage(PROGRESS_KEY, {}));

  useEffect(() => {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch {
      /* storage unavailable: progress just won't persist */
    }
  }, [progress]);

  const update = useCallback((path, value) => setScenario(s => setPath(s, path, value)), []);
  const complete = useCallback(key => setProgress(p => (p[key] ? p : { ...p, [key]: true })), []);
  const reset = useCallback(() => setScenario(DEFAULT_SCENARIO), []);

  const population = useMemo(
    () => generatePopulation(scenario.profile, scenario.populationSize, 42),
    [scenario.profile, scenario.populationSize]
  );
  const segment = useMemo(() => buildSegment(population, scenario.segment), [population, scenario.segment]);

  const shareUrl = useCallback(
    page => `${window.location.origin}${window.location.pathname}#p=${page}&s=${encodeScenario(scenario)}`,
    [scenario]
  );

  const value = { scenario, update, setScenario, reset, population, segment, progress, complete, shareUrl };
  return <ScenarioCtx.Provider value={value}>{children}</ScenarioCtx.Provider>;
}

export function useScenario() {
  return useContext(ScenarioCtx);
}

let worker = null;
let nextId = 0;
const pending = new Map();

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL('../engine/worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = e => {
      const { id, results, error } = e.data;
      const p = pending.get(id);
      pending.delete(id);
      if (!p) return;
      if (error) p.reject(new Error(error));
      else p.resolve(results);
    };
  }
  return worker;
}

/** Run simulation jobs in a Web Worker; keeps the last result per hook instance. */
export function useSimulation() {
  const { scenario } = useScenario();
  const [state, setState] = useState({ status: 'idle', results: null, error: null });
  const latest = useRef(0);

  const run = useCallback(
    jobs => {
      const id = (nextId += 1);
      latest.current = id;
      setState(s => ({ ...s, status: 'running', error: null }));
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        getWorker().postMessage({ id, scenario, jobs });
      })
        .then(results => {
          if (latest.current === id) setState({ status: 'done', results, error: null });
          return results;
        })
        .catch(err => {
          if (latest.current === id) setState({ status: 'error', results: null, error: err.message });
        });
    },
    [scenario]
  );

  return { ...state, run };
}
