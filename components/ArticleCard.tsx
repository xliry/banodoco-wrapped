
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { TopGeneration } from '../types';

interface ArticleCardProps {
  month: string;
  generations: TopGeneration[];
  variant: 'mobile' | 'desktop';
}

const formatMonth = (monthStr: string) => {
  const [year, month] = monthStr.split('-');
  const d = new Date(parseInt(year), parseInt(month) - 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const ArticleCard: React.FC<ArticleCardProps> = ({ month, generations, variant }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [featuredIndex, setFeaturedIndex] = useState(0);

  const featured = generations[featuredIndex];
  const isDesktop = variant === 'desktop';

  // IntersectionObserver — lazy load media
  useEffect(() => {
    const node = cardRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Reset video state when switching featured
  useEffect(() => {
    setProgress(0);
    setIsHovering(false);
  }, [featuredIndex]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (video && video.duration) {
      setProgress((video.currentTime / video.duration) * 100);
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
    videoRef.current?.play().catch(() => {});
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
      setProgress(0);
    }
  }, []);

  if (!featured) return null;

  return (
    <div
      ref={cardRef}
      className="bg-white/5 backdrop-blur-md rounded-xl md:rounded-2xl overflow-hidden border border-white/10 transition-colors duration-500 hover:border-white/20 h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border-b border-white/10">
        <span className="text-sm font-semibold text-white">{formatMonth(month)}</span>
        <span className="text-[11px] text-white/40 font-medium">{generations.length} top posts</span>
      </div>

      {/* Body */}
      <div className="p-4 md:p-6 flex-1">
        <div className={isDesktop ? 'grid grid-cols-2 gap-6' : ''}>
          {/* Info column (desktop only) */}
          {isDesktop && (
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-3">
                {featured.avatarUrl ? (
                  <img src={featured.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-cyan-500/30 flex items-center justify-center text-[9px] font-bold text-white">
                    {featured.author.charAt(0)}
                  </div>
                )}
                <span className="text-white text-sm font-medium truncate">{featured.author}</span>
                <span className="text-cyan-400 text-xs font-bold ml-auto">{featured.reaction_count} reactions</span>
              </div>
              {featured.content && (
                <p className="text-sm text-white/60 leading-relaxed mb-4 line-clamp-4">
                  {featured.content}
                </p>
              )}
              <div className="text-xs text-white/30">
                #{featured.channel} &middot; {new Date(featured.created_at).toLocaleDateString()}
              </div>
            </div>
          )}

          {/* Media column */}
          <div
            className={`relative rounded-lg overflow-hidden bg-white/5 ${isDesktop ? 'aspect-square' : 'aspect-video'} group cursor-pointer`}
            onMouseEnter={featured.mediaType === 'video' ? handleMouseEnter : undefined}
            onMouseLeave={featured.mediaType === 'video' ? handleMouseLeave : undefined}
          >
            {/* Loading spinner */}
            <div className="absolute inset-0 flex items-center justify-center bg-white/5 z-0">
              <div className="w-8 h-8 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
            </div>

            {featured.mediaType === 'video' ? (
              <video
                ref={videoRef}
                src={isVisible ? featured.mediaUrl : undefined}
                preload={isVisible ? 'metadata' : 'none'}
                muted
                loop
                playsInline
                onTimeUpdate={handleTimeUpdate}
                className="relative z-10 w-full h-full object-cover"
              />
            ) : (
              <img
                src={isVisible ? featured.mediaUrl : undefined}
                alt={featured.content || 'Community generation'}
                className="relative z-10 w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
            )}

            {/* Mobile overlay — author info */}
            {!isDesktop && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-3 z-20">
                <div className="flex items-center gap-2">
                  {featured.avatarUrl ? (
                    <img src={featured.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-cyan-500/30 flex items-center justify-center text-[8px] font-bold text-white">
                      {featured.author.charAt(0)}
                    </div>
                  )}
                  <span className="text-white text-xs font-medium truncate">{featured.author}</span>
                  <span className="ml-auto text-cyan-400 text-xs font-bold">{featured.reaction_count}</span>
                </div>
              </div>
            )}

            {/* Play button overlay */}
            {featured.mediaType === 'video' && (
              <div
                className={`absolute inset-0 flex items-center justify-center z-20 pointer-events-none transition-opacity duration-300 ${
                  isHovering ? 'opacity-0' : 'opacity-100'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20">
                  <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            )}

            {/* Progress bar */}
            {featured.mediaType === 'video' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-30">
                <div
                  className="h-full bg-emerald-400 transition-all duration-300"
                  style={{ width: isHovering ? `${progress}%` : '0%' }}
                />
              </div>
            )}

            {/* Reaction badge */}
            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5 text-[10px] font-bold text-cyan-400 z-20">
              {featured.reaction_count}
            </div>

            {/* Media type badge */}
            {featured.mediaType === 'video' && (
              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white z-20">
                VIDEO
              </div>
            )}
          </div>
        </div>

        {/* Thumbnail strip */}
        {generations.length > 1 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1 mt-4">
            {generations.map((gen, i) => (
              <button
                key={gen.message_id}
                onClick={() => setFeaturedIndex(i)}
                className={`shrink-0 w-10 h-10 md:w-14 md:h-14 rounded-md overflow-hidden transition-all ${
                  i === featuredIndex
                    ? 'ring-2 ring-emerald-400'
                    : 'ring-1 ring-white/10 hover:ring-emerald-400/50'
                }`}
              >
                {gen.mediaType === 'video' ? (
                  <div className="w-full h-full bg-white/10 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                ) : (
                  <img
                    src={isVisible ? gen.mediaUrl : undefined}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 md:px-6 md:py-4 border-t border-white/10 bg-white/[0.02] mt-auto">
        <span className="text-sm text-white/60 flex items-center gap-2 w-fit">
          Watch full month
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </div>
  );
};

export default ArticleCard;
