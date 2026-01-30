
import { useState, useEffect, useCallback, useRef } from 'react';
import type { AppData } from './types';
import { demoData } from './constants';
import {
  supabaseFetch,
  getTotalCount,
  fetchAllPagesStreaming,
  fetchAll,
  fetchLikeSearch,
} from './supabase';
import {
  buildMemberMap,
  buildChannelMap,
  createAccumulators,
  processPage,
  deriveTopContributors,
  deriveMilestones,
  deriveHeatmapData,
  deriveChannelStats,
  deriveMostHelpful,
  deriveMostRepliedThread,
  deriveBusiestDay,
  deriveNightOwl,
  deriveEarlyBird,
  buildModelTrends,
  deriveMostThankful,
  deriveLongestMessage,
  deriveMostUsedEmoji,
  deriveMostUsedWord,
} from './dataProcessing';

export type FetchPhase = 'idle' | 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'done' | 'error';

export interface FetchProgress {
  phase: FetchPhase;
  phaseLabel: string;
  phasePct: number; // 0-100 within current phase
  overallPct: number; // 0-100 across all phases
  error?: string;
}

interface CacheEntry {
  version: number;
  timestamp: number;
  data: AppData;
}

const CACHE_KEY = 'banodoco_wrapped_data';
const CACHE_VERSION = 1;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function loadCache(): AppData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (entry.version !== CACHE_VERSION) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL) return null;
    return entry.data;
  } catch {
    return null;
  }
}

function saveCache(data: AppData): void {
  try {
    const entry: CacheEntry = { version: CACHE_VERSION, timestamp: Date.now(), data };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // Silently fail if localStorage is full
  }
}

export function clearCache(): void {
  localStorage.removeItem(CACHE_KEY);
}

export interface UseDiscordDataResult {
  data: AppData;
  progress: FetchProgress;
  isLoading: boolean;
  isPhase1Done: boolean;
  refresh: () => void;
}

export function useDiscordData(): UseDiscordDataResult {
  const [data, setData] = useState<AppData>(demoData);
  const [progress, setProgress] = useState<FetchProgress>({
    phase: 'idle',
    phaseLabel: 'Initializing...',
    phasePct: 0,
    overallPct: 0,
  });
  const [isPhase1Done, setIsPhase1Done] = useState(false);
  const fetchingRef = useRef(false);

  const fetchData = useCallback(async (force: boolean = false) => {
    if (fetchingRef.current) return;

    // Check cache first
    if (!force) {
      const cached = loadCache();
      if (cached) {
        setData(cached);
        setIsPhase1Done(true);
        setProgress({ phase: 'done', phaseLabel: 'Loaded from cache', phasePct: 100, overallPct: 100 });
        return;
      }
    }

    fetchingRef.current = true;

    try {
      // ===== PHASE 1: Quick Stats =====
      setProgress({ phase: 'phase1', phaseLabel: 'Fetching quick stats...', phasePct: 0, overallPct: 0 });

      const [
        totalCountResult,
        membersResult,
        channelsResult,
        firstMsgResult,
        lastMsgResult,
        millionthResult,
      ] = await Promise.all([
        getTotalCount('discord_messages'),
        fetchAll<{ member_id: string; username: string; global_name: string | null; server_nick: string | null }>({
          table: 'discord_members',
          select: 'member_id,username,global_name,server_nick',
        }),
        fetchAll<{ channel_id: string; channel_name: string }>({
          table: 'discord_channels',
          select: 'channel_id,channel_name',
        }),
        supabaseFetch<{ created_at: string }>({
          table: 'discord_messages',
          select: 'created_at',
          order: 'created_at.asc',
          limit: 1,
        }),
        supabaseFetch<{ created_at: string }>({
          table: 'discord_messages',
          select: 'created_at',
          order: 'created_at.desc',
          limit: 1,
        }),
        supabaseFetch<{ author_id: string; channel_id: string; content: string; created_at: string }>({
          table: 'discord_messages',
          select: 'author_id,channel_id,content,created_at',
          order: 'created_at.asc',
          limit: 1,
          offset: 999999,
        }),
      ]);

      const totalMessages = totalCountResult;
      const memberMap = buildMemberMap(membersResult);
      const channelMap = buildChannelMap(channelsResult);
      const totalMembers = membersResult.length;
      const totalChannels = channelsResult.length;

      const startDate = firstMsgResult.data[0]?.created_at?.slice(0, 10) ?? demoData.dateRange.start;
      const endDate = lastMsgResult.data[0]?.created_at?.slice(0, 10) ?? demoData.dateRange.end;

      const millionthMsg = millionthResult.data[0];
      const millionthMessage = millionthMsg ? {
        author: memberMap.get(millionthMsg.author_id) || millionthMsg.author_id,
        channel: channelMap.get(millionthMsg.channel_id) || millionthMsg.channel_id,
        content: millionthMsg.content,
        timestamp: millionthMsg.created_at,
      } : demoData.millionthMessage;

      // Update data with Phase 1 results
      setData(prev => ({
        ...prev,
        totalMessages,
        totalMembers,
        totalChannels,
        dateRange: { start: startDate, end: endDate },
        millionthMessage,
      }));
      setIsPhase1Done(true);
      setProgress({ phase: 'phase2', phaseLabel: 'Scanning all messages...', phasePct: 0, overallPct: 10 });

      // ===== PHASE 2: Bulk Metadata Scan =====
      const acc = createAccumulators();

      await fetchAllPagesStreaming({
        table: 'discord_messages',
        select: 'author_id,channel_id,created_at,reference_id',
        order: 'created_at.asc',
        onPage: (rows) => processPage(acc, rows),
        onProgress: (fetched, total) => {
          const pct = Math.round((fetched / total) * 100);
          setProgress({
            phase: 'phase2',
            phaseLabel: `Scanning messages... ${fetched.toLocaleString()} / ${total.toLocaleString()}`,
            phasePct: pct,
            overallPct: 10 + Math.round(pct * 0.6), // Phase 2 = 10-70%
          });
        },
        concurrency: 5,
        totalCount: totalMessages,
      });

      // Derive Phase 2 results
      const topContributors = deriveTopContributors(acc.authorCounts, memberMap);
      const milestones = deriveMilestones(acc.dateCounts, startDate);
      const activityHeatmap = deriveHeatmapData(acc.heatmap);
      const channelStats = deriveChannelStats(acc.channelCounts, channelMap, totalMessages);
      const mostHelpful = deriveMostHelpful(acc.replyCounts, memberMap);
      const mostRepliedThreadData = deriveMostRepliedThread(acc.referenceCounts);
      const busiestDay = deriveBusiestDay(acc.dateCounts);
      const nightOwl = deriveNightOwl(acc.authorHourStats, memberMap);
      const earlyBird = deriveEarlyBird(acc.authorHourStats, memberMap);

      setData(prev => ({
        ...prev,
        topContributors,
        milestones,
        activityHeatmap,
        channelStats,
        awards: {
          ...prev.awards,
          mostHelpful,
          nightOwl,
          earlyBird,
        },
        funStats: {
          ...prev.funStats,
          mostRepliedThread: {
            replies: mostRepliedThreadData.replies,
            topic: mostRepliedThreadData.topic,
          },
          busiestDay,
        },
      }));
      setProgress({ phase: 'phase3', phaseLabel: 'Analyzing model trends...', phasePct: 0, overallPct: 70 });

      // ===== PHASE 3: Content Queries =====
      const modelSearches: [string, string][] = [
        ['sd', 'stable diffusion'],
        ['sdxl', 'sdxl'],
        ['flux', 'flux'],
        ['wan', 'wan'],
        ['comfyui', 'comfyui'],
        ['comfy', 'comfy'],
        ['animatediff', 'animatediff'],
        ['controlnet', 'controlnet'],
        ['lora', 'lora'],
        ['hunyuan', 'hunyuan'],
        ['cogvideo', 'cogvideo'],
        ['ltx', 'ltx'],
      ];

      const modelResults = new Map<string, { created_at: string }[]>();
      let modelsDone = 0;

      await Promise.all(
        modelSearches.map(async ([key, term]) => {
          const rows = await fetchLikeSearch<{ created_at: string }>(
            'discord_messages',
            'content',
            term,
            'created_at',
          );
          modelResults.set(key, rows);
          modelsDone++;
          const modelPct = Math.round((modelsDone / modelSearches.length) * 80);
          setProgress({
            phase: 'phase3',
            phaseLabel: `Model trends... ${modelsDone}/${modelSearches.length}`,
            phasePct: modelPct,
            overallPct: 70 + Math.round(modelPct * 0.15),
          });
        })
      );

      const modelTrends = buildModelTrends(modelResults);

      // Gratitude search
      setProgress({ phase: 'phase3', phaseLabel: 'Finding grateful members...', phasePct: 90, overallPct: 83 });
      const thankRows = await fetchLikeSearch<{ author_id: string }>(
        'discord_messages',
        'content',
        'thank',
        'author_id',
      );
      const mostThankful = deriveMostThankful(thankRows, memberMap);

      setData(prev => ({
        ...prev,
        modelTrends,
        awards: {
          ...prev.awards,
          mostThankful,
        },
      }));
      setProgress({ phase: 'phase4', phaseLabel: 'Computing fun stats...', phasePct: 0, overallPct: 85 });

      // ===== PHASE 4: Fun Stat Details =====
      // Sample 10 random pages for content analysis
      const samplePages = 10;
      const totalPages = Math.ceil(totalMessages / 1000);
      const pageIndices = new Set<number>();
      while (pageIndices.size < Math.min(samplePages, totalPages)) {
        pageIndices.add(Math.floor(Math.random() * totalPages));
      }

      const contentSamples: { content: string; author_id: string }[] = [];
      let samplesDone = 0;

      await Promise.all(
        [...pageIndices].map(async (pageIdx) => {
          const { data: rows } = await supabaseFetch<{ content: string; author_id: string }>({
            table: 'discord_messages',
            select: 'content,author_id',
            order: 'created_at.asc',
            limit: 1000,
            offset: pageIdx * 1000,
          });
          contentSamples.push(...rows);
          samplesDone++;
          setProgress({
            phase: 'phase4',
            phaseLabel: `Sampling content... ${samplesDone}/${samplePages}`,
            phasePct: Math.round((samplesDone / samplePages) * 100),
            overallPct: 85 + Math.round((samplesDone / samplePages) * 15),
          });
        })
      );

      const longestMessage = deriveLongestMessage(contentSamples, memberMap);
      const mostUsedEmoji = deriveMostUsedEmoji(contentSamples);
      const mostUsedWord = deriveMostUsedWord(contentSamples);

      const finalData: AppData = {
        totalMessages,
        totalMembers,
        totalChannels,
        dateRange: { start: startDate, end: endDate },
        milestones,
        topContributors,
        awards: {
          mostHelpful,
          mostThankful,
          nightOwl,
          earlyBird,
        },
        modelTrends,
        activityHeatmap,
        channelStats,
        funStats: {
          longestMessage,
          mostRepliedThread: {
            replies: mostRepliedThreadData.replies,
            topic: mostRepliedThreadData.topic,
          },
          busiestDay,
          mostUsedEmoji,
          mostUsedWord,
        },
        millionthMessage,
      };

      setData(finalData);
      saveCache(finalData);
      setProgress({ phase: 'done', phaseLabel: 'Complete!', phasePct: 100, overallPct: 100 });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Data fetch error:', err);
      setProgress({
        phase: 'error',
        phaseLabel: `Error: ${message}`,
        phasePct: 0,
        overallPct: 0,
        error: message,
      });
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => {
    clearCache();
    setIsPhase1Done(false);
    setData(demoData);
    fetchData(true);
  }, [fetchData]);

  return {
    data,
    progress,
    isLoading: progress.phase !== 'done' && progress.phase !== 'error',
    isPhase1Done,
    refresh,
  };
}
