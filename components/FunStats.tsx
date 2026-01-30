
import React from 'react';
import { motion } from 'framer-motion';

interface FunStatsProps {
  stats: {
    longestMessage: { chars: number; username: string };
    mostRepliedThread: { replies: number; topic: string };
    busiestDay: { date: string; messages: number; reason: string };
    mostUsedEmoji: { emoji: string; count: number };
    mostUsedWord: { word: string; count: number };
  };
}

const FunStats: React.FC<FunStatsProps> = ({ stats }) => {
  return (
    <section>
      <motion.div
        initial={{ opacity: 0, filter: 'blur(10px)' }}
        whileInView={{ opacity: 1, filter: 'blur(0px)' }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="mb-8 sm:mb-12"
      >
        <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 flex items-center gap-3">
          <span className="text-sky-500">🎲</span> Random Fun Facts
        </h2>
        <p className="text-gray-400 text-sm sm:text-base">The weird and wonderful data of 1 million posts.</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 auto-rows-[160px] sm:auto-rows-[200px]">
        {/* Longest Message */}
        <StatCard
          className="sm:col-span-2 bg-gradient-to-br from-cyan-900/20 to-sky-900/20"
          label="The Novel Writer"
          value={stats.longestMessage.chars.toLocaleString()}
          suffix="characters in one post"
          sub={`By @${stats.longestMessage.username}`}
          icon="📝"
          index={0}
        />

        {/* Busiest Day */}
        <StatCard
          className="bg-teal-500/10"
          label="Busiest Day"
          value={stats.busiestDay.messages.toString()}
          suffix="posts"
          sub={stats.busiestDay.reason}
          icon="🔥"
          index={1}
        />

        {/* Most Replied */}
        <StatCard
          className="bg-sky-500/10"
          label="Hottest Topic"
          value={stats.mostRepliedThread.replies.toString()}
          suffix="replies in one thread"
          sub={stats.mostRepliedThread.topic}
          icon="🔁"
          index={2}
        />

        {/* Emoji */}
        <StatCard
          className="bg-teal-500/10"
          label="Favorite Reaction"
          value={stats.mostUsedEmoji.count.toLocaleString()}
          suffix="times used"
          sub={`The ${stats.mostUsedEmoji.emoji} emoji reigns supreme`}
          icon={stats.mostUsedEmoji.emoji}
          index={3}
        />

        {/* Most Used Word */}
        <StatCard
          className="bg-blue-500/10"
          label="Common Vocabulary"
          value={stats.mostUsedWord.count.toLocaleString()}
          suffix="mentions"
          sub={`The word "${stats.mostUsedWord.word}"`}
          icon="💬"
          index={4}
        />
      </div>
    </section>
  );
};

const StatCard: React.FC<{
  className?: string;
  label: string;
  value: string;
  suffix: string;
  sub: string;
  icon: string;
  index?: number;
}> = ({ className, label, value, suffix, sub, icon, index = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay: index * 0.1 }}
    whileHover={{ scale: 1.02 }}
    className={`p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/5 flex flex-col justify-between group cursor-default transition-all ${className}`}
  >
    <div className="flex justify-between items-start">
      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-500">{label}</span>
      <span className="text-xl sm:text-2xl group-hover:scale-125 transition-transform">{icon}</span>
    </div>
    <div>
      <div className="flex items-baseline gap-1.5 sm:gap-2">
        <span className="text-2xl sm:text-4xl font-black text-white">{value}</span>
        <span className="text-xs sm:text-sm font-medium text-gray-400">{suffix}</span>
      </div>
      <p className="text-[10px] sm:text-xs text-gray-500 mt-1 font-medium">{sub}</p>
    </div>
  </motion.div>
);

export default FunStats;
