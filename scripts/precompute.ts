
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

// --- Channel-to-family mapping ---
const CHANNEL_FAMILY_MAP: Record<string, string[]> = {
  sd: ['sd', 'sdxl-turbo', 'stable-cascade', 'stable-video-diffusion', 'stable-zero123'],
  animatediff: ['animatediff', 'animatediff', 'ad_comfyui_dev', 'ad_fine-tuning', 'ad_sparsectrl', 'ad_training', 'longanimatediff'],
  flux: ['flux', 'flux', 'flux_gens', 'flux_resources', 'flux_training', 'flux_kontext'],
  wan: ['wan_chatter', 'wan_gens', 'wan_training', 'wan_resources', 'wan_bot', 'wan_comfyui'],
  cogvideo: ['cogvideox', 'cogvideox', 'cogvideox_gens', 'cogvideox_training'],
  hunyuan: ['hunyuanvideo', 'hunyuanvideo', 'hunyuanvideo_gens', 'hunyuanvideo_training', 'hunyuandit', 'hunyuan_tech_support', 'hunyuan3d', 'hunyuanimage'],
  ltx: ['ltx_chatter', 'ltx_gens', 'ltx_resources', 'ltx_training', 'ltxv_beta_testers', 'ltxv_gens', 'ltxv_h100', 'ltxv_training'],
};

// Updates channel - exclude from top generations
const UPDATES_CHANNEL_ID = '1138790534987661363';

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
  channelMonthCounts: Map<string, Map<string, number>>;
  authorLateNightCounts: Map<string, number>;
}

function createAccumulators(): Accumulators {
  const heatmap: number[][] = [];
  for (let h = 0; h < 24; h++) heatmap.push([0, 0, 0, 0, 0, 0, 0]);
  return {
    authorCounts: new Map(), channelCounts: new Map(), dateCounts: new Map(),
    heatmap, replyCounts: new Map(), referenceCounts: new Map(), authorHourStats: new Map(),
    channelMonthCounts: new Map(), authorLateNightCounts: new Map(),
  };
}

function processPage(acc: Accumulators, rows: { author_id: string; channel_id: string; created_at: string; reference_id: string | null }[]) {
  for (const row of rows) {
    acc.authorCounts.set(row.author_id, (acc.authorCounts.get(row.author_id) ?? 0) + 1);
    acc.channelCounts.set(row.channel_id, (acc.channelCounts.get(row.channel_id) ?? 0) + 1);
    const dateStr = row.created_at.slice(0, 10);
    acc.dateCounts.set(dateStr, (acc.dateCounts.get(dateStr) ?? 0) + 1);
    const monthStr = row.created_at.slice(0, 7);
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

    // Channel-month counts for model trends
    if (!acc.channelMonthCounts.has(row.channel_id)) {
      acc.channelMonthCounts.set(row.channel_id, new Map());
    }
    const chMonths = acc.channelMonthCounts.get(row.channel_id)!;
    chMonths.set(monthStr, (chMonths.get(monthStr) ?? 0) + 1);

    // Late night (0-5 UTC) tracking for all-nighter award
    if (hour >= 0 && hour <= 5) {
      acc.authorLateNightCounts.set(row.author_id, (acc.authorLateNightCounts.get(row.author_id) ?? 0) + 1);
    }
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
    fetchAll<{ member_id: string; username: string; global_name: string | null; server_nick: string | null; avatar_url: string | null }>({
      table: 'discord_members', select: 'member_id,username,global_name,server_nick,avatar_url',
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
  const memberAvatarMap = new Map<string, string>();
  for (const m of membersRaw) {
    memberMap.set(m.member_id, m.server_nick || m.global_name || m.username);
    if (m.avatar_url) memberAvatarMap.set(m.member_id, m.avatar_url);
  }
  const channelMap = new Map<string, string>();
  for (const c of channelsRaw) channelMap.set(c.channel_id, `#${c.channel_name}`);

  // Build channel name -> channel id lookup for model family mapping
  const channelNameToId = new Map<string, string>();
  for (const c of channelsRaw) channelNameToId.set(c.channel_name.toLowerCase(), c.channel_id);

  // Build channel id -> family mapping (exact match only — no fuzzy substring)
  const channelIdToFamily = new Map<string, string>();
  for (const [family, channelNames] of Object.entries(CHANNEL_FAMILY_MAP)) {
    for (const name of channelNames) {
      const normalizedName = name.toLowerCase().replace(/[^a-z0-9_-]/g, '');
      for (const [chName, chId] of channelNameToId) {
        // Exact match, or channel starts with the pattern + separator (e.g. "flux" matches "flux_gens")
        if (chName === normalizedName || chName.startsWith(normalizedName + '_') || chName.startsWith(normalizedName + '-')) {
          channelIdToFamily.set(chId, family);
        }
      }
    }
  }

  const startDate = firstMsg.data[0]?.created_at?.slice(0, 10) ?? '2022-03-15';
  const endDate = lastMsg.data[0]?.created_at?.slice(0, 10) ?? '2025-01-28';
  const mMsg = millionthMsg.data[0];
  const millionthMessage = mMsg ? {
    author: memberMap.get(mMsg.author_id) || mMsg.author_id,
    channel: channelMap.get(mMsg.channel_id) || mMsg.channel_id,
    content: mMsg.content,
    timestamp: mMsg.created_at,
    avatarUrl: mMsg.author_id ? memberAvatarMap.get(mMsg.author_id) : undefined,
  } : null;

  logLine(`  Total messages: ${totalMessages.toLocaleString()}`);
  logLine(`  Members: ${membersRaw.length}, Channels: ${channelsRaw.length}`);
  logLine(`  Date range: ${startDate} → ${endDate}`);
  logLine(`  Channel families mapped: ${channelIdToFamily.size} channels`);
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

  // Top contributors (with avatar URLs)
  const topContributors = [...acc.authorCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count], i) => ({
      rank: i + 1,
      username: memberMap.get(id) || id,
      messages: count,
      avatar: AVATAR_COLORS[i],
      avatarUrl: memberAvatarMap.get(id),
    }));

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

  // Cumulative messages (sampled weekly)
  const cumulativeMessages: { date: string; cumulative: number }[] = [];
  let runningTotal = 0;
  let daysSinceLastSample = 0;
  for (const [date, count] of sortedDates) {
    runningTotal += count;
    daysSinceLastSample++;
    if (daysSinceLastSample >= 7 || date === sortedDates[sortedDates.length - 1][0]) {
      cumulativeMessages.push({ date, cumulative: runningTotal });
      daysSinceLastSample = 0;
    }
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

  // All-nighter award: user with highest late-night ratio (0-5 AM UTC)
  let allNighterId = '', allNighterMax = 0, allNighterCount = 0;
  for (const [id, lateCount] of acc.authorLateNightCounts) {
    const totalCount = acc.authorCounts.get(id) ?? 0;
    if (totalCount < 100) continue;
    if (!memberMap.has(id)) continue;  // skip users who left the server
    const ratio = lateCount / totalCount;
    if (ratio > allNighterMax) {
      allNighterMax = ratio;
      allNighterId = id;
      allNighterCount = lateCount;
    }
  }
  const allNighter = {
    username: memberMap.get(allNighterId) || allNighterId,
    count: allNighterCount,
    metric: 'late night messages',
  };

  // Model trends (channel-based, percentages)
  const allMonths = new Set<string>();
  const familyMonthCounts = new Map<string, Map<string, number>>();
  const families = ['sd', 'animatediff', 'flux', 'wan', 'cogvideo', 'hunyuan', 'ltx'];
  for (const family of families) {
    familyMonthCounts.set(family, new Map());
  }

  for (const [channelId, monthMap] of acc.channelMonthCounts) {
    const family = channelIdToFamily.get(channelId);
    if (!family) continue;
    const familyMap = familyMonthCounts.get(family)!;
    for (const [month, count] of monthMap) {
      allMonths.add(month);
      familyMap.set(month, (familyMap.get(month) ?? 0) + count);
    }
  }

  const modelTrends = [...allMonths].sort().map(month => {
    const counts: Record<string, number> = {};
    let total = 0;
    for (const family of families) {
      counts[family] = familyMonthCounts.get(family)?.get(month) ?? 0;
      total += counts[family];
    }
    // Convert to percentages
    const pct = (v: number) => total > 0 ? Math.round((v / total) * 1000) / 10 : 0;
    return {
      month,
      sd: pct(counts.sd),
      animatediff: pct(counts.animatediff),
      flux: pct(counts.flux),
      wan: pct(counts.wan),
      cogvideo: pct(counts.cogvideo),
      hunyuan: pct(counts.hunyuan),
      ltx: pct(counts.ltx),
    };
  });

  logLine(`  Phase 2 done ✓\n`);

  // ===== PHASE 3 =====
  logLine('🔍 Phase 3: Gratitude search...');

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

  // ===== PHASE 5 =====
  logLine('🖼️  Phase 5: Top generations (reacted media posts)...');

  // Get date range months
  const startMonth = startDate.slice(0, 7);
  const endMonth = endDate.slice(0, 7);
  const months: string[] = [];
  {
    let cur = startMonth;
    while (cur <= endMonth) {
      months.push(cur);
      const [y, m] = cur.split('-').map(Number);
      const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
      cur = next;
    }
  }

  const topGenerations: any[] = [];
  let monthsDone = 0;
  for (const month of months) {
    const [y, m] = month.split('-').map(Number);
    const nextMonth = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
    const monthStart = `${month}-01T00:00:00`;
    const monthEnd = `${nextMonth}-01T00:00:00`;

    try {
      const { data: posts } = await supabaseFetch<{
        message_id: string;
        author_id: string;
        channel_id: string;
        created_at: string;
        reaction_count: number;
        attachments: any[];
        content: string;
      }>({
        table: 'discord_messages',
        select: 'message_id,author_id,channel_id,created_at,reaction_count,attachments,content',
        filters: `attachments=neq.[]&reaction_count=gte.3&created_at=gte.${monthStart}&created_at=lt.${monthEnd}&channel_id=neq.${UPDATES_CHANNEL_ID}`,
        order: 'reaction_count.desc',
        limit: 5,
      });

      for (const post of posts) {
        if (!post.attachments || post.attachments.length === 0) continue;
        const attachment = post.attachments[0];
        const url = attachment.url || attachment.proxy_url;
        if (!url) continue;
        const contentType = (attachment.content_type || '').toLowerCase();
        let mediaType: 'image' | 'video' | 'gif' = 'image';
        if (contentType.includes('video') || url.endsWith('.mp4') || url.endsWith('.webm')) {
          mediaType = 'video';
        } else if (contentType.includes('gif') || url.endsWith('.gif')) {
          mediaType = 'gif';
        }

        topGenerations.push({
          month,
          message_id: post.message_id,
          author: memberMap.get(post.author_id) || post.author_id,
          avatarUrl: memberAvatarMap.get(post.author_id) || '',
          channel: channelMap.get(post.channel_id) || post.channel_id,
          created_at: post.created_at,
          reaction_count: post.reaction_count,
          mediaUrl: url,
          mediaType,
          content: post.content || '',
        });
      }
    } catch (err) {
      // Skip months that fail
      logLine(`  Warning: Failed to fetch month ${month}: ${err}`);
    }

    monthsDone++;
    log(`  Months: ${monthsDone}/${months.length}`);
  }
  logLine('');
  logLine(`  Found ${topGenerations.length} top generations`);
  logLine(`  Phase 5 done ✓\n`);

  // ===== BUILD FINAL DATA =====
  const appData = {
    totalMessages,
    totalMembers: membersRaw.length,
    totalChannels: channelsRaw.length,
    dateRange: { start: startDate, end: endDate },
    milestones,
    cumulativeMessages,
    topContributors,
    awards: {
      mostHelpful: { username: memberMap.get(helpfulId) || helpfulId, count: helpfulMax, metric: 'helpful replies' },
      mostThankful: { username: memberMap.get(thankId) || thankId, count: thankMax, metric: 'thank yous' },
      nightOwl,
      earlyBird,
      allNighter,
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
    topGenerations,
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
