
import React from 'react';
import { motion } from 'framer-motion';
import { ChannelStat } from '../types';

interface ChannelBreakdownProps {
  stats: ChannelStat[];
}

const ChannelBreakdown: React.FC<ChannelBreakdownProps> = ({ stats }) => {
  return (
    <section className="py-32">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="mb-12"
      >
        <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
          <span className="text-green-500">📊</span> Where the Conversations Happen
        </h2>
        <p className="text-gray-400">Our digital real estate broken down by volume.</p>
      </motion.div>

      <div className="space-y-6">
        {stats.map((channel, i) => (
          <div key={channel.name} className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-white font-bold font-mono">{channel.name}</span>
              <span className="text-gray-500 text-sm font-medium">
                {channel.messages.toLocaleString()} msgs • <span className="text-white">{channel.percentage}%</span>
              </span>
            </div>
            <div className="h-4 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${channel.percentage}%` }}
                transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
                className={`h-full rounded-full bg-gradient-to-r ${
                  i === 0 ? 'from-purple-500 to-pink-500' : 
                  i === 1 ? 'from-blue-500 to-purple-500' :
                  i === 2 ? 'from-green-500 to-blue-500' :
                  'from-gray-600 to-gray-500'
                }`}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ChannelBreakdown;
