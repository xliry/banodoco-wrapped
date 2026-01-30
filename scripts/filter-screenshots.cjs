#!/usr/bin/env node
/**
 * One-time script: analyse every non-video top generation with Gemini 2.5 Flash
 * and remove ComfyUI / workflow screenshots from data.json.
 *
 * Usage:
 *   GEMINI_API_KEY=<key> node scripts/filter-screenshots.js
 *
 * Optional flags:
 *   --dry-run    Print results without modifying data.json
 */

const fs = require('fs');
const path = require('path');

let sharp;
try { sharp = require('sharp'); } catch {}

// Load .env file manually (no dotenv dependency needed)
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const match = line.match(/^\s*([^#=]+?)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('Set GEMINI_API_KEY in .env or as env variable.');
  process.exit(1);
}

const DRY_RUN = process.argv.includes('--dry-run');
const DATA_PATH = path.join(__dirname, '..', 'public', 'data.json');
const MODEL = 'gemini-2.5-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

const PROMPT = `You are an image classifier. Look at this image and determine if it is a screenshot of a software UI (for example: ComfyUI node graph, Stable Diffusion WebUI, terminal output, code editor, desktop screenshot, browser window, or any other application screenshot).

Answer with ONLY a JSON object, no markdown:
{"is_screenshot": true/false, "reason": "brief reason"}`;

// ---------- helpers ----------

async function fetchImageAsBase64(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  let buf = Buffer.from(await res.arrayBuffer());
  let mime = res.headers.get('content-type') || 'image/png';

  // Discord CDN may return error pages instead of images
  if (!mime.startsWith('image/')) {
    throw new Error(`Not an image (${mime}) — URL may be expired`);
  }

  // Gemini doesn't support image/gif — convert to PNG via sharp
  if (mime.includes('gif')) {
    if (!sharp) throw new Error('GIF needs sharp: run "npm i -D sharp"');
    buf = await sharp(buf, { animated: false }).png().toBuffer();
    mime = 'image/png';
  }

  return { base64: buf.toString('base64'), mime };
}

async function askGemini(base64, mime) {
  const body = {
    contents: [{
      parts: [
        { text: PROMPT },
        { inline_data: { mime_type: mime, data: base64 } }
      ]
    }],
    generationConfig: { temperature: 0, maxOutputTokens: 256 }
  };

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini API ${res.status}: ${text.substring(0, 200)}`);
  }

  const json = await res.json();
  const raw = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
  // strip markdown fences if present
  const cleaned = raw.replace(/```json\s*/g, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Gemini sometimes truncates output — detect from raw text
    if (raw.includes('"is_screenshot": true') || raw.includes('"is_screenshot":true')) {
      return { is_screenshot: true, reason: 'detected from truncated response' };
    }
    console.warn('  Could not parse response:', raw.substring(0, 120));
    return { is_screenshot: false, reason: 'parse_error' };
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const LOG_PATH = path.join(__dirname, '..', 'filter-results.log');
const logLines = [];
function log(msg) {
  console.log(msg);
  logLines.push(msg);
}
function logWrite(msg) {
  process.stdout.write(msg);
  logLines.push(msg);
}
function saveLog() {
  fs.writeFileSync(LOG_PATH, logLines.join('\n') + '\n');
  console.log(`\nLog saved to: ${LOG_PATH}`);
}

// ---------- main ----------

async function main() {
  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
  const gens = data.topGenerations;
  const statics = gens.filter(g => g.mediaType === 'image' || g.mediaType === 'gif');

  log(`Total generations: ${gens.length}`);
  log(`Non-video to check: ${statics.length}`);
  log(DRY_RUN ? '(dry run — data.json will NOT be modified)\n' : '\n');

  const screenshotIds = new Set();
  const results = [];

  for (let i = 0; i < statics.length; i++) {
    const gen = statics[i];
    const label = `[${i + 1}/${statics.length}] ${gen.month} | ${gen.author} | ${gen.mediaType}`;
    logWrite(`${label} ... `);

    try {
      const { base64, mime } = await fetchImageAsBase64(gen.mediaUrl);
      const result = await askGemini(base64, mime);

      if (result.is_screenshot) {
        screenshotIds.add(gen.message_id);
        log(`SCREENSHOT — ${result.reason}`);
      } else {
        log(`ok — ${result.reason}`);
      }
      results.push({ ...gen, ...result });
    } catch (err) {
      log(`ERROR — ${err.message}`);
      results.push({ ...gen, is_screenshot: false, reason: 'error: ' + err.message });
    }

    // rate-limit: free tier is 30 RPM, 1 per 2s is safe
    if (i < statics.length - 1) await sleep(2500);
  }

  log(`\n--- Results ---`);
  log(`Screenshots found: ${screenshotIds.size}`);

  if (screenshotIds.size === 0) {
    log('Nothing to remove.');
    saveLog();
    return;
  }

  // List them
  for (const id of screenshotIds) {
    const g = gens.find(x => x.message_id === id);
    log(`  - ${g.month} | ${g.author} | ${g.message_id} | ${g.mediaUrl}`);
  }

  if (DRY_RUN) {
    log('\n(dry run — no changes written)');
    saveLog();
    return;
  }

  // Filter and write
  const before = gens.length;
  data.topGenerations = gens.filter(g => !screenshotIds.has(g.message_id));
  const after = data.topGenerations.length;

  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + '\n');
  log(`\ndata.json updated: ${before} → ${after} generations (${before - after} removed)`);
  saveLog();
}

main().catch(err => { console.error(err); process.exit(1); });
