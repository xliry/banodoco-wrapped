#!/usr/bin/env node
/**
 * One-time script: backfill months that have fewer than 5 top generations
 * after screenshot removal. Fetches next-best posts from Supabase,
 * skipping already-present and known-screenshot IDs.
 *
 * Usage:
 *   node scripts/backfill-generations.cjs
 *   node scripts/backfill-generations.cjs --dry-run
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://ujlwuvkrxlvoswwkerdf.supabase.co/rest/v1';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHd1dmtyeGx2b3N3d2tlcmRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNzcyMzcsImV4cCI6MjA4MjczNzIzN30.XSTztghf_6a_bpR62wZdoA4S4oafJFDMoPQDRR4dT08';
const UPDATES_CHANNEL_ID = '1138790534987661363';
const TARGET_PER_MONTH = 5;
const DRY_RUN = process.argv.includes('--dry-run');
const DATA_PATH = path.join(__dirname, '..', 'public', 'data.json');

const HEADERS = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

// Screenshot IDs that were removed (never re-add these)
const SCREENSHOT_IDS = new Set([
  1145130416651653100,
  1145918673933062300,
  1155840360321392600,
  1199468887356494000,
  1196177599244812500,
  1191670659579904000,
  1223884885098496000,
  1225500258901954600,
  1236415929135665200,
  1254104642091221000,
  1263125263680667600,
  1273680876651286500,
  1313232523408572700,
  1320321241717932000,
  1362402734862762200,
  1384931026740056000,
  1385091877786878000,
  1415103162959790000,
  1415103589428236300,
  1442307931012857900,
  1461374045231517700,
]);

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function supaFetch(table, query) {
  const url = `${SUPABASE_URL}/${table}?${query}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { headers: HEADERS });
    if (res.status === 429) { await sleep(2 ** attempt * 1000); continue; }
    if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
    return res.json();
  }
  throw new Error('fetch failed after retries');
}

async function supaFetchAll(table, select) {
  const all = [];
  let offset = 0;
  while (true) {
    const data = await supaFetch(table, `select=${select}&limit=1000&offset=${offset}`);
    all.push(...data);
    if (data.length < 1000) break;
    offset += 1000;
  }
  return all;
}

async function main() {
  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
  const gens = data.topGenerations;

  // Find months that need backfilling
  const monthCounts = {};
  const existingIds = new Set();
  for (const g of gens) {
    monthCounts[g.month] = (monthCounts[g.month] || 0) + 1;
    existingIds.add(g.message_id);
  }

  const deficit = Object.entries(monthCounts)
    .filter(([, count]) => count < TARGET_PER_MONTH)
    .map(([month, count]) => ({ month, have: count, need: TARGET_PER_MONTH - count }));

  if (deficit.length === 0) {
    console.log('All months already have 5 entries.');
    return;
  }

  console.log(`Months to backfill: ${deficit.length}`);
  deficit.forEach(d => console.log(`  ${d.month}: ${d.have}/5 (need ${d.need})`));
  console.log();

  // Fetch member + channel maps
  console.log('Fetching members...');
  const members = await supaFetchAll(
    'discord_members',
    'member_id::text,username,global_name,server_nick,avatar_url'
  );
  const memberMap = new Map();
  const avatarMap = new Map();
  for (const m of members) {
    memberMap.set(m.member_id, m.server_nick || m.global_name || m.username);
    if (m.avatar_url) avatarMap.set(m.member_id, m.avatar_url);
  }

  console.log('Fetching channels...');
  const channels = await supaFetch(
    'discord_channels',
    'select=channel_id::text,channel_name&limit=5000'
  );
  const channelMap = new Map();
  for (const c of channels) channelMap.set(c.channel_id, `#${c.channel_name}`);

  // Backfill each month
  let totalAdded = 0;
  for (const { month, need } of deficit) {
    const [y, m] = month.split('-').map(Number);
    const nextMonth = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;

    // Fetch more candidates (limit 20 to have enough after filtering)
    const posts = await supaFetch(
      'discord_messages',
      `select=message_id,author_id::text,channel_id::text,created_at,reaction_count,attachments,content` +
      `&attachments=neq.[]&reaction_count=gte.3` +
      `&created_at=gte.${month}-01T00:00:00&created_at=lt.${nextMonth}-01T00:00:00` +
      `&channel_id=neq.${UPDATES_CHANNEL_ID}` +
      `&order=reaction_count.desc&limit=20`
    );

    let added = 0;
    for (const post of posts) {
      if (added >= need) break;
      if (existingIds.has(post.message_id)) continue;
      if (SCREENSHOT_IDS.has(post.message_id)) continue;
      if (!post.attachments?.length) continue;

      const att = post.attachments[0];
      const url = att.url || att.proxy_url;
      if (!url) continue;

      const ct = (att.content_type || '').toLowerCase();
      let mediaType = 'image';
      if (ct.includes('video') || url.endsWith('.mp4') || url.endsWith('.webm')) mediaType = 'video';
      else if (ct.includes('gif') || url.endsWith('.gif')) mediaType = 'gif';

      const entry = {
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
      };

      gens.push(entry);
      existingIds.add(post.message_id);
      added++;
      console.log(`  + ${month} | ${entry.author} | ${entry.reaction_count} reactions | ${mediaType}`);
    }

    if (added < need) {
      console.log(`  ! ${month}: only found ${added}/${need} replacements (not enough qualifying posts)`);
    }
    totalAdded += added;

    await sleep(300);
  }

  console.log(`\nTotal new entries: ${totalAdded}`);

  if (DRY_RUN) {
    console.log('(dry run — no changes written)');
    return;
  }

  data.topGenerations = gens;
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`data.json updated: ${gens.length} total generations`);
}

main().catch(err => { console.error(err); process.exit(1); });
