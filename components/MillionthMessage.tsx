
import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { MillionthMessage as MillionthMessageType } from '../types';
import confetti from 'canvas-confetti';

const CLAUDE_CODE_INSTRUCTIONS = `Your goal is to answer questons based on the below Discord. Dig into the messages based on user queries.

Discord DB Tables
=================
discord_messages: message_id, author_id, channel_id, content, created_at, reference_id
discord_members:  member_id, username, global_name, server_nick
discord_channels: channel_id, channel_name

Joins: messages.author_id → members.member_id | messages.channel_id → channels.channel_id
Note: IDs are numeric in JSON (jq: .author_id == 123, not "123")

API_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHd1dmtyeGx2b3N3d2tlcmRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNzcyMzcsImV4cCI6MjA4MjczNzIzN30.XSTztghf_6a_bpR62wZdoA4S4oafJFDMoPQDRR4dT08'
BASE='https://ujlwuvkrxlvoswwkerdf.supabase.co/rest/v1'

curl -s "$BASE/discord_messages?select=content,author_id&limit=10" -H "apikey: $API_KEY" | jq
curl -s "$BASE/discord_members?member_id=eq.123456789" -H "apikey: $API_KEY" | jq
curl -s "$BASE/discord_messages?content=ilike.*keyword*&limit=20" -H "apikey: $API_KEY" | jq
curl -s "$BASE/discord_messages?limit=1000&offset=1000" -H "apikey: $API_KEY" | jq  # page 2

Filters: eq, neq, gt, lt, ilike, is.null, not.is.null, in.(a,b,c)
         reference_id=not.is.null ✓   not.reference_id=is.null ✗

Tips: Max 1000 rows (use offset=N to page) • ~100 IDs per in.() query • Parallelize with &
      -H "Prefer: count=exact" → X-Total-Count header • Aggregation is client-side

Refresh Discord Media URLs
==========================
Discord CDN URLs expire. To refresh a message's attachment URLs:

curl -X POST 'https://ujlwuvkrxlvoswwkerdf.supabase.co/functions/v1/refresh-media-urls' \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"message_id": "1465702490467995718"}'

Returns: { "success": true, "attachments": [...], "urls_updated": 1 }

Note: message_id must be a STRING (quoted) to preserve precision for Discord's large IDs.`;

interface MillionthMessageProps {
  message: MillionthMessageType;
}

const MillionthMessage: React.FC<MillionthMessageProps> = ({ message }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.5 });
  const [copied, setCopied] = useState(false);

  const handleCopyInstructions = async () => {
    try {
      await navigator.clipboard.writeText(CLAUDE_CODE_INSTRUCTIONS);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  useEffect(() => {
    if (isInView) {
      const duration = 5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);
    }
  }, [isInView]);

  // Render message content: clean Discord markup, then handle line breaks
  const renderContent = (content: string) => {
    // Process a single line: replace Discord markup with styled pills
    const processLine = (line: string) => {
      const parts: (string | React.ReactElement)[] = [];
      let remaining = line;
      let key = 0;

      while (remaining.length > 0) {
        // Match <id:XXX> (Discord command/interaction references)
        const idMatch = remaining.match(/^(.*?)<id:(\w+)>/);
        // Match <#digits> (channel references)
        const channelMatch = remaining.match(/^(.*?)<#(\d+)>/);

        // Find the earliest match
        const idIdx = idMatch ? idMatch[1].length : Infinity;
        const chIdx = channelMatch ? channelMatch[1].length : Infinity;

        if (idIdx === Infinity && chIdx === Infinity) {
          // No more matches
          if (remaining) parts.push(remaining);
          break;
        }

        if (idIdx <= chIdx && idMatch) {
          // <id:XXX> match comes first
          if (idMatch[1]) parts.push(idMatch[1]);
          const label = idMatch[2].charAt(0).toUpperCase() + idMatch[2].slice(1);
          parts.push(
            <span key={`id-${key++}`} className="inline-flex items-center px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 text-sm font-medium mx-0.5">
              /{label}
            </span>
          );
          remaining = remaining.slice(idMatch[0].length);
        } else if (channelMatch) {
          // <#digits> match comes first
          if (channelMatch[1]) parts.push(channelMatch[1]);
          parts.push(
            <span key={`ch-${key++}`} className="inline-flex items-center px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 text-sm font-medium mx-0.5">
              #channel
            </span>
          );
          remaining = remaining.slice(channelMatch[0].length);
        }
      }

      return parts;
    };

    return content.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {i > 0 && <br />}
        {processLine(line)}
      </React.Fragment>
    ));
  };

  return (
    <section ref={containerRef} className="pt-32 pb-16 sm:pt-64 sm:pb-24 flex flex-col items-center justify-center text-center px-2">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, type: "spring" }}
        className="mb-10 sm:mb-16"
      >
        <h2 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tighter mb-3 sm:mb-4 text-white">
          THE <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-teal-500">1,000,000th</span> MESSAGE
        </h2>
        <p className="text-gray-400 font-medium text-sm sm:text-base">History was made on January 15, 2025.</p>
      </motion.div>

      <motion.div
        initial={{ y: 50, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="w-full max-w-2xl bg-[#1e1f22] rounded-xl sm:rounded-2xl p-4 sm:p-8 border border-white/10 text-left shadow-2xl relative"
      >
        <div className="flex gap-3 sm:gap-4 items-start">
          {message.avatarUrl ? (
            <img
              src={message.avatarUrl}
              alt={message.author}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex-shrink-0 object-cover"
              onError={(e) => {
                // Fallback to letter avatar on load error
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-cyan-500 flex items-center justify-center text-lg sm:text-xl font-bold text-[#1e1f22] flex-shrink-0 ${message.avatarUrl ? 'hidden' : ''}`}
          >
            {String(message.author).charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
              <span className="font-bold text-white text-sm sm:text-base hover:underline cursor-pointer">@{message.author}</span>
              <span className="text-[9px] sm:text-[10px] bg-[#0891b2] px-1.5 py-0.5 rounded text-white font-bold uppercase">Lucky</span>
              <span className="text-[10px] sm:text-xs text-gray-500 sm:ml-2">
                {new Date(message.timestamp).toLocaleString()}
              </span>
            </div>
            <p className="text-gray-300 text-base sm:text-lg leading-relaxed">{renderContent(message.content)}</p>
            <div className="mt-3 sm:mt-4 flex items-center gap-2">
              <span className="text-xs font-bold text-[#0891b2] bg-[#0891b2]/10 px-2 py-1 rounded">
                #{message.channel.replace('#', '')}
              </span>
            </div>
          </div>
        </div>

        {/* Glow Effect */}
        <div className="absolute inset-0 bg-cyan-400/5 blur-3xl rounded-full pointer-events-none -z-10" />
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="mt-20 sm:mt-32 space-y-3 sm:space-y-4"
      >
        <div className="flex flex-wrap justify-center gap-1.5 items-center text-sm sm:text-base text-gray-400 font-medium">
          Made with <span className="text-red-500">&#9829;</span> by the <span className="text-white font-bold">Banodoco</span> community
        </div>

        <div className="text-xs text-gray-500">
          <p>
            Play with this data in Claude Code.{' '}
            <button
              onClick={handleCopyInstructions}
              className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors"
            >
              {copied ? 'Copied!' : 'Copy instructions here'}
            </button>
          </p>
        </div>

        <p className="text-[9px] sm:text-[10px] text-gray-600 uppercase tracking-[0.15em] sm:tracking-[0.2em]">
          © 2025 BANODOCO DISCORD • ALL RIGHTS RESERVED
        </p>
      </motion.div>
    </section>
  );
};

export default MillionthMessage;
