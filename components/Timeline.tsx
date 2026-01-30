
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import { Milestone, CumulativeDataPoint } from '../types';
import confetti from 'canvas-confetti';

interface TimelineProps {
  milestones: Milestone[];
  cumulativeMessages: CumulativeDataPoint[];
}

const formatYAxis = (v: number) => {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
  return String(v);
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  const isMillion = value >= 1000000;

  return (
    <div className={`px-4 py-3 rounded-xl shadow-2xl border ${isMillion ? 'bg-gradient-to-br from-yellow-900/90 to-amber-900/90 border-yellow-500/50' : 'bg-[#1a1a1a] border-white/10'}`}>
      {isMillion ? (
        <>
          <p className="text-sm font-bold text-yellow-300 mb-1">🎉 We hit 1 million posts!</p>
          <p className="text-xs text-yellow-100/70">{new Date(label).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </>
      ) : (
        <>
          <p className="text-xs text-gray-400 mb-1">{formatDate(label)}</p>
          <p className="text-sm font-bold text-white">{value.toLocaleString()} posts</p>
        </>
      )}
    </div>
  );
};

// Clean Y-axis ticks
const Y_TICKS = [0, 200000, 400000, 600000, 800000, 1000000];

const Timeline: React.FC<TimelineProps> = ({ milestones, cumulativeMessages }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(chartRef, { once: true, amount: 0.5 });
  const [animationComplete, setAnimationComplete] = useState(false);
  const [hasCelebrated, setHasCelebrated] = useState(false);

  // Find milestone points in cumulative data for ReferenceDots
  const milestonePoints = useMemo(() => {
    return milestones.map(m => {
      // Find the closest data point to each milestone
      let closestIdx = 0;
      let closestDist = Infinity;
      for (let i = 0; i < cumulativeMessages.length; i++) {
        const dist = Math.abs(cumulativeMessages[i].cumulative - m.count);
        if (dist < closestDist) {
          closestDist = dist;
          closestIdx = i;
        }
      }
      return {
        ...m,
        dataDate: cumulativeMessages[closestIdx]?.date ?? m.date,
        dataCumulative: cumulativeMessages[closestIdx]?.cumulative ?? m.count,
        isMillionth: m.count >= 1000000,
      };
    });
  }, [milestones, cumulativeMessages]);

  // Find the 1M milestone point
  const millionPoint = useMemo(() => {
    // Find the data point closest to 1M
    let closestIdx = 0;
    let closestDist = Infinity;
    for (let i = 0; i < cumulativeMessages.length; i++) {
      const dist = Math.abs(cumulativeMessages[i].cumulative - 1000000);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = i;
      }
    }
    return cumulativeMessages[closestIdx];
  }, [cumulativeMessages]);

  // Trigger celebration when animation completes - sparkles from the gold marker
  useEffect(() => {
    if (animationComplete && !hasCelebrated && chartRef.current) {
      setHasCelebrated(true);

      // Get chart position to calculate sparkle origin
      const rect = chartRef.current.getBoundingClientRect();
      const originX = (rect.right - 40) / window.innerWidth; // Near right edge of chart
      const originY = (rect.top + 60) / window.innerHeight; // Near top of chart (where 1M is)

      // Sparkle burst from the gold marker
      const burst = () => {
        confetti({
          particleCount: 30,
          spread: 50,
          origin: { x: originX, y: originY },
          colors: ['#FFD700', '#FFA500', '#FFEC8B', '#FFFFFF'],
          startVelocity: 20,
          gravity: 0.8,
          scalar: 0.8,
          ticks: 100,
        });
      };

      // Multiple small bursts for sparkle effect
      burst();
      setTimeout(burst, 150);
      setTimeout(burst, 300);
    }
  }, [animationComplete, hasCelebrated]);

  return (
    <section>
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="mb-8 sm:mb-16"
      >
        <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 flex items-center gap-3">
          <span className="text-cyan-500">📈</span> Our Art Journey
        </h2>
        <p className="text-gray-400 max-w-xl text-sm sm:text-base">
          From zero to one million — watch the community grow post by post.
        </p>
      </motion.div>

      <motion.div
        ref={chartRef}
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="h-[300px] sm:h-[420px] w-full bg-[#1a1a1a]/50 p-3 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/5 backdrop-blur-sm shadow-2xl overflow-hidden"
      >
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <AreaChart data={cumulativeMessages} margin={{ top: 10, right: 10, left: -5, bottom: 5 }}>
            <defs>
              <linearGradient id="cumulativeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.5}/>
                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.02}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#666"
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              dy={10}
              tickFormatter={formatDate}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="#666"
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatYAxis}
              width={45}
              domain={[0, 1050000]}
              ticks={Y_TICKS}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="cumulative"
              stroke="#06B6D4"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#cumulativeGrad)"
              isAnimationActive={isInView}
              animationDuration={3000}
              animationEasing="ease-out"
              onAnimationEnd={() => setAnimationComplete(true)}
            />
            {/* Gold 1M milestone marker - only shows after animation completes */}
            {animationComplete && millionPoint && (
              <ReferenceDot
                x={millionPoint.date}
                y={millionPoint.cumulative}
                r={10}
                fill="#FFD700"
                stroke="#FFA500"
                strokeWidth={3}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

    </section>
  );
};

export default Timeline;
