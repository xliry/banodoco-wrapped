
import React, { useEffect, useState } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import Hero from './components/Hero';
import Timeline from './components/Timeline';
import HallOfFame from './components/HallOfFame';
import ModelTrends from './components/ModelTrends';
import Heatmap from './components/Heatmap';
import FunStats from './components/FunStats';
import ChannelBreakdown from './components/ChannelBreakdown';
import MillionthMessage from './components/MillionthMessage';
import Footer from './components/Footer';
import { demoData } from './constants';

const App: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div className="relative min-h-screen bg-[#0f0f0f] selection:bg-purple-500/30">
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 origin-left z-50"
        style={{ scaleX }}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Hero 
          totalMessages={demoData.totalMessages} 
          dateRange={demoData.dateRange} 
        />
        
        <Timeline milestones={demoData.milestones} />
        
        <HallOfFame 
          topContributors={demoData.topContributors} 
          awards={demoData.awards} 
        />
        
        <ModelTrends data={demoData.modelTrends} />
        
        <Heatmap activityData={demoData.activityHeatmap} />
        
        <FunStats stats={demoData.funStats} />
        
        <ChannelBreakdown stats={demoData.channelStats} />
        
        <MillionthMessage message={demoData.millionthMessage} />
        
        <Footer />
      </main>
      
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-5%] w-[35%] h-[35%] bg-blue-900/10 blur-[120px] rounded-full" />
      </div>
    </div>
  );
};

export default App;
