
import React from 'react';
import { motion } from 'framer-motion';
import { HeatmapData } from '../types';

interface HeatmapProps {
  activityData: HeatmapData[];
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const Heatmap: React.FC<HeatmapProps> = ({ activityData }) => {
  const getIntensity = (val: number) => {
    if (val > 350) return 'bg-purple-500';
    if (val > 250) return 'bg-purple-600/70';
    if (val > 150) return 'bg-purple-700/50';
    if (val > 50) return 'bg-purple-900/30';
    return 'bg-white/5';
  };

  return (
    <section className="py-32">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="mb-12"
      >
        <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
          <span className="text-orange-500">🕐</span> When Does Banodoco Come Alive?
        </h2>
        <p className="text-gray-400">Our peak hours across the globe.</p>
      </motion.div>

      <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-white/5 overflow-x-auto shadow-2xl">
        <div className="min-w-[600px]">
          {/* Header */}
          <div className="grid grid-cols-[80px_1fr] mb-4">
            <div />
            <div className="grid grid-cols-7 gap-2">
              {DAYS.map(day => (
                <div key={day} className="text-center text-xs font-bold text-gray-500 uppercase">{day}</div>
              ))}
            </div>
          </div>

          {/* Rows */}
          <div className="space-y-2">
            {activityData.map((row, i) => (
              <div key={i} className="grid grid-cols-[80px_1fr] items-center">
                <div className="text-right pr-6 text-xs font-bold text-gray-500">{row.hour}:00</div>
                <div className="grid grid-cols-7 gap-2">
                  {row.data.map((val, j) => (
                    <motion.div
                      key={j}
                      whileHover={{ scale: 1.2, zIndex: 10 }}
                      className={`h-10 rounded-lg ${getIntensity(val)} transition-colors cursor-default relative group`}
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-white text-[#0f0f0f] text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                        {val} msgs
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <motion.p 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="text-center mt-12 text-gray-400 font-medium italic"
      >
        🌙 "Peak activity: <span className="text-purple-400 font-bold">10PM UTC</span> on weekdays - true night owls!"
      </motion.p>
    </section>
  );
};

export default Heatmap;
