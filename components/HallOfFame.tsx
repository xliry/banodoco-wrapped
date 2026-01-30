
import React from 'react';
import { motion } from 'framer-motion';
import { Contributor, Award } from '../types';
import { Trophy, Zap, Heart, Moon, Sun } from 'lucide-react';

interface HallOfFameProps {
  topContributors: Contributor[];
  awards: {
    mostHelpful: Award;
    mostThankful: Award;
    nightOwl: Award;
    earlyBird: Award;
  };
}

const HallOfFame: React.FC<HallOfFameProps> = ({ topContributors, awards }) => {
  const top3 = topContributors.slice(0, 3);
  
  // Reorder for podium: [2nd, 1st, 3rd]
  const podiumOrder = [top3[1], top3[0], top3[2]];

  return (
    <section className="py-32">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="mb-16 text-center"
      >
        <h2 className="text-4xl font-bold mb-4">🏆 Hall of Fame</h2>
        <p className="text-gray-400">The titans of the community who kept the conversation alive.</p>
      </motion.div>

      {/* Podium */}
      <div className="flex flex-col md:flex-row items-end justify-center gap-4 mb-24 px-4">
        {podiumOrder.map((user, idx) => {
          const isWinner = user.rank === 1;
          const heightClass = isWinner ? 'h-64' : idx === 0 ? 'h-48' : 'h-40';
          const medal = isWinner ? '🥇' : idx === 0 ? '🥈' : '🥉';
          const color = user.avatar;

          return (
            <motion.div
              key={user.rank}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.15, type: "spring" }}
              className="flex flex-col items-center w-full md:w-48 group"
            >
              <div className="mb-4 text-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-2 relative mx-auto group-hover:scale-110 transition-transform shadow-xl"
                  style={{ backgroundColor: color + '33', border: `2px solid ${color}` }}
                >
                  {user.username.charAt(0)}
                  <div className="absolute -top-2 -right-2 text-2xl">{medal}</div>
                </div>
                <p className="font-bold text-white text-lg">{user.username}</p>
                <p className="text-sm text-gray-500 font-mono">{(user.messages / 1000).toFixed(1)}K msgs</p>
              </div>
              <div 
                className={`w-full ${heightClass} rounded-t-2xl flex items-center justify-center bg-gradient-to-t from-[#1a1a1a] to-white/5 border-t border-x border-white/10`}
              >
                <span className="text-5xl font-black text-white/10">#{user.rank}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Awards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <AwardCard 
          icon={<Heart className="text-pink-500" />} 
          title="Most Helpful" 
          user={awards.mostHelpful.username} 
          metric={`${awards.mostHelpful.count} helpful acts`} 
          bgColor="bg-pink-500/10" 
        />
        <AwardCard 
          icon={<Zap className="text-green-500" />} 
          title="Most Thankful" 
          user={awards.mostThankful.username} 
          metric={`${awards.mostThankful.count} thank yous`} 
          bgColor="bg-green-500/10" 
        />
        <AwardCard 
          icon={<Moon className="text-blue-500" />} 
          title="Night Owl" 
          user={awards.nightOwl.username} 
          metric={`Avg post ${awards.nightOwl.avgTime}`} 
          bgColor="bg-blue-500/10" 
        />
        <AwardCard 
          icon={<Sun className="text-orange-500" />} 
          title="Early Bird" 
          user={awards.earlyBird.username} 
          metric={`Avg post ${awards.earlyBird.avgTime}`} 
          bgColor="bg-orange-500/10" 
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
    whileHover={{ y: -5 }}
    className={`${bgColor} border border-white/5 rounded-2xl p-6 flex flex-col items-center text-center transition-all`}
  >
    <div className="p-3 bg-white/5 rounded-full mb-4">
      {icon}
    </div>
    <h4 className="text-gray-400 text-sm font-semibold mb-1">{title}</h4>
    <p className="text-white font-bold text-lg mb-1">@{user}</p>
    <p className="text-xs text-gray-500 font-medium uppercase tracking-tighter">{metric}</p>
  </motion.div>
);

export default HallOfFame;
