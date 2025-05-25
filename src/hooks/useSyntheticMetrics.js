import { useState, useEffect } from 'react';

/**
 * Provides a synthetic metric that updates every 750ms.
 * The simple math keeps values within 0 - 1 so UI can
 * colour-shift based on thresholds.
 */
export default function useSyntheticMetrics(initial = 0.5) {
  const [value, setValue] = useState(initial);

  useEffect(() => {
    // update metric with slight random walk
    const id = setInterval(() => {
      setValue(v => {
        let next = v + (Math.random() - 0.5) * 0.1;
        if (next > 1) next = 1;
        if (next < 0) next = 0;
        return Number(next.toFixed(2));
      });
    }, 750);
    return () => clearInterval(id);
  }, []);

  return value;
}
