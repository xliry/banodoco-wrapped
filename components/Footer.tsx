
import React from 'react';
import { motion } from 'framer-motion';
import { Twitter, MessageSquare, Heart } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="py-16 sm:py-32 border-t border-white/5 text-center px-4">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="space-y-6 sm:space-y-8"
      >
        <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 items-center text-base sm:text-xl text-gray-400 font-medium">
          Made with <Heart size={18} className="text-cyan-400 fill-current" /> by the <span className="text-white font-bold">Banodoco</span> community
        </div>

        <div className="flex flex-col gap-2 text-xs sm:text-sm text-gray-500">
          <p>Data analysis powered by <span className="text-gray-300 font-mono">Claude Code</span></p>
          <p>Visualized with <span className="text-gray-300 font-mono">React & Framer Motion</span></p>
        </div>

        <div className="flex justify-center gap-4 sm:gap-6 pt-6 sm:pt-8">
          <a href="#" className="p-3.5 sm:p-3 bg-white/5 rounded-full hover:bg-white/10 active:bg-white/15 transition-colors text-gray-300">
            <Twitter size={22} />
          </a>
          <a href="#" className="p-3.5 sm:p-3 bg-white/5 rounded-full hover:bg-white/10 active:bg-white/15 transition-colors text-gray-300">
            <MessageSquare size={22} />
          </a>
        </div>

        <p className="text-[9px] sm:text-[10px] text-gray-600 uppercase tracking-[0.15em] sm:tracking-[0.2em] pt-8 sm:pt-12">
          © 2025 BANODOCO DISCORD • ALL RIGHTS RESERVED
        </p>
      </motion.div>
    </footer>
  );
};

export default Footer;
