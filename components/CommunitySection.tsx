
import React from 'react';
import ArticleCard from './ArticleCard';
import { CommunityUpdate } from '../types';

const updates: CommunityUpdate[] = [
  {
    id: '1',
    tag: '#Ltx Chatter',
    tagColor: 'rose',
    title: 'LTX Video Releases Major End-of-January Update with New Control Features',
    description:
      'The LTX team shipped a significant update focused on improved control and workflow usability. The release includes new nodes for multimodal guidance, cross-modal guidance, and a free API for text encoding that offloads Gemma processing.',
    bullets: [
      'The update introduces LTX Multimodal Guider nodes aimed at better control in real workflows. JUSTSWEATERS liked the free API and said it seems to make loading faster.',
      'protector131090 discovered significant differences between local Gemma and API Gemma encoding, with API showing better prompt adherence.',
    ],
    mediaType: 'video',
    mediaUrl:
      'https://ujlwuvkrxlvoswwkerdf.supabase.co/storage/v1/object/public/summary-media/2026-01-30/1466727812760080639_1.mp4',
    posterUrl:
      'https://ujlwuvkrxlvoswwkerdf.supabase.co/storage/v1/object/public/summary-media/2026-01-30/1466727812760080639_1_poster.jpg',
    thumbnails: [
      'https://ujlwuvkrxlvoswwkerdf.supabase.co/storage/v1/object/public/summary-media/2026-01-30/1466590390084829184_0_poster.jpg',
      'https://ujlwuvkrxlvoswwkerdf.supabase.co/storage/v1/object/public/summary-media/2026-01-30/1466727313298165833_0_poster.jpg',
      'https://ujlwuvkrxlvoswwkerdf.supabase.co/storage/v1/object/public/summary-media/2026-01-30/1466727313298165833_1_poster.jpg',
      'https://ujlwuvkrxlvoswwkerdf.supabase.co/storage/v1/object/public/summary-media/2026-01-30/1466727812760080639_0_poster.jpg',
      'https://ujlwuvkrxlvoswwkerdf.supabase.co/storage/v1/object/public/summary-media/2026-01-30/1466727812760080639_1_poster.jpg',
    ],
  },
  {
    id: '2',
    tag: '#Z-image',
    tagColor: 'purple',
    title: 'Community Creates Optimized FP8 Quantization of Z-Image Base',
    description:
      'ramonguthrie developed a highly optimized NVfp8-mixed quantization of the FP32 Z-Image Base model, achieving a 74.41% size reduction while maintaining quality close to the full FP32 version.',
    bullets: [
      'The optimized model can run on 8GB VRAM or less, with careful layer optimization to minimize quality loss.',
      'DennisM confirmed the FP8 model uses about 4GB less VRAM during generation while maintaining quality on-par with BF16.',
    ],
    mediaType: 'image',
    mediaUrl:
      'https://ujlwuvkrxlvoswwkerdf.supabase.co/storage/v1/object/public/summary-media/2026-01-30/1466482678860873798_0.jpg',
    thumbnails: [
      'https://ujlwuvkrxlvoswwkerdf.supabase.co/storage/v1/object/public/summary-media/2026-01-30/1466482678860873798_0.jpg',
      'https://ujlwuvkrxlvoswwkerdf.supabase.co/storage/v1/object/public/summary-media/2026-01-30/1466482727820988457_0.jpg',
      'https://ujlwuvkrxlvoswwkerdf.supabase.co/storage/v1/object/public/summary-media/2026-01-30/1466482771135434897_0.jpg',
    ],
  },
  {
    id: '3',
    tag: '#Wan Chatter',
    tagColor: 'amber',
    title: 'OpenMOSS Releases MOVA: Apache 2.0 Video-Audio Model',
    description:
      'OpenMOSS released MOVA, an Apache 2.0 licensed video-audio generation model. While some initially described it as "32B," others noted it appears to be essentially Wan 2.2 A14B with audio.',
    bullets: [
      'Kijai noted the model appears to be Wan 2.1 I2V based with significant additional weights.',
      'yi analyzed that MOVA is essentially Wan 2.2 A14B (not 32B) with audio - similar to Ovi but scaled to the larger Wan 2.2 model.',
    ],
    mediaType: 'image',
    mediaUrl: 'https://picsum.photos/seed/mova/800/450',
  },
];

const CommunitySection: React.FC = () => {
  return (
    <section
      id="community"
      className="min-h-[100svh] overflow-y-auto xl:overflow-hidden relative snap-start snap-always text-white bg-[rgba(12,20,32,0.95)]"
      style={{ contain: 'layout style paint' }}
    >
      {/* Mobile / Tablet layout */}
      <div className="xl:hidden h-full px-6 md:px-16 flex flex-col pt-20 pb-20">
        <div className="mb-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight mb-4">
            Our{' '}
            <span className="text-sky-400 font-semibold drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]">
              community
            </span>{' '}
            is a{' '}
            <span className="relative inline-block pb-1 border-b-2 border-sky-400/80">
              gathering place
            </span>{' '}
            for people from across the ecosystem
          </h2>
          <p className="text-base md:text-lg text-white/60 leading-relaxed mb-6 md:mb-8 max-w-2xl">
            We've been at the cutting-edge of the technical &amp; artistic scenes over the past two
            years.
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
          {updates.map((u) => (
            <ArticleCard key={u.id} update={u} variant="mobile" />
          ))}
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden xl:grid grid-cols-12 gap-16 h-full px-16 max-w-[1920px] mx-auto">
        {/* Left column — heading */}
        <div className="col-span-4 flex items-center pt-24 pb-24">
          <div>
            <h2 className="text-4xl xl:text-5xl font-bold leading-tight mb-6">
              Our{' '}
              <span className="text-sky-400 font-semibold drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]">
                community
              </span>{' '}
              is a{' '}
              <span className="relative inline-block pb-1 border-b-2 border-sky-400/80">
                gathering place
              </span>{' '}
              for people from across the ecosystem
            </h2>
            <p className="text-lg text-white/60 leading-relaxed mb-8 max-w-2xl">
              We've been at the cutting-edge of the technical &amp; artistic scenes over the past
              two years.
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

        {/* Right column — scrollable cards */}
        <div className="col-span-8 overflow-y-auto scrollbar-hide relative snap-y snap-proximity pt-32 pb-32">
          <div className="space-y-6">
            {updates.map((u) => (
              <ArticleCard key={u.id} update={u} variant="desktop" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CommunitySection;
