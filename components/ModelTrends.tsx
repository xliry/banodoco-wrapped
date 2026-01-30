
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ModelTrend } from '../types';

interface ModelTrendsProps {
  data: ModelTrend[];
}

// ============ Constants ============

// Order matters for stacked areas - bottom to top
const MODEL_COLORS: Record<string, { stroke: string; name: string }> = {
  sd: { stroke: '#3B82F6', name: 'Stable Diffusion' },
  animatediff: { stroke: '#F97316', name: 'AnimateDiff' },
  flux: { stroke: '#A855F7', name: 'Flux' },
  wan: { stroke: '#22C55E', name: 'Wan' },
  cogvideo: { stroke: '#EC4899', name: 'CogVideoX' },
  hunyuan: { stroke: '#EAB308', name: 'HunyuanVideo' },
  ltx: { stroke: '#06B6D4', name: 'LTX' },
};

const MODEL_KEYS = Object.keys(MODEL_COLORS);

const ANIMATION = {
  MIN_STEP_MS: 120,
  MAX_STEP_MS: 400,
  AUTO_PLAY_DELAY_MS: 100,
  VISIBILITY_THRESHOLD: 0.3,
  LABEL_DURATION_FRAMES: 15,
} as const;

// ============ Utilities ============

/** Normalize data so each point sums to exactly 100% */
function normalizeData(data: ModelTrend[]): ModelTrend[] {
  return data.map((point) => {
    const total = MODEL_KEYS.reduce((sum, key) => sum + (point[key as keyof ModelTrend] as number || 0), 0);
    if (total === 0 || Math.abs(total - 100) < 0.01) return point;

    const normalized = { ...point } as ModelTrend;
    MODEL_KEYS.forEach((key) => {
      (normalized as Record<string, unknown>)[key] = ((point[key as keyof ModelTrend] as number) || 0) * (100 / total);
    });
    return normalized;
  });
}

/** Ease-out cubic: starts fast, slows at end */
function getStepDuration(progress: number): number {
  const eased = 1 - Math.pow(1 - progress, 3);
  return ANIMATION.MIN_STEP_MS + eased * (ANIMATION.MAX_STEP_MS - ANIMATION.MIN_STEP_MS);
}

/** Find the first frame where each model has a non-zero value */
function findModelFirstAppearances(data: ModelTrend[]): Record<string, number> {
  const appearances: Record<string, number> = {};

  data.forEach((point, frameIndex) => {
    MODEL_KEYS.forEach((key) => {
      if (appearances[key] === undefined) {
        const value = point[key as keyof ModelTrend] as number;
        if (value > 0) {
          appearances[key] = frameIndex;
        }
      }
    });
  });

  return appearances;
}



// ============ Hooks ============

type AnimationState = 'idle' | 'playing' | 'completed';

function useTimelineAnimation(totalFrames: number) {
  const [frame, setFrame] = useState(0);
  const [state, setState] = useState<AnimationState>('idle');
  const frameRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const play = useCallback(() => {
    frameRef.current = 0;
    setFrame(0);
    setState('playing');
  }, []);

  const pause = useCallback(() => {
    setState('idle');
  }, []);

  const toggle = useCallback(() => {
    if (state === 'playing') {
      pause();
    } else {
      play();
    }
  }, [state, play, pause]);

  useEffect(() => {
    if (state !== 'playing') return;

    let lastTime = 0;

    const tick = (timestamp: number) => {
      if (!lastTime) lastTime = timestamp;
      const elapsed = timestamp - lastTime;
      const stepDuration = getStepDuration(frameRef.current / totalFrames);

      if (elapsed >= stepDuration) {
        lastTime = timestamp;
        frameRef.current += 1;

        if (frameRef.current > totalFrames) {
          setState('completed');
          return;
        }

        setFrame(frameRef.current);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [state, totalFrames]);

  return { frame, state, play, pause, toggle };
}

function useAutoPlayOnVisible(
  ref: React.RefObject<HTMLElement | null>,
  onVisible: () => void
) {
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (hasTriggered.current || !ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= ANIMATION.VISIBILITY_THRESHOLD) {
          hasTriggered.current = true;
          observer.disconnect();
          setTimeout(onVisible, ANIMATION.AUTO_PLAY_DELAY_MS);
        }
      },
      { threshold: ANIMATION.VISIBILITY_THRESHOLD }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, onVisible]);
}

// ============ Components ============

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

/** Custom animated legend that shows models in order of appearance */
const AnimatedLegend: React.FC<{
  visibleModels: Set<string>;
  firstAppearances: Record<string, number>;
}> = ({ visibleModels, firstAppearances }) => {
  // Sort models by appearance frame, then filter to only visible ones
  const sortedVisibleModels = Object.entries(MODEL_COLORS)
    .filter(([key]) => visibleModels.has(key))
    .sort((a, b) => (firstAppearances[a[0]] ?? 0) - (firstAppearances[b[0]] ?? 0));

  return (
    <div className="flex justify-center items-center gap-x-3 px-4 min-h-[32px]">
      <AnimatePresence mode="popLayout">
        {sortedVisibleModels.map(([key, { stroke, name }]) => (
          <motion.div
            key={key}
            layout
            initial={{ opacity: 0, x: 30, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-1.5 px-2 py-1"
          >
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: stroke }} />
            <span className="text-xs text-gray-300 whitespace-nowrap">{name}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// ============ Main Component ============

const ModelTrends: React.FC<ModelTrendsProps> = ({ data }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const normalizedData = useMemo(() => normalizeData(data), [data]);
  const totalFrames = normalizedData.length;

  const { frame, state, play, toggle } = useTimelineAnimation(totalFrames);

  useAutoPlayOnVisible(sectionRef, play);

  // Find when each model first appears
  const firstAppearances = useMemo(
    () => findModelFirstAppearances(normalizedData),
    [normalizedData]
  );

  // Determine which models have appeared so far (for legend visibility)
  const visibleModels = useMemo(() => {
    const visible = new Set<string>();
    MODEL_KEYS.forEach((key) => {
      const appearFrame = firstAppearances[key];
      if (appearFrame !== undefined && frame > appearFrame) {
        visible.add(key);
      }
    });
    return visible;
  }, [frame, firstAppearances]);

  // Show revealed months + one "growing" month with zeros that will animate up
  const displayData = useMemo(() => {
    if (frame === 0) return [];

    // Get months that are fully revealed (frame - 1)
    const revealed = normalizedData.slice(0, frame);

    // Add the next month with zeroed values if there is one
    // This creates the "grow up" effect when frame advances
    if (frame < totalFrames) {
      const nextMonth = normalizedData[frame];
      const zeroed = { ...nextMonth };
      MODEL_KEYS.forEach((key) => {
        (zeroed as Record<string, unknown>)[key] = 0;
      });
      return [...revealed, zeroed];
    }

    return revealed;
  }, [normalizedData, frame, totalFrames]);

  const currentMonth = frame > 0 ? normalizedData[frame - 1]?.month : '';
  const progress = totalFrames > 0 ? (frame / totalFrames) * 100 : 0;
  const isAnimating = state === 'playing' || (frame > 0 && frame < totalFrames);

  return (
    <section ref={sectionRef} className="py-16 sm:py-32">
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
          {isAnimating && (
            <span className="text-cyan-400 text-xs sm:text-sm font-mono tabular-nums bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-md border border-white/5">
              {currentMonth}
            </span>
          )}
          <button
            onClick={toggle}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 hover:border-cyan-500/50 transition-all backdrop-blur-sm shadow-lg shadow-cyan-500/5"
          >
            {state === 'playing' ? '⏸ Pause' : state === 'completed' ? '▶ Replay' : '▶ Play'}
          </button>
        </div>

        {/* Progress bar during playback */}
        {isAnimating && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5 z-10">
            <div
              className="h-full bg-cyan-500/60 transition-none"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <AreaChart
            data={displayData}
            margin={{ top: 45, right: 5, left: -10, bottom: 5 }}
            style={{ transition: 'all 150ms ease-out' }}
          >
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
              domain={[0, 100]}
              allowDataOverflow={false}
              scale="linear"
              tickCount={6}
            />
            <Tooltip content={<CustomTooltip />} />
            {/* Custom animated legend - models appear as they debut in the data */}
            <foreignObject x="40" y="5" width="calc(100% - 80px)" height="40">
              <div className="w-full h-full flex items-start justify-center">
                <AnimatedLegend visibleModels={visibleModels} firstAppearances={firstAppearances} />
              </div>
            </foreignObject>
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
                isAnimationActive={true}
                animationDuration={350}
                animationEasing="ease-out"
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
