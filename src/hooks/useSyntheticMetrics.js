import { useEffect, useState } from 'react';

/**
 * Hook that generates synthetic metrics based on input parameters
 * Returns a value between 0 and 1 that responds to parameter changes
 */
export default function useSyntheticMetrics(baseValue = 0.5, params = {}) {
  const [value, setValue] = useState(baseValue);

  useEffect(() => {
    // Calculate synthetic value based on parameters
    let newValue = baseValue;
    
    // Apply parameter influences
    Object.entries(params).forEach(([key, paramValue]) => {
      switch (key) {
        case 'recency':
          // Lower recency (more recent) = higher reach
          newValue += (60 - paramValue) / 600;
          break;
        case 'frequency':
          // Higher frequency requirements = lower reach
          newValue -= (paramValue - 1) / 20;
          break;
        case 'monetary':
          // Higher monetary requirements = lower reach
          newValue -= paramValue / 1000;
          break;
        case 'similarity':
          // Similarity search increases reach
          newValue += paramValue ? 0.2 : 0;
          break;
        case 'steps':
          // More orchestration steps = higher lift
          newValue += (paramValue.length - 1) * 0.02;
          break;
        case 'cap':
          // Higher caps = better compliance
          newValue += Math.min(paramValue / 10, 0.3);
          break;
        case 'banned':
          // More banned words = lower compliance initially, then higher
          const wordCount = paramValue.split(',').filter(w => w.trim()).length;
          newValue += wordCount > 0 ? Math.min(wordCount * 0.1, 0.4) : 0;
          break;
      }
    });

    // Keep value between 0 and 1
    newValue = Math.max(0, Math.min(1, newValue));
    setValue(newValue);
  }, [baseValue, params]);

  return value;
}