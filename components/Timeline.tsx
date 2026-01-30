
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
  return (
    <div className="bg-[#1a1a1a] border border-white/10 px-4 py-3 rounded-xl shadow-2xl">
      <p className="text-xs text-gray-400 mb-1">{formatDate(label)}</p>
      <p className="text-sm font-bold text-white">{payload[0].value.toLocaleString()} posts</p>
    </div>
  );
};

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

  // Trigger celebration when animation completes
  useEffect(() => {
    if (animationComplete && !hasCelebrated) {
      setHasCelebrated(true);
      // Mini celebration burst
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.4, x: 0.85 },
        colors: ['#FFD700', '#FFA500', '#06B6D4', '#FFFFFF'],
        startVelocity: 25,
        gravity: 1.2,
      });
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
              domain={[0, 'auto']}
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
            {/* Regular milestone dots */}
            {milestonePoints.filter(m => !m.isMillionth).map((m, idx) => (
              <ReferenceDot
                key={idx}
                x={m.dataDate}
                y={m.dataCumulative}
                r={6}
                fill="#fff"
                stroke="#06B6D4"
                strokeWidth={2}
              />
            ))}
            {/* Gold 1M milestone marker */}
            {millionPoint && (
              <ReferenceDot
                x={millionPoint.date}
                y={millionPoint.cumulative}
                r={10}
                fill="#FFD700"
                stroke="#FFA500"
                strokeWidth={3}
              >
                <animate attributeName="r" values="8;12;8" dur="1.5s" repeatCount="indefinite" />
              </ReferenceDot>
            )}
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

    </section>
  );
};

export default Timeline;
