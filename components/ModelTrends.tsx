
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ModelTrend } from '../types';

interface ModelTrendsProps {
  data: ModelTrend[];
}

const MODEL_COLORS: Record<string, { stroke: string; name: string }> = {
  sd: { stroke: '#3B82F6', name: 'Stable Diffusion' },
  animatediff: { stroke: '#F97316', name: 'AnimateDiff' },
  flux: { stroke: '#A855F7', name: 'Flux' },
  wan: { stroke: '#22C55E', name: 'Wan' },
  cogvideo: { stroke: '#EC4899', name: 'CogVideoX' },
  hunyuan: { stroke: '#EAB308', name: 'HunyuanVideo' },
  ltx: { stroke: '#06B6D4', name: 'LTX' },
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const sorted = [...payload].sort((a: any, b: any) => b.value - a.value);
  return (
    <div className="bg-[#1a1a1a] border border-white/10 px-4 py-3 rounded-xl shadow-2xl min-w-[140px]">
      <p className="text-xs text-gray-400 mb-2 font-medium">{label}</p>
      {sorted.map((entry: any, i: number) => (
        entry.value > 0 && (
          <div key={i} className="flex items-center justify-between gap-4 text-xs py-0.5">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-gray-300">{entry.name}</span>
            </div>
            <span className="text-white font-bold">{entry.value}%</span>
          </div>
        )
      ))}
    </div>
  );
};

const ModelTrends: React.FC<ModelTrendsProps> = ({ data }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [visibleCount, setVisibleCount] = useState(data.length);
  const [hasCompleted, setHasCompleted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      stopInterval();
      return;
    }

    intervalRef.current = setInterval(() => {
      setVisibleCount((prev) => {
        if (prev >= data.length) {
          setIsPlaying(false);
          setHasCompleted(true);
          return data.length;
        }
        return prev + 1;
      });
    }, 120);

    return stopInterval;
  }, [isPlaying, data.length, stopInterval]);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (visibleCount >= data.length) {
        setVisibleCount(1);
        setHasCompleted(false);
      }
      setIsPlaying(true);
    }
  }, [isPlaying, visibleCount, data.length]);

  const displayData = visibleCount < data.length ? data.slice(0, visibleCount) : data;
  const currentMonth = visibleCount <= data.length && visibleCount > 0 ? data[visibleCount - 1]?.month : '';

  return (
    <section className="py-16 sm:py-32">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="mb-8 sm:mb-12"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-3 sm:mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <span className="text-cyan-500">🤖</span> The Rise & Fall of Models
          </h2>
          <div className="flex items-center gap-3">
            {(isPlaying || visibleCount < data.length) && (
              <span className="text-cyan-400 text-sm font-mono tabular-nums">
                {currentMonth}
              </span>
            )}
            <button
              onClick={handlePlayPause}
              className="px-4 py-1.5 rounded-lg text-sm font-medium bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition-colors"
            >
              {isPlaying ? '⏸ Pause' : hasCompleted ? '▶ Replay' : visibleCount < data.length ? '▶ Resume' : '▶ Play'}
            </button>
          </div>
        </div>
        <p className="text-gray-400 text-sm sm:text-base">Share of conversation by model family — watching the community shift as technology evolved.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="h-[280px] sm:h-[400px] w-full bg-[#1a1a1a]/50 p-3 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/5 backdrop-blur-sm shadow-2xl overflow-hidden"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={displayData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
            <defs>
              {Object.entries(MODEL_COLORS).map(([key, { stroke }]) => (
                <linearGradient key={key} id={`color-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={stroke} stopOpacity={0.6}/>
                  <stop offset="95%" stopColor={stroke} stopOpacity={0.05}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
            <XAxis
              dataKey="month"
              stroke="#666"
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              dy={10}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="#666"
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
              width={40}
              domain={[0, 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
            {Object.entries(MODEL_COLORS).map(([key, { stroke, name }]) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={stroke}
                fillOpacity={1}
                fill={`url(#color-${key})`}
                stackId="1"
                name={name}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -30, filter: 'blur(4px)' }}
        whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mt-6 sm:mt-8 flex items-start gap-3 sm:gap-4 p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-cyan-500/5 border border-cyan-500/10"
      >
        <div className="text-xl sm:text-2xl mt-1">💡</div>
        <div>
          <h4 className="font-bold text-cyan-400 text-sm sm:text-base">Insight</h4>
          <p className="text-gray-300 text-sm sm:text-base">
            Stable Diffusion dominated early discussions, but Flux quickly captured the community's attention in mid-2024.
            Now Wan and newer video models are taking an increasing share of the conversation.
          </p>
        </div>
      </motion.div>
    </section>
  );
};

export default ModelTrends;
