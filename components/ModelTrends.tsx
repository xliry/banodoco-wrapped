
import React from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ModelTrend } from '../types';

interface ModelTrendsProps {
  data: ModelTrend[];
}

const ModelTrends: React.FC<ModelTrendsProps> = ({ data }) => {
  return (
    <section className="py-32">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="mb-12"
      >
        <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
          <span className="text-blue-500">🤖</span> The Rise & Fall of Models
        </h2>
        <p className="text-gray-400">Watching the community switch tools as technology evolved.</p>
      </motion.div>

      <div className="h-[400px] w-full bg-[#1a1a1a]/50 p-6 rounded-3xl border border-white/5 backdrop-blur-sm shadow-2xl overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorSd" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorFlux" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorWan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
            <XAxis 
              dataKey="month" 
              stroke="#666" 
              tick={{ fontSize: 12 }} 
              axisLine={false} 
              tickLine={false} 
              dy={10}
            />
            <YAxis 
              stroke="#666" 
              tick={{ fontSize: 12 }} 
              axisLine={false} 
              tickLine={false}
              tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}K` : v}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '12px' }}
              itemStyle={{ color: '#fff' }}
            />
            <Legend verticalAlign="top" height={36} />
            <Area 
              type="monotone" 
              dataKey="sd" 
              stroke="#3B82F6" 
              fillOpacity={1} 
              fill="url(#colorSd)" 
              stackId="1" 
              name="Stable Diffusion" 
            />
            <Area 
              type="monotone" 
              dataKey="comfy" 
              stroke="#EC4899" 
              fillOpacity={1} 
              fill="none" 
              stackId="1" 
              name="ComfyUI" 
            />
            <Area 
              type="monotone" 
              dataKey="flux" 
              stroke="#7C3AED" 
              fillOpacity={1} 
              fill="url(#colorFlux)" 
              stackId="1" 
              name="Flux" 
            />
            <Area 
              type="monotone" 
              dataKey="wan" 
              stroke="#10B981" 
              fillOpacity={1} 
              fill="url(#colorWan)" 
              stackId="1" 
              name="Wan" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        className="mt-8 flex items-start gap-4 p-6 rounded-2xl bg-purple-500/5 border border-purple-500/10"
      >
        <div className="text-2xl mt-1">💡</div>
        <div>
          <h4 className="font-bold text-purple-400">Insight</h4>
          <p className="text-gray-300">
            Flux exploded in August 2024, overtaking Stable Diffusion as the most discussed model in just 2 months. 
            Currently, Wan is seeing the steepest adoption curve in our history.
          </p>
        </div>
      </motion.div>
    </section>
  );
};

export default ModelTrends;
