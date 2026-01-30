
import React, { useState, useEffect } from 'react';
import { motion, animate } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import SpriteGrid from './SpriteGrid';

interface HeroProps {
  totalMessages: number;
  dateRange: { start: string; end: string };
}

const Hero: React.FC<HeroProps> = ({ totalMessages, dateRange }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const controls = animate(0, totalMessages, {
      duration: 3,
      ease: "easeOut",
      onUpdate(value) {
        setCount(Math.floor(value));
      }
    });
    return () => controls.stop();
  }, [totalMessages]);

  return (
    <section className="min-h-screen flex flex-col items-center justify-center text-center relative pt-20">
      {/* Sprite Grid Background */}
      <div className="absolute inset-0 -z-10 opacity-30 overflow-hidden">
        <SpriteGrid />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="space-y-6 relative z-10"
      >
        <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-purple-400 mb-4 backdrop-blur-sm">
          Banodoco Discord 2022 — 2025
        </div>

        <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-none">
          <span className="block text-white drop-shadow-lg">🎉 {count.toLocaleString()} 🎉</span>
          <span className="block bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500">
            MESSAGES
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-gray-400 font-medium max-w-2xl mx-auto">
          "A Community in Review"
        </p>

        <p className="text-gray-500 text-sm uppercase tracking-widest font-semibold pt-4">
          Celebrating 1,000 days of AI Art & Innovation
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3, duration: 1 }}
        className="absolute bottom-10 animate-bounce z-10"
      >
        <div className="flex flex-col items-center text-gray-500 text-xs font-semibold gap-2">
          SCROLL TO EXPLORE
          <ChevronDown size={20} />
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;
