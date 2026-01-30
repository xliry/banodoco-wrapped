
import React, { useMemo, useRef, useEffect } from 'react';
import ArticleCard from './ArticleCard';
import { TopGeneration } from '../types';

interface CommunitySectionProps {
  data: TopGeneration[];
}

const CommunitySection: React.FC<CommunitySectionProps> = ({ data }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollColumnRef = useRef<HTMLDivElement>(null);

  // Group by month, sort each group by reaction_count desc, sort months chronologically
  const grouped = useMemo(() => {
    const map = new Map<string, TopGeneration[]>();
    for (const gen of data) {
      if (!map.has(gen.month)) map.set(gen.month, []);
      map.get(gen.month)!.push(gen);
    }
    for (const [, gens] of map) {
      gens.sort((a, b) => b.reaction_count - a.reaction_count);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [data]);

  // Wheel capture: redirect scroll to the right column so the page "locks" on this section
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const handler = (e: WheelEvent) => {
      // Only capture on desktop (xl = 1280px)
      if (window.innerWidth < 1280) return;

      const col = scrollColumnRef.current;
      if (!col) return;

      const { scrollTop, scrollHeight, clientHeight } = col;
      const atTop = scrollTop <= 0 && e.deltaY < 0;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 1 && e.deltaY > 0;

      // At boundaries → let the page scroll naturally to next/prev section
      if (atTop || atBottom) return;

      // Otherwise hijack the scroll into the right column
      e.preventDefault();
      col.scrollTop += e.deltaY;
    };

    section.addEventListener('wheel', handler, { passive: false });
    return () => section.removeEventListener('wheel', handler);
  }, []);

  if (!data || data.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      id="community"
      className="min-h-[100svh] xl:h-[100svh] xl:min-h-0 overflow-y-auto xl:overflow-hidden relative text-white bg-[rgba(12,20,32,0.95)]"
      style={{ contain: 'layout style paint' }}
    >
      {/* Mobile / Tablet layout */}
      <div className="xl:hidden h-full px-6 md:px-16 flex flex-col pt-20 pb-20">
        <div className="mb-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight mb-4">
            <span className="text-sky-400">🎨</span> Top Generations Over Time
          </h2>
          <p className="text-base md:text-lg text-white/60 leading-relaxed mb-6 md:mb-8 max-w-2xl">
            The most loved creations from the community — sorted by reactions each month.
          </p>
          <a
            href="https://discord.gg/NnFxGvx94b"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sky-400 font-medium hover:text-sky-300 transition-colors border border-sky-400/20 px-4 py-2 rounded-full bg-sky-400/5"
          >
            Visit Discord
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-10 10M17 7H7m10 0v10" />
            </svg>
          </a>
        </div>

        <div className="flex flex-col gap-8 md:gap-12">
          {grouped.map(([month, gens]) => (
            <ArticleCard key={month} month={month} generations={gens} variant="mobile" />
          ))}
        </div>
      </div>

      {/* Desktop layout — fixed viewport height, internal column scrolling */}
      <div className="hidden xl:grid grid-cols-12 gap-16 h-full px-16 max-w-[1920px] mx-auto">
        {/* Left column — heading (stays fixed in place) */}
        <div className="col-span-4 flex items-center pt-24 pb-24">
          <div>
            <h2 className="text-4xl xl:text-5xl font-bold leading-tight mb-6">
              <span className="text-sky-400">🎨</span> Top Generations Over Time
            </h2>
            <p className="text-lg text-white/60 leading-relaxed mb-8 max-w-2xl">
              The most loved creations from the community — sorted by reactions each month.
            </p>
            <a
              href="https://discord.gg/NnFxGvx94b"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sky-400 font-medium hover:text-sky-300 transition-colors group"
            >
              Visit Discord
              <svg
                className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-10 10M17 7H7m10 0v10" />
              </svg>
            </a>
          </div>
        </div>

        {/* Right column — scrollable card stream with snap */}
        <div
          ref={scrollColumnRef}
          className="col-span-8 overflow-y-auto scrollbar-hide relative snap-y snap-proximity pt-32 pb-32"
        >
          <div className="space-y-6">
            {grouped.map(([month, gens]) => (
              <div key={month} className="snap-start">
                <ArticleCard month={month} generations={gens} variant="desktop" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CommunitySection;
