
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

  // Render message content with basic line break support
  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {i > 0 && <br />}
        {line}
      </React.Fragment>
    ));
  };

  return (
    <section ref={containerRef} className="py-32 sm:py-64 flex flex-col items-center justify-center text-center px-2">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, type: "spring" }}
        className="mb-10 sm:mb-16"
      >
        <h2 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tighter mb-3 sm:mb-4 text-white">
          THE <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-teal-500">1,000,000th</span> MESSAGE
        </h2>
        <p className="text-gray-400 font-medium text-sm sm:text-base">History was made on January 15, 2025.</p>
      </motion.div>

      <motion.div
        initial={{ y: 50, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="w-full max-w-2xl bg-[#1e1f22] rounded-xl sm:rounded-2xl p-4 sm:p-8 border border-white/10 text-left shadow-2xl relative"
      >
        <div className="flex gap-3 sm:gap-4 items-start">
          {message.avatarUrl ? (
            <img
              src={message.avatarUrl}
              alt={message.author}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex-shrink-0 object-cover"
              onError={(e) => {
                // Fallback to letter avatar on load error
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-cyan-500 flex items-center justify-center text-lg sm:text-xl font-bold text-[#1e1f22] flex-shrink-0 ${message.avatarUrl ? 'hidden' : ''}`}
          >
            {message.author.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
              <span className="font-bold text-white text-sm sm:text-base hover:underline cursor-pointer">@{message.author}</span>
              <span className="text-[9px] sm:text-[10px] bg-[#0891b2] px-1.5 py-0.5 rounded text-white font-bold uppercase">Lucky</span>
              <span className="text-[10px] sm:text-xs text-gray-500 sm:ml-2">
                {new Date(message.timestamp).toLocaleString()}
              </span>
            </div>
            <p className="text-gray-300 text-base sm:text-lg leading-relaxed">{renderContent(message.content)}</p>
            <div className="mt-3 sm:mt-4 flex items-center gap-2">
              <span className="text-xs font-bold text-[#0891b2] bg-[#0891b2]/10 px-2 py-1 rounded">
                #{message.channel.replace('#', '')}
              </span>
            </div>
          </div>
        </div>

        {/* Glow Effect */}
        <div className="absolute inset-0 bg-cyan-400/5 blur-3xl rounded-full pointer-events-none -z-10" />
      </motion.div>
    </section>
  );
};

export default MillionthMessage;
