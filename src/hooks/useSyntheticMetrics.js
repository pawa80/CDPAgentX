// 🛠 useSyntheticMetrics.js – smoother optimiser logic
import { useEffect, useRef, useState } from 'react';

// helper
const rand = (min, max) => Math.random() * (max - min) + min;

// hook returns the smoothed delta plus a tiny spark of noise so it feels alive
export default function useSyntheticDelta({ explore }) {
  const [delta, setDelta] = useState(-25);          // start below target
  const history = useRef([]);

  useEffect(() => {
    const id = setInterval(() => {
      // 1 ─ jitter magnitude is tiny
      const baseJitter = 0.5;
      let next = delta + rand(-baseJitter, baseJitter);

      // 2 ─ explore slider widens the jitter window gently
      const exploreJitter = (explore / 100) * 0.5;  // max ±0.5 when explore = 100
      next += rand(-exploreJitter, exploreJitter);

      // 3 ─ slow pull toward zero (faster if explore is low)
      const damping = explore < 30 ? 0.97 : explore > 70 ? 0.90 : 0.94;
      next *= damping;

      // 4 ─ keep a rolling window of the last 10 values, use their mean
      history.current.push(next);
      if (history.current.length > 10) history.current.shift();
      const avg =
        history.current.reduce((s, v) => s + v, 0) / history.current.length;

      setDelta(parseFloat(avg.toFixed(1)));          // one-decimal precision
    }, 1000); // run every second

    return () => clearInterval(id);
  }, [delta, explore]);

  return delta;
}
