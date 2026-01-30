
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Supabase config ---
const SUPABASE_URL = 'https://ujlwuvkrxlvoswwkerdf.supabase.co/rest/v1';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHd1dmtyeGx2b3N3d2tlcmRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNzcyMzcsImV4cCI6MjA4MjczNzIzN30.XSTztghf_6a_bpR62wZdoA4S4oafJFDMoPQDRR4dT08';

const BASE_HEADERS: Record<string, string> = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

const PAGE_SIZE = 1000;
const CONCURRENCY = 5;

// --- Helpers ---

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function log(msg: string) {
  process.stdout.write(`\r\x1b[K${msg}`);
}

function logLine(msg: string) {
  console.log(msg);
}

async function supabaseFetch<T>(params: {
  table: string;
  select?: string;
  filters?: string;
  order?: string;
  limit?: number;
  offset?: number;
  count?: boolean;
}): Promise<{ data: T[]; totalCount: number | null }> {
  const { table, select, filters, order, limit, offset, count } = params;
  const queryParts: string[] = [];
  if (select) queryParts.push(`select=${select}`);
  if (filters) queryParts.push(filters);
  if (order) queryParts.push(`order=${order}`);
  if (limit !== undefined) queryParts.push(`limit=${limit}`);
  if (offset !== undefined) queryParts.push(`offset=${offset}`);

  const query = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  const url = `${SUPABASE_URL}/${table}${query}`;
  const headers: Record<string, string> = { ...BASE_HEADERS };
  if (count) {
    headers['Prefer'] = 'count=exact';
    headers['Range-Unit'] = 'items';
    headers['Range'] = `${offset ?? 0}-${(offset ?? 0) + (limit ?? 0)}`;
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { headers });
      if (response.status === 429) {
        const backoff = Math.pow(2, attempt) * 1000;
        await sleep(backoff);
        continue;
      }
      if (!response.ok) throw new Error(`Supabase ${response.status}: ${response.statusText}`);
      const data: T[] = await response.json();
      let totalCount: number | null = null;
      if (count) {
        const cr = response.headers.get('content-range');
        if (cr) { const m = cr.match(/\/(\d+)/); if (m) totalCount = parseInt(m[1], 10); }
      }
      return { data, totalCount };
    } catch (err) {
      if (attempt < 2) await sleep(Math.pow(2, attempt) * 1000);
      else throw err;
    }
  }
  throw new Error('fetch failed');
}

async function fetchAll<T>(params: { table: string; select?: string; filters?: string; order?: string }): Promise<T[]> {
  const all: T[] = [];
  let offset = 0;
  while (true) {
    const { data } = await supabaseFetch<T>({ ...params, limit: PAGE_SIZE, offset });
    all.push(...data);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return all;
}

async function withConcurrency<T>(items: T[], task: (item: T) => Promise<void>, max: number): Promise<void> {
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      await task(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(max, items.length) }, () => worker()));
}

// --- Data processing (inlined to avoid import issues) ---

interface Accumulators {
  authorCounts: Map<string, number>;
  channelCounts: Map<string, number>;
  dateCounts: Map<string, number>;
  heatmap: number[][];
  replyCounts: Map<string, number>;
  referenceCounts: Map<string, number>;
  authorHourStats: Map<string, { sinSum: number; cosSum: number; n: number }>;
}

function createAccumulators(): Accumulators {
  const heatmap: number[][] = [];
  for (let h = 0; h < 24; h++) heatmap.push([0, 0, 0, 0, 0, 0, 0]);
  return {
    authorCounts: new Map(), channelCounts: new Map(), dateCounts: new Map(),
    heatmap, replyCounts: new Map(), referenceCounts: new Map(), authorHourStats: new Map(),
  };
}

function processPage(acc: Accumulators, rows: { author_id: string; channel_id: string; created_at: string; reference_id: string | null }[]) {
  for (const row of rows) {
    acc.authorCounts.set(row.author_id, (acc.authorCounts.get(row.author_id) ?? 0) + 1);
    acc.channelCounts.set(row.channel_id, (acc.channelCounts.get(row.channel_id) ?? 0) + 1);
    const dateStr = row.created_at.slice(0, 10);
    acc.dateCounts.set(dateStr, (acc.dateCounts.get(dateStr) ?? 0) + 1);
    const d = new Date(row.created_at);
    const hour = d.getUTCHours();
    const day = d.getUTCDay();
    const dayIdx = day === 0 ? 6 : day - 1;
    acc.heatmap[hour][dayIdx]++;
    if (row.reference_id) {
      acc.replyCounts.set(row.author_id, (acc.replyCounts.get(row.author_id) ?? 0) + 1);
      acc.referenceCounts.set(row.reference_id, (acc.referenceCounts.get(row.reference_id) ?? 0) + 1);
    }
    const hourAngle = (hour / 24) * 2 * Math.PI;
    const stats = acc.authorHourStats.get(row.author_id) ?? { sinSum: 0, cosSum: 0, n: 0 };
    stats.sinSum += Math.sin(hourAngle);
    stats.cosSum += Math.cos(hourAngle);
    stats.n++;
    acc.authorHourStats.set(row.author_id, stats);
  }
}

const AVATAR_COLORS = ['#7C3AED', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899', '#8B5CF6', '#06B6D4', '#F97316', '#14B8A6'];

const STOP_WORDS = new Set([
  'the','be','to','of','and','a','in','that','have','i','it','for','not','on','with','he','as','you','do','at',
  'this','but','his','by','from','they','we','say','her','she','or','an','will','my','one','all','would','there',
  'their','what','so','up','out','if','about','who','get','which','go','me','when','make','can','like','time',
  'no','just','him','know','take','people','into','year','your','good','some','could','them','see','other',
  'than','then','now','look','only','come','its','over','think','also','back','after','use','two','how','our',
  'work','first','well','way','even','new','want','because','any','these','give','day','most','us','is','are',
  'was','were','been','has','had','did','does','am','im',"i'm",'dont',"don't",'cant',"can't",'thats',"that's",
  'yeah','yes','no','ok','okay',
]);

const EMOJI_REGEX = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu;

function circularMeanHour(sinSum: number, cosSum: number): number {
  let angle = Math.atan2(sinSum, cosSum);
  if (angle < 0) angle += 2 * Math.PI;
  return (angle / (2 * Math.PI)) * 24;
}

function formatHourMinute(hf: number): string {
  const h = Math.floor(hf);
  const m = Math.round((hf - h) * 60);
  const period = h >= 12 ? 'PM' : 'AM';
  const dh = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${dh}:${m.toString().padStart(2, '0')} ${period}`;
}

// ===========================================
// MAIN
// ===========================================

async function main() {
  const startTime = Date.now();
  logLine('🚀 Banodoco Wrapped — Precompute Script');
  logLine('=========================================\n');

  // ===== PHASE 1 =====
  logLine('📊 Phase 1: Quick stats...');

  const [totalCountResult, membersRaw, channelsRaw, firstMsg, lastMsg, millionthMsg] = await Promise.all([
    supabaseFetch<any>({ table: 'discord_messages', select: '*', limit: 1, offset: 0, count: true }),
    fetchAll<{ member_id: string; username: string; global_name: string | null; server_nick: string | null }>({
      table: 'discord_members', select: 'member_id,username,global_name,server_nick',
    }),
    fetchAll<{ channel_id: string; channel_name: string }>({
      table: 'discord_channels', select: 'channel_id,channel_name',
    }),
    supabaseFetch<{ created_at: string }>({ table: 'discord_messages', select: 'created_at', order: 'created_at.asc', limit: 1 }),
    supabaseFetch<{ created_at: string }>({ table: 'discord_messages', select: 'created_at', order: 'created_at.desc', limit: 1 }),
    supabaseFetch<{ author_id: string; channel_id: string; content: string; created_at: string }>({
      table: 'discord_messages', select: 'author_id,channel_id,content,created_at', order: 'created_at.asc', limit: 1, offset: 999999,
    }),
  ]);

  const totalMessages = totalCountResult.totalCount ?? 0;
  const memberMap = new Map<string, string>();
  for (const m of membersRaw) memberMap.set(m.member_id, m.server_nick || m.global_name || m.username);
  const channelMap = new Map<string, string>();
  for (const c of channelsRaw) channelMap.set(c.channel_id, `#${c.channel_name}`);

  const startDate = firstMsg.data[0]?.created_at?.slice(0, 10) ?? '2022-03-15';
  const endDate = lastMsg.data[0]?.created_at?.slice(0, 10) ?? '2025-01-28';
  const mMsg = millionthMsg.data[0];
  const millionthMessage = mMsg ? {
    author: memberMap.get(mMsg.author_id) || mMsg.author_id,
    channel: channelMap.get(mMsg.channel_id) || mMsg.channel_id,
    content: mMsg.content,
    timestamp: mMsg.created_at,
  } : null;

  logLine(`  Total messages: ${totalMessages.toLocaleString()}`);
  logLine(`  Members: ${membersRaw.length}, Channels: ${channelsRaw.length}`);
  logLine(`  Date range: ${startDate} → ${endDate}`);
  logLine(`  Phase 1 done ✓\n`);

  // ===== PHASE 2 =====
  logLine('📈 Phase 2: Scanning all messages...');
  const acc = createAccumulators();
  const totalPages = Math.ceil(totalMessages / PAGE_SIZE);
  const pageOffsets: number[] = [];
  for (let i = 0; i < totalPages; i++) pageOffsets.push(i * PAGE_SIZE);

  let completedPages = 0;
  await withConcurrency(pageOffsets, async (offset) => {
    const { data } = await supabaseFetch<{ author_id: string; channel_id: string; created_at: string; reference_id: string | null }>({
      table: 'discord_messages', select: 'author_id,channel_id,created_at,reference_id', order: 'created_at.asc', limit: PAGE_SIZE, offset,
    });
    processPage(acc, data);
    completedPages++;
    log(`  Scanned: ${(completedPages * PAGE_SIZE).toLocaleString()} / ${totalMessages.toLocaleString()} (${Math.round(completedPages / totalPages * 100)}%)`);
  }, CONCURRENCY);

  logLine('');

  // Top contributors
  const topContributors = [...acc.authorCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count], i) => ({ rank: i + 1, username: memberMap.get(id) || id, messages: count, avatar: AVATAR_COLORS[i] }));

  // Milestones
  const targets = [100000, 250000, 500000, 750000, 1000000];
  const milestoneLabels = ['The First 100K', 'Scaling Up', 'Halfway There!', 'Exponential Growth', 'THE MILLION!'];
  const sortedDates = [...acc.dateCounts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const startD = new Date(startDate);
  let cumulative = 0;
  let targetIdx = 0;
  const milestones: any[] = [];
  for (const [date, count] of sortedDates) {
    cumulative += count;
    while (targetIdx < targets.length && cumulative >= targets[targetIdx]) {
      const daysFromStart = Math.round((new Date(date).getTime() - startD.getTime()) / 86400000);
      milestones.push({ count: targets[targetIdx], date, daysFromStart, label: milestoneLabels[targetIdx] });
      targetIdx++;
    }
    if (targetIdx >= targets.length) break;
  }

  // Heatmap (3-hour blocks)
  const heatmapHours = [0, 3, 6, 9, 12, 15, 18, 21];
  const activityHeatmap = heatmapHours.map(h => {
    const data: number[] = [];
    for (let day = 0; day < 7; day++) {
      let sum = 0;
      for (let off = 0; off < 3; off++) sum += acc.heatmap[(h + off) % 24][day];
      data.push(sum);
    }
    return { hour: h, data };
  });

  // Channel stats
  const sortedChannels = [...acc.channelCounts.entries()].sort((a, b) => b[1] - a[1]);
  const top5ch = sortedChannels.slice(0, 5);
  const otherCount = sortedChannels.slice(5).reduce((s, [, c]) => s + c, 0);
  const channelStats = [
    ...top5ch.map(([id, count]) => ({ name: channelMap.get(id) || id, messages: count, percentage: Math.round((count / totalMessages) * 100) })),
    ...(otherCount > 0 ? [{ name: 'Other', messages: otherCount, percentage: Math.round((otherCount / totalMessages) * 100) }] : []),
  ];

  // Awards
  let helpfulId = '', helpfulMax = 0;
  for (const [id, c] of acc.replyCounts) { if (c > helpfulMax) { helpfulMax = c; helpfulId = id; } }

  let repliedId = '', repliedMax = 0;
  for (const [id, c] of acc.referenceCounts) { if (c > repliedMax) { repliedMax = c; repliedId = id; } }

  let busiestDate = '', busiestMax = 0;
  for (const [d, c] of acc.dateCounts) { if (c > busiestMax) { busiestMax = c; busiestDate = d; } }

  // Night owl / early bird
  function findClosest(target: number, min: number = 100) {
    let bestId = '', bestDist = Infinity;
    for (const [id, s] of acc.authorHourStats) {
      if (s.n < min) continue;
      const avg = circularMeanHour(s.sinSum / s.n, s.cosSum / s.n);
      let dist = Math.abs(avg - target);
      if (dist > 12) dist = 24 - dist;
      if (dist < bestDist) { bestDist = dist; bestId = id; }
    }
    const s = acc.authorHourStats.get(bestId);
    const avg = s ? circularMeanHour(s.sinSum / s.n, s.cosSum / s.n) : target;
    return { username: memberMap.get(bestId) || bestId, avgTime: formatHourMinute(avg), timezone: 'UTC' };
  }

  const nightOwl = findClosest(3);
  const earlyBird = findClosest(6);

  logLine(`  Phase 2 done ✓\n`);

  // ===== PHASE 3 =====
  logLine('🔍 Phase 3: Model trends + gratitude...');
  const modelSearches: [string, string][] = [
    ['sd', 'stable diffusion'], ['sdxl', 'sdxl'], ['flux', 'flux'], ['wan', 'wan'],
    ['comfyui', 'comfyui'], ['comfy', 'comfy'], ['animatediff', 'animatediff'],
    ['controlnet', 'controlnet'], ['lora', 'lora'], ['hunyuan', 'hunyuan'],
    ['cogvideo', 'cogvideo'], ['ltx', 'ltx'],
  ];

  const modelResults = new Map<string, { created_at: string }[]>();
  let modelsDone = 0;
  for (const [key, term] of modelSearches) {
    const rows = await fetchAll<{ created_at: string }>({
      table: 'discord_messages', select: 'created_at', filters: `content=ilike.*${term}*`,
    });
    modelResults.set(key, rows);
    modelsDone++;
    log(`  Models: ${modelsDone}/${modelSearches.length}`);
  }
  logLine('');

  // Build model trends
  const allMonths = new Set<string>();
  const modelMonthCounts = new Map<string, Record<string, number>>();
  for (const [model, rows] of modelResults) {
    const counts: Record<string, number> = {};
    for (const r of rows) { const m = r.created_at.slice(0, 7); counts[m] = (counts[m] ?? 0) + 1; allMonths.add(m); }
    modelMonthCounts.set(model, counts);
  }
  const modelTrends = [...allMonths].sort().map(month => ({
    month,
    sd: (modelMonthCounts.get('sd')?.[month] ?? 0) + (modelMonthCounts.get('sdxl')?.[month] ?? 0),
    flux: modelMonthCounts.get('flux')?.[month] ?? 0,
    wan: modelMonthCounts.get('wan')?.[month] ?? 0,
    comfy: (modelMonthCounts.get('comfyui')?.[month] ?? 0) + (modelMonthCounts.get('comfy')?.[month] ?? 0),
    animatediff: modelMonthCounts.get('animatediff')?.[month] ?? 0,
  }));

  // Gratitude
  log('  Gratitude search...');
  const thankRows = await fetchAll<{ author_id: string }>({
    table: 'discord_messages', select: 'author_id', filters: 'content=ilike.*thank*',
  });
  const thankCounts = new Map<string, number>();
  for (const r of thankRows) thankCounts.set(r.author_id, (thankCounts.get(r.author_id) ?? 0) + 1);
  let thankId = '', thankMax = 0;
  for (const [id, c] of thankCounts) { if (c > thankMax) { thankMax = c; thankId = id; } }

  logLine(`  Phase 3 done ✓\n`);

  // ===== PHASE 4 =====
  logLine('🎲 Phase 4: Fun stats from content samples...');
  const totalPagesAll = Math.ceil(totalMessages / PAGE_SIZE);
  const sampleIndices = new Set<number>();
  while (sampleIndices.size < Math.min(10, totalPagesAll)) sampleIndices.add(Math.floor(Math.random() * totalPagesAll));

  const contentSamples: { content: string; author_id: string }[] = [];
  let samplesDone = 0;
  for (const pageIdx of sampleIndices) {
    const { data } = await supabaseFetch<{ content: string; author_id: string }>({
      table: 'discord_messages', select: 'content,author_id', order: 'created_at.asc', limit: PAGE_SIZE, offset: pageIdx * PAGE_SIZE,
    });
    contentSamples.push(...data);
    samplesDone++;
    log(`  Samples: ${samplesDone}/${sampleIndices.size}`);
  }
  logLine('');

  // Longest message
  let longestLen = 0, longestAuthor = '';
  for (const r of contentSamples) {
    if (r.content && r.content.length > longestLen) { longestLen = r.content.length; longestAuthor = r.author_id; }
  }

  // Most used emoji
  const emojiCounts = new Map<string, number>();
  for (const r of contentSamples) {
    if (!r.content) continue;
    const matches = r.content.match(EMOJI_REGEX);
    if (matches) for (const e of matches) emojiCounts.set(e, (emojiCounts.get(e) ?? 0) + 1);
  }
  let topEmoji = '🔥', topEmojiCount = 0;
  for (const [e, c] of emojiCounts) { if (c > topEmojiCount) { topEmojiCount = c; topEmoji = e; } }

  // Most used word
  const wordCounts = new Map<string, number>();
  for (const r of contentSamples) {
    if (!r.content) continue;
    for (const w of r.content.toLowerCase().split(/\s+/)) {
      const clean = w.replace(/[^a-z0-9'-]/g, '');
      if (clean.length < 3 || STOP_WORDS.has(clean)) continue;
      wordCounts.set(clean, (wordCounts.get(clean) ?? 0) + 1);
    }
  }
  let topWord = '', topWordCount = 0;
  for (const [w, c] of wordCounts) { if (c > topWordCount) { topWordCount = c; topWord = w; } }

  logLine(`  Phase 4 done ✓\n`);

  // ===== BUILD FINAL DATA =====
  const appData = {
    totalMessages,
    totalMembers: membersRaw.length,
    totalChannels: channelsRaw.length,
    dateRange: { start: startDate, end: endDate },
    milestones,
    topContributors,
    awards: {
      mostHelpful: { username: memberMap.get(helpfulId) || helpfulId, count: helpfulMax, metric: 'helpful replies' },
      mostThankful: { username: memberMap.get(thankId) || thankId, count: thankMax, metric: 'thank yous' },
      nightOwl,
      earlyBird,
    },
    modelTrends,
    activityHeatmap,
    channelStats,
    funStats: {
      longestMessage: { chars: longestLen, username: memberMap.get(longestAuthor) || longestAuthor },
      mostRepliedThread: { replies: repliedMax, topic: 'Most discussed thread' },
      busiestDay: { date: busiestDate, messages: busiestMax, reason: 'Peak activity day' },
      mostUsedEmoji: { emoji: topEmoji, count: topEmojiCount },
      mostUsedWord: { word: topWord, count: topWordCount },
    },
    millionthMessage: millionthMessage ?? {
      author: 'Unknown', channel: '#general',
      content: 'The millionth message!', timestamp: new Date().toISOString(),
    },
  };

  // Write to public/data.json
  const outPath = path.resolve(__dirname, '..', 'public', 'data.json');
  fs.writeFileSync(outPath, JSON.stringify(appData, null, 2));

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  logLine('=========================================');
  logLine(`✅ Done in ${elapsed}s → public/data.json (${(fs.statSync(outPath).size / 1024).toFixed(1)} KB)`);
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
