
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CommunityUpdate } from '../types';

interface ArticleCardProps {
  update: CommunityUpdate;
  variant: 'mobile' | 'desktop';
}

const tagColors = {
  rose: 'bg-rose-500/10 text-rose-400/70',
  purple: 'bg-purple-500/10 text-purple-400/70',
  amber: 'bg-amber-500/10 text-amber-400/70',
};

const ArticleCard: React.FC<ArticleCardProps> = ({ update, variant }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [progress, setProgress] = useState(0);

  // IntersectionObserver for lazy loading
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

  // Track video progress
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

  const isDesktop = variant === 'desktop';

  return (
    <div
      ref={cardRef}
      className="bg-white/5 backdrop-blur-md rounded-xl md:rounded-2xl overflow-hidden border border-white/10 transition-colors duration-500 hover:border-white/20 h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border-b border-white/10">
        <div className="flex items-center gap-2 text-xs text-white/40">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          Today
        </div>
        <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${tagColors[update.tagColor]}`}>
          {update.tag}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 md:p-6 flex-1">
        <div className={isDesktop ? 'grid grid-cols-2 gap-6' : ''}>
          {/* Text column */}
          <div>
            <h3 className="text-base md:text-lg font-medium text-white mb-3 leading-snug">
              {update.title}
            </h3>
            {isDesktop && (
              <p className="text-sm text-white/60 leading-relaxed mb-4 line-clamp-4">
                {update.description}
              </p>
            )}
            <ul className="space-y-2">
              {update.bullets.map((bullet, i) => (
                <li key={i} className="flex gap-2 items-start">
                  <span className="text-emerald-400 mt-0.5 shrink-0">→</span>
                  <span className="text-xs text-white/50 line-clamp-2">{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Media column */}
          <div
            className="relative rounded-lg overflow-hidden bg-white/5 aspect-video md:aspect-square group cursor-pointer mt-4 md:mt-0"
            onMouseEnter={update.mediaType === 'video' ? handleMouseEnter : undefined}
            onMouseLeave={update.mediaType === 'video' ? handleMouseLeave : undefined}
          >
            {/* Loading spinner */}
            <div className="absolute inset-0 flex items-center justify-center bg-white/5 z-0">
              <div className="w-8 h-8 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
            </div>

            {update.mediaType === 'video' ? (
              <video
                ref={videoRef}
                src={update.mediaUrl}
                poster={update.posterUrl}
                preload={isVisible ? 'metadata' : 'none'}
                muted
                loop
                playsInline
                onTimeUpdate={handleTimeUpdate}
                className="relative z-10 w-full h-full object-cover"
              />
            ) : (
              <img
                src={update.mediaUrl}
                alt={update.title}
                className="relative z-10 w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                loading="lazy"
              />
            )}

            {/* Play button overlay (video only) */}
            {update.mediaType === 'video' && (
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

            {/* Progress bar (video only) */}
            {update.mediaType === 'video' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-30">
                <div
                  className="h-full bg-emerald-400 transition-all duration-300"
                  style={{ width: isHovering ? `${progress}%` : '0%' }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Thumbnail strip */}
        {update.thumbnails && update.thumbnails.length > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1 mt-4">
            {update.thumbnails.map((thumb, i) => (
              <div
                key={i}
                className={`shrink-0 w-10 h-10 md:w-14 md:h-14 rounded-md overflow-hidden transition-all ${
                  i === 0
                    ? 'ring-2 ring-emerald-400'
                    : 'ring-1 ring-white/10 hover:ring-emerald-400/50'
                }`}
              >
                <img
                  src={thumb}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-4 md:px-6 md:py-4 border-t border-white/10 bg-white/[0.02] mt-auto">
        <a
          href="https://discord.gg/NnFxGvx94b"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-2 group w-fit"
        >
          Read full update
          <svg
            className="w-4 h-4 group-hover:translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </div>
  );
};

export default ArticleCard;
