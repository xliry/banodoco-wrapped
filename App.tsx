
import React from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import Hero from './components/Hero';
import Timeline from './components/Timeline';
import HallOfFame from './components/HallOfFame';
import ModelTrends from './components/ModelTrends';
import Heatmap from './components/Heatmap';
import FunStats from './components/FunStats';
import ChannelBreakdown from './components/ChannelBreakdown';
import MillionthMessage from './components/MillionthMessage';
import TopGenerations from './components/TopGenerations';
import Footer from './components/Footer';
import LoadingScreen from './components/LoadingScreen';
import { useDiscordData } from './useDiscordData';

const App: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const { data, progress, isLoading, isPhase1Done, refresh } = useDiscordData();

  return (
    <div className="relative min-h-screen bg-[#0f0f0f] selection:bg-cyan-500/30">
      {/* Loading screen until data.json is fetched */}
      <LoadingScreen progress={progress} visible={!isPhase1Done} />

      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-500 origin-left z-50"
        style={{ scaleX }}
      />

      {/* Error banner */}
      {progress.phase === 'error' && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500/20 border border-red-500/30 backdrop-blur-xl rounded-xl px-6 py-3 flex items-center gap-4">
          <span className="text-red-300 text-sm">{progress.error}</span>
          <button
            onClick={refresh}
            className="text-white text-sm bg-white/10 hover:bg-white/20 rounded-lg px-3 py-1 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Hero spans full viewport width */}
      <Hero
        totalMessages={data.totalMessages}
        dateRange={data.dateRange}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Timeline
          milestones={data.milestones}
          cumulativeMessages={data.cumulativeMessages}
        />

        <HallOfFame
          topContributors={data.topContributors}
          awards={data.awards}
        />

        <ModelTrends data={data.modelTrends} />

        <Heatmap activityData={data.activityHeatmap} />

        <FunStats stats={data.funStats} />

        <ChannelBreakdown stats={data.channelStats} />

        <TopGenerations data={data.topGenerations} />

        <MillionthMessage message={data.millionthMessage} />

        <Footer />
      </main>

      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-900/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-5%] w-[35%] h-[35%] bg-blue-900/10 blur-[120px] rounded-full" />
      </div>
    </div>
  );
};

export default App;
