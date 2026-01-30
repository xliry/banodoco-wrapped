
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FetchProgress } from '../useDiscordData';

interface LoadingScreenProps {
  progress: FetchProgress;
  visible: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress, visible }) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f0f0f]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col items-center gap-8 px-6 max-w-md w-full">
            {/* Animated logo / title */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                Banodoco
              </h1>
              <p className="text-white/50 mt-2 text-lg">1M Messages Wrapped</p>
            </motion.div>

            {/* Pulsing dots */}
            <div className="flex gap-2">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-3 h-3 rounded-full bg-purple-500"
                  animate={{
                    scale: [1, 1.4, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>

            {/* Progress bar */}
            <div className="w-full">
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.phasePct}%` }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                />
              </div>
              <p className="text-white/40 text-sm mt-3 text-center">
                {progress.phaseLabel}
              </p>
            </div>
          </div>

          {/* Background decorations */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
            <div className="absolute top-[20%] left-[10%] w-[30%] h-[30%] bg-purple-900/20 blur-[100px] rounded-full" />
            <div className="absolute bottom-[20%] right-[10%] w-[25%] h-[25%] bg-blue-900/20 blur-[100px] rounded-full" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingScreen;

// --- Floating progress indicator (for use after Phase 1) ---

interface FloatingProgressProps {
  progress: FetchProgress;
  visible: boolean;
}

export const FloatingProgress: React.FC<FloatingProgressProps> = ({ progress, visible }) => {
  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-6 right-6 z-50 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-3 shadow-2xl max-w-xs"
      >
        <div className="flex items-center gap-3">
          <motion.div
            className="w-2 h-2 rounded-full bg-purple-400"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <div className="flex-1 min-w-0">
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                animate={{ width: `${progress.overallPct}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-white/40 text-xs mt-1 truncate">
              {progress.phaseLabel}
            </p>
          </div>
          <span className="text-white/30 text-xs font-mono">{progress.overallPct}%</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
