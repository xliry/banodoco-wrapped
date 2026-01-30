
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { HeatmapData } from '../types';

interface HeatmapProps {
  activityData: HeatmapData[];
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const COLORS = [
  'bg-purple-950/20',
  'bg-purple-900/40',
  'bg-purple-800/50',
  'bg-purple-700/60',
  'bg-purple-600/70',
  'bg-purple-500/80',
  'bg-purple-400',
];

const Heatmap: React.FC<HeatmapProps> = ({ activityData }) => {
  const { min, max } = useMemo(() => {
    let min = Infinity, max = -Infinity;
    for (const row of activityData) {
      for (const val of row.data) {
        if (val < min) min = val;
        if (val > max) max = val;
      }
    }
    return { min, max };
  }, [activityData]);

  const getIntensityClass = (val: number) => {
    if (max === min) return COLORS[3];
    const ratio = (val - min) / (max - min);
    const index = Math.min(Math.floor(ratio * COLORS.length), COLORS.length - 1);
    return COLORS[index];
  };

  return (
    <section className="py-16 sm:py-32">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="mb-8 sm:mb-12"
      >
        <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 flex items-center gap-3">
          <span className="text-orange-500">🕐</span> When Does Banodoco Come Alive?
        </h2>
        <p className="text-gray-400 text-sm sm:text-base">Our peak hours across the globe.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-[#1a1a1a] p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/5 overflow-x-auto shadow-2xl">
        <div className="min-w-[480px] sm:min-w-[600px]">
          {/* Header */}
          <div className="grid grid-cols-[50px_1fr] sm:grid-cols-[80px_1fr] mb-3 sm:mb-4">
            <div />
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {DAYS.map(day => (
                <div key={day} className="text-center text-[9px] sm:text-xs font-bold text-gray-500 uppercase">{day}</div>
              ))}
            </div>
          </div>

          {/* Rows */}
          <div className="space-y-1 sm:space-y-2">
            {activityData.map((row, i) => (
              <div key={i} className="grid grid-cols-[50px_1fr] sm:grid-cols-[80px_1fr] items-center">
                <div className="text-right pr-3 sm:pr-6 text-[10px] sm:text-xs font-bold text-gray-500">{String(row.hour).padStart(2, '0')}:00</div>
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {row.data.map((val, j) => (
                    <motion.div
                      key={j}
                      whileHover={{ scale: 1.15, zIndex: 10 }}
                      className={`h-7 sm:h-10 rounded sm:rounded-lg ${getIntensityClass(val)} transition-colors cursor-default relative group`}
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-white text-[#0f0f0f] text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-20">
                        {val.toLocaleString()} msgs
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-2 mt-4 sm:mt-6">
            <span className="text-[9px] sm:text-[10px] text-gray-500">Less</span>
            {COLORS.map((c, i) => (
              <div key={i} className={`w-3 h-3 sm:w-4 sm:h-4 rounded ${c}`} />
            ))}
            <span className="text-[9px] sm:text-[10px] text-gray-500">More</span>
          </div>
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="text-center mt-8 sm:mt-12 text-sm sm:text-base text-gray-400 font-medium italic"
      >
        🌙 "Peak activity: <span className="text-purple-400 font-bold">3PM–6PM UTC</span> on weekdays"
      </motion.p>
    </section>
  );
};

export default Heatmap;
