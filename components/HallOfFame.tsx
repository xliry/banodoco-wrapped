
import React from 'react';
import { motion } from 'framer-motion';
import { Contributor, Award } from '../types';
import { Trophy, Zap, Heart, Moon, Sun, Star } from 'lucide-react';

interface HallOfFameProps {
  topContributors: Contributor[];
  awards: {
    mostHelpful: Award;
    mostThankful: Award;
    nightOwl: Award;
    earlyBird: Award;
    allNighter: Award;
  };
}

const HallOfFame: React.FC<HallOfFameProps> = ({ topContributors, awards }) => {
  const top3 = topContributors.slice(0, 3);

  // Reorder for podium: [2nd, 1st, 3rd]
  const podiumOrder = [top3[1], top3[0], top3[2]];

  return (
    <section className="py-12 sm:py-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 120 }}
        className="mb-6 sm:mb-10 text-center"
      >
        <h2 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3">🏆 Hall of Fame</h2>
        <p className="text-gray-400 text-xs sm:text-sm">The titans of the community who kept the conversation alive.</p>
      </motion.div>

      {/* Podium */}
      <div className="flex flex-col sm:flex-row items-end justify-center gap-3 mb-8 sm:mb-12 px-2 sm:px-4">
        {podiumOrder.map((user, idx) => {
          const isWinner = user.rank === 1;
          const heightClass = isWinner ? 'h-20 sm:h-32' : idx === 0 ? 'h-16 sm:h-24' : 'h-12 sm:h-20';
          const medal = isWinner ? '🥇' : idx === 0 ? '🥈' : '🥉';
          const color = user.avatar;

          return (
            <motion.div
              key={user.rank}
              initial={{ opacity: 0, y: 40, rotateX: 15 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15, type: 'spring', stiffness: 100, damping: 12 }}
              className="flex flex-col items-center w-full sm:w-36 group"
            >
              <div className="mb-2 text-center">
                <div className="relative mx-auto mb-1">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.username}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover group-hover:scale-110 transition-transform shadow-xl"
                      style={{ border: `2px solid ${color}` }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xl sm:text-2xl group-hover:scale-110 transition-transform shadow-xl ${user.avatarUrl ? 'hidden' : ''}`}
                    style={{ backgroundColor: color + '33', border: `2px solid ${color}` }}
                  >
                    {String(user.username).charAt(0)}
                  </div>
                  <div className="absolute -top-1 -right-1 text-base sm:text-lg">{medal}</div>
                </div>
                <p className="font-bold text-white text-sm sm:text-base">{user.username}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 font-mono">{(user.messages / 1000).toFixed(1)}K msgs</p>
              </div>
              <div
                className={`w-full ${heightClass} rounded-t-xl flex items-center justify-center bg-gradient-to-t from-[#1a1a1a] to-white/5 border-t border-x border-white/10`}
              >
                <span className="text-2xl sm:text-3xl font-black text-white/10">#{user.rank}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Awards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4">
        <AwardCard
          icon={<Heart className="text-sky-500" />}
          title="Most Helpful"
          user={awards.mostHelpful.username}
          metric={`${awards.mostHelpful.count} helpful acts`}
          bgColor="bg-sky-500/10"
        />
        <AwardCard
          icon={<Zap className="text-teal-500" />}
          title="Most Thankful"
          user={awards.mostThankful.username}
          metric={`${awards.mostThankful.count} thank yous`}
          bgColor="bg-teal-500/10"
        />
        <AwardCard
          icon={<Moon className="text-cyan-500" />}
          title="Night Owl"
          user={awards.nightOwl.username}
          metric={`Avg post ${awards.nightOwl.avgTime}`}
          bgColor="bg-cyan-500/10"
        />
        <AwardCard
          icon={<Sun className="text-sky-400" />}
          title="Early Bird"
          user={awards.earlyBird.username}
          metric={`Avg post ${awards.earlyBird.avgTime}`}
          bgColor="bg-sky-500/10"
        />
        <AwardCard
          icon={<Star className="text-blue-400" />}
          title="All-Nighter"
          user={awards.allNighter.username}
          metric={`${awards.allNighter.count} late night msgs`}
          bgColor="bg-blue-500/10"
        />
      </div>
    </section>
  );
};

const AwardCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  user: string;
  metric: string;
  bgColor: string;
}> = ({ icon, title, user, metric, bgColor }) => (
  <motion.div
    initial={{ opacity: 0, x: -20, rotate: -3 }}
    whileInView={{ opacity: 1, x: 0, rotate: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, type: 'spring', stiffness: 150 }}
    whileHover={{ y: -3 }}
    className={`${bgColor} border border-white/5 rounded-lg sm:rounded-xl p-3 sm:p-4 flex flex-col items-center text-center transition-all`}
  >
    <div className="p-1.5 sm:p-2 bg-white/5 rounded-full mb-1.5 sm:mb-2">
      {icon}
    </div>
    <h4 className="text-gray-400 text-[9px] sm:text-xs font-semibold mb-0.5">{title}</h4>
    <p className="text-white font-bold text-xs sm:text-sm mb-0.5 truncate w-full">@{user}</p>
    <p className="text-[9px] sm:text-[10px] text-gray-500 font-medium uppercase tracking-tighter">{metric}</p>
  </motion.div>
);

export default HallOfFame;
