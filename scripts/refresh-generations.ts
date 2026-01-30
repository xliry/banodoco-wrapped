
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://ujlwuvkrxlvoswwkerdf.supabase.co/rest/v1';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHd1dmtyeGx2b3N3d2tlcmRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNzcyMzcsImV4cCI6MjA4MjczNzIzN30.XSTztghf_6a_bpR62wZdoA4S4oafJFDMoPQDRR4dT08';
const UPDATES_CHANNEL_ID = '1138790534987661363';

const BASE_HEADERS: Record<string, string> = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function supaFetch<T>(table: string, query: string): Promise<T[]> {
  const url = `${SUPABASE_URL}/${table}?${query}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { headers: BASE_HEADERS });
    if (res.status === 429) { await sleep(2 ** attempt * 1000); continue; }
    if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
    return res.json();
  }
  throw new Error('fetch failed');
}

async function supaFetchAll<T>(table: string, select: string): Promise<T[]> {
  const all: T[] = [];
  let offset = 0;
  const pageSize = 1000;
  while (true) {
    const data = await supaFetch<T>(table, `select=${select}&limit=${pageSize}&offset=${offset}`);
    all.push(...data);
    if (data.length < pageSize) break;
    offset += pageSize;
  }
  return all;
}

async function main() {
  console.log('🖼️  Refreshing top generations with fresh media URLs...\n');

  // Load existing data.json
  const dataPath = path.resolve(__dirname, '..', 'public', 'data.json');
  const appData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  // Fetch all members for name/avatar lookup (paginated — Supabase caps at 1000/page)
  const members = await supaFetchAll<{
    member_id: string; username: string; global_name: string | null;
    server_nick: string | null; avatar_url: string | null;
  }>('discord_members', 'member_id::text,username,global_name,server_nick,avatar_url');

  const memberMap = new Map<string, string>();
  const avatarMap = new Map<string, string>();
  for (const m of members) {
    memberMap.set(m.member_id, m.server_nick || m.global_name || m.username);
    if (m.avatar_url) avatarMap.set(m.member_id, m.avatar_url);
  }

  // Fetch channels
  const channels = await supaFetch<{ channel_id: string; channel_name: string }>(
    'discord_channels', 'select=channel_id::text,channel_name&limit=5000'
  );
  const channelMap = new Map<string, string>();
  for (const c of channels) channelMap.set(c.channel_id, `#${c.channel_name}`);

  // Get month range from existing data
  const startDate = appData.dateRange?.start || '2023-08-01';
  const endDate = appData.dateRange?.end || '2026-01-30';
  const startMonth = startDate.slice(0, 7);
  const endMonth = endDate.slice(0, 7);

  const months: string[] = [];
  let cur = startMonth;
  while (cur <= endMonth) {
    months.push(cur);
    const [y, m] = cur.split('-').map(Number);
    cur = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
  }

  // Fetch top generations per month (fresh URLs)
  const topGenerations: any[] = [];
  for (let i = 0; i < months.length; i++) {
    const month = months[i];
    const [y, m] = month.split('-').map(Number);
    const nextMonth = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;

    try {
      const posts = await supaFetch<{
        message_id: string; author_id: string; channel_id: string;
        created_at: string; reaction_count: number; attachments: any[]; content: string;
      }>(
        'discord_messages',
        `select=message_id,author_id::text,channel_id::text,created_at,reaction_count,attachments,content` +
        `&attachments=neq.[]&reaction_count=gte.3` +
        `&created_at=gte.${month}-01T00:00:00&created_at=lt.${nextMonth}-01T00:00:00` +
        `&channel_id=neq.${UPDATES_CHANNEL_ID}` +
        `&order=reaction_count.desc&limit=5`
      );

      for (const post of posts) {
        if (!post.attachments?.length) continue;
        const att = post.attachments[0];
        const url = att.url || att.proxy_url;
        if (!url) continue;
        const ct = (att.content_type || '').toLowerCase();
        let mediaType: 'image' | 'video' | 'gif' = 'image';
        if (ct.includes('video') || url.endsWith('.mp4') || url.endsWith('.webm')) mediaType = 'video';
        else if (ct.includes('gif') || url.endsWith('.gif')) mediaType = 'gif';

        topGenerations.push({
          month,
          message_id: post.message_id,
          author: memberMap.get(post.author_id) || String(post.author_id),
          avatarUrl: avatarMap.get(post.author_id) || '',
          channel: channelMap.get(post.channel_id) || post.channel_id,
          created_at: post.created_at,
          reaction_count: post.reaction_count,
          mediaUrl: url,
          mediaType,
          content: post.content || '',
        });
      }
    } catch (err) {
      console.warn(`  ⚠ Month ${month} failed: ${err}`);
    }

    process.stdout.write(`\r  Months: ${i + 1}/${months.length}`);
  }

  console.log(`\n\n  Found ${topGenerations.length} generations across ${months.length} months`);

  // Patch data.json
  appData.topGenerations = topGenerations;
  fs.writeFileSync(dataPath, JSON.stringify(appData, null, 2));

  console.log(`  ✅ Updated public/data.json (${(fs.statSync(dataPath).size / 1024).toFixed(1)} KB)\n`);
}

main().catch(err => { console.error('❌', err); process.exit(1); });
