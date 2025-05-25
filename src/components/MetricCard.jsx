import React from 'react';
import { motion } from 'framer-motion';

/**
 * Reusable card showing metric values.
 * Colour shifts to emerald when value meets threshold.
 */
export default function MetricCard({ label, value, threshold = 0.7, suffix = '%' }) {
  const colour = value >= threshold ? 'text-emerald-500' : 'text-amber-400';
  return (
    <motion.div
      className="p-4 bg-slate-900 rounded-lg border border-slate-800"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <p className="text-sm" aria-label={label}>{label}</p>
      <p className={`text-2xl font-bold ${colour}`}>{(value * 100).toFixed(0)}{suffix}</p>
    </motion.div>
  );
}
