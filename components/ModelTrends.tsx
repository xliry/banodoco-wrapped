
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

const STEP_MS = 180;

const ModelTrends: React.FC<ModelTrendsProps> = ({ data }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [visibleCount, setVisibleCount] = useState(data.length);
  const [hasCompleted, setHasCompleted] = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastStepRef = useRef<number>(0);

  useEffect(() => {
    if (!isPlaying) return;

    lastStepRef.current = 0;

    const tick = (timestamp: number) => {
      if (!lastStepRef.current) lastStepRef.current = timestamp;
      const elapsed = timestamp - lastStepRef.current;

      if (elapsed >= STEP_MS) {
        lastStepRef.current = timestamp;
        setVisibleCount((prev) => {
          if (prev >= data.length) {
            setIsPlaying(false);
            setHasCompleted(true);
            return data.length;
          }
          return prev + 1;
        });
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, data.length]);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      setVisibleCount(1);
      setHasCompleted(false);
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const displayData = visibleCount < data.length ? data.slice(0, visibleCount) : data;
  const currentMonth = visibleCount <= data.length && visibleCount > 0 ? data[visibleCount - 1]?.month : '';
  const progress = data.length > 1 ? ((visibleCount - 1) / (data.length - 1)) * 100 : 100;

  return (
    <section className="py-16 sm:py-32">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="mb-8 sm:mb-12"
      >
        <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 flex items-center gap-3">
          <span className="text-cyan-500">🤖</span> The Rise & Fall of Models
        </h2>
        <p className="text-gray-400 text-sm sm:text-base">Share of conversation by model family — watching the community shift as technology evolved.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="h-[280px] sm:h-[400px] w-full bg-[#1a1a1a]/50 p-3 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/5 backdrop-blur-sm shadow-2xl overflow-hidden relative"
      >
        {/* Play / Pause overlay */}
        <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-10 flex items-center gap-2.5">
          {(isPlaying || visibleCount < data.length) && (
            <span className="text-cyan-400 text-xs sm:text-sm font-mono tabular-nums bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-md border border-white/5">
              {currentMonth}
            </span>
          )}
          <button
            onClick={handlePlayPause}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 hover:border-cyan-500/50 transition-all backdrop-blur-sm shadow-lg shadow-cyan-500/5"
          >
            {isPlaying ? '⏸ Pause' : hasCompleted ? '▶ Replay' : '▶ Play'}
          </button>
        </div>

        {/* Progress bar during playback */}
        {(isPlaying || (visibleCount < data.length && visibleCount > 0)) && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5 z-10">
            <div
              className="h-full bg-cyan-500/60 transition-none"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
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
