
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
import Footer from './components/Footer';
import LoadingScreen, { FloatingProgress } from './components/LoadingScreen';
import { useDiscordData } from './useDiscordData';

const SectionShimmer: React.FC<{ height?: string }> = ({ height = 'h-64' }) => (
  <div className={`w-full ${height} rounded-2xl bg-white/5 animate-pulse`} />
);

const App: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const { data, progress, isLoading, isPhase1Done, refresh } = useDiscordData();

  const phase2Done = !isLoading || ['phase3', 'phase4', 'done'].includes(progress.phase);
  const phase3Done = !isLoading || ['phase4', 'done'].includes(progress.phase);
  const phase4Done = !isLoading || progress.phase === 'done';

  return (
    <div className="relative min-h-screen bg-[#0f0f0f] selection:bg-purple-500/30">
      {/* Full-screen loading until Phase 1 completes */}
      <LoadingScreen progress={progress} visible={!isPhase1Done} />

      {/* Floating progress indicator after Phase 1 */}
      <FloatingProgress
        progress={progress}
        visible={isPhase1Done && isLoading}
      />

      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 origin-left z-50"
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

      {/* Refresh button (when cached data is shown) */}
      {progress.phase === 'done' && (
        <button
          onClick={refresh}
          className="fixed top-4 right-4 z-50 text-white/30 hover:text-white/60 text-xs bg-white/5 hover:bg-white/10 rounded-lg px-3 py-1.5 transition-colors backdrop-blur-xl border border-white/10"
        >
          Refresh Data
        </button>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Phase 1: Always show Hero + MillionthMessage once Phase 1 is done */}
        <Hero
          totalMessages={data.totalMessages}
          dateRange={data.dateRange}
        />

        {/* Phase 2 sections: show shimmer until Phase 2 completes */}
        {phase2Done ? (
          <Timeline milestones={data.milestones} />
        ) : (
          <SectionShimmer height="h-48" />
        )}

        {phase2Done ? (
          <HallOfFame
            topContributors={data.topContributors}
            awards={data.awards}
          />
        ) : (
          <SectionShimmer height="h-96" />
        )}

        {/* Phase 3 section */}
        {phase3Done ? (
          <ModelTrends data={data.modelTrends} />
        ) : (
          <SectionShimmer height="h-80" />
        )}

        {/* Phase 2 sections */}
        {phase2Done ? (
          <Heatmap activityData={data.activityHeatmap} />
        ) : (
          <SectionShimmer height="h-72" />
        )}

        {/* Phase 4 section */}
        {phase4Done ? (
          <FunStats stats={data.funStats} />
        ) : (
          <SectionShimmer height="h-64" />
        )}

        {/* Phase 2 section */}
        {phase2Done ? (
          <ChannelBreakdown stats={data.channelStats} />
        ) : (
          <SectionShimmer height="h-72" />
        )}

        <MillionthMessage message={data.millionthMessage} />

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
