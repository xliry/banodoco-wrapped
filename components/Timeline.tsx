
import React from 'react';
import { motion } from 'framer-motion';
import { Milestone } from '../types';

interface TimelineProps {
  milestones: Milestone[];
}

const Timeline: React.FC<TimelineProps> = ({ milestones }) => {
  return (
    <section className="py-32">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="mb-16"
      >
        <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
          <span className="text-purple-500">📈</span> Our Journey
        </h2>
        <p className="text-gray-400 max-w-xl">
          It took months to reach our first 100K, then the momentum became unstoppable.
        </p>
      </motion.div>

      <div className="relative pt-20 pb-12">
        {/* The Line */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/10 -translate-y-1/2 rounded-full overflow-hidden">
          <motion.div 
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 origin-left"
          />
        </div>

        <div className="relative flex justify-between">
          {milestones.map((m, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.2 }}
              className="flex flex-col items-center group relative cursor-default"
            >
              {/* Dot */}
              <div className="w-5 h-5 bg-white rounded-full border-4 border-[#0f0f0f] relative z-10 group-hover:scale-125 group-hover:bg-purple-500 transition-all duration-300" />
              
              {/* Info Box Top */}
              <div className="absolute bottom-10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="bg-[#1a1a1a] border border-white/10 p-3 rounded-xl shadow-2xl">
                  <p className="text-xs font-bold text-purple-400 mb-1">{m.label}</p>
                  <p className="text-sm text-gray-300">Day {m.daysFromStart} of Banodoco</p>
                </div>
                <div className="w-2 h-2 bg-[#1a1a1a] rotate-45 mx-auto -mt-1 border-r border-b border-white/10" />
              </div>

              {/* Static Label Bottom */}
              <div className="mt-8 text-center">
                <p className="text-xl font-black text-white">{(m.count / 1000).toFixed(0)}K</p>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-tighter">
                  {new Date(m.date).toLocaleDateString('en-US', { month: 'short', year: '2022' ? 'numeric' : '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        className="mt-20 p-8 rounded-3xl bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-white/5 text-center"
      >
        <p className="text-xl italic text-gray-300 max-w-2xl mx-auto">
          "It took us 370 days to reach 100K, but just <span className="text-purple-400 font-bold">177 days</span> to reach our last 250K. That's a 2x acceleration!"
        </p>
      </motion.div>
    </section>
  );
};

export default Timeline;
