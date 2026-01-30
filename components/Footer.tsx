
import React from 'react';
import { motion } from 'framer-motion';
import { Twitter, MessageSquare, Heart } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="py-32 border-t border-white/5 text-center">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="space-y-8"
      >
        <div className="flex justify-center gap-2 items-center text-xl text-gray-400 font-medium">
          Made with <Heart size={20} className="text-red-500 fill-current" /> by the <span className="text-white font-bold">Banodoco</span> community
        </div>
        
        <div className="flex flex-col gap-2 text-sm text-gray-500">
          <p>Data analysis powered by <span className="text-gray-300 font-mono">Claude Code</span></p>
          <p>Visualized with <span className="text-gray-300 font-mono">React & Framer Motion</span></p>
        </div>

        <div className="flex justify-center gap-6 pt-8">
          <a href="#" className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors text-gray-300">
            <Twitter size={24} />
          </a>
          <a href="#" className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors text-gray-300">
            <MessageSquare size={24} />
          </a>
        </div>

        <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em] pt-12">
          © 2025 BANODOCO DISCORD • ALL RIGHTS RESERVED
        </p>
      </motion.div>
    </footer>
  );
};

export default Footer;
