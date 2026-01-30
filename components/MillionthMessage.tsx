
import React, { useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { MillionthMessage as MillionthMessageType } from '../types';
import confetti from 'https://cdn.skypack.dev/canvas-confetti';

interface MillionthMessageProps {
  message: MillionthMessageType;
}

const MillionthMessage: React.FC<MillionthMessageProps> = ({ message }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.5 });

  useEffect(() => {
    if (isInView) {
      const duration = 5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);
    }
  }, [isInView]);

  return (
    <section ref={containerRef} className="py-64 flex flex-col items-center justify-center text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, type: "spring" }}
        className="mb-16"
      >
        <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 text-white">
          THE <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">1,000,000th</span> MESSAGE
        </h2>
        <p className="text-gray-400 font-medium">History was made on January 15, 2025.</p>
      </motion.div>

      <motion.div
        initial={{ y: 50, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="w-full max-w-2xl bg-[#1e1f22] rounded-2xl p-8 border border-white/10 text-left shadow-2xl relative"
      >
        <div className="flex gap-4 items-start">
          <div className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center text-xl font-bold text-[#1e1f22]">
            {message.author.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-white hover:underline cursor-pointer">@{message.author}</span>
              <span className="text-[10px] bg-[#5865f2] px-1.5 py-0.5 rounded text-white font-bold uppercase">Lucky</span>
              <span className="text-xs text-gray-500 ml-2">
                {new Date(message.timestamp).toLocaleString()}
              </span>
            </div>
            <p className="text-gray-300 text-lg leading-relaxed">{message.content}</p>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs font-bold text-[#5865f2] bg-[#5865f2]/10 px-2 py-1 rounded">
                #{message.channel.replace('#', '')}
              </span>
            </div>
          </div>
        </div>
        
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-yellow-400/5 blur-3xl rounded-full pointer-events-none -z-10" />
      </motion.div>
    </section>
  );
};

export default MillionthMessage;
