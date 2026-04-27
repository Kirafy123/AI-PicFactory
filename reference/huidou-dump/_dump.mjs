// CDP dumper: pulls all loaded scripts/styles/html from the WebView via Chrome DevTools Protocol
// Usage: node _dump.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = __dirname;
const SRC_DIR = path.join(OUT, 'sources');
fs.mkdirSync(SRC_DIR, { recursive: true });

const targets = await (await fetch('http://localhost:9222/json')).json();
const page = targets.find(t => t.type === 'page');
if (!page) throw new Error('no page target');
console.log('page:', page.title, page.url);

const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const send = (method, params = {}) => new Promise((res, rej) => {
  const mid = ++id;
  pending.set(mid, { res, rej });
  ws.send(JSON.stringify({ id: mid, method, params }));
});

const events = [];
ws.addEventListener('message', e => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) {
    const { res, rej } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
  } else if (msg.method) {
    events.push(msg);
  }
});

await new Promise(r => ws.addEventListener('open', r, { once: true }));
console.log('connected');

await send('Debugger.enable');
await send('Page.enable');
await send('Network.enable');
await send('Runtime.enable');

// Wait for scripts to be reported
await new Promise(r => setTimeout(r, 2500));

const scripts = events.filter(e => e.method === 'Debugger.scriptParsed').map(e => e.params);
console.log('scripts seen:', scripts.length);

const safeName = (url) => {
  try {
    const u = new URL(url);
    let p = u.pathname;
    if (!p || p === '/') p = '/index.html';
    return path.join(u.hostname || 'inline', p).replace(/[?#].*$/, '');
  } catch {
    return path.join('inline', String(url).replace(/[^\w.-]/g, '_').slice(0, 80));
  }
};

const saved = [];
for (const s of scripts) {
  if (!s.url || s.url.startsWith('chrome-extension://') || s.url.startsWith('devtools://')) continue;
  if (s.url === '' || s.url.startsWith('wasm://')) continue;
  try {
    const { scriptSource } = await send('Debugger.getScriptSource', { scriptId: s.scriptId });
    if (!scriptSource) continue;
    const rel = safeName(s.url);
    const full = path.join(SRC_DIR, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, scriptSource, 'utf8');
    saved.push({ url: s.url, file: rel, size: scriptSource.length, hasSourceMap: !!s.sourceMapURL, sourceMapURL: s.sourceMapURL });
  } catch (err) {
    console.warn('skip', s.url, err.message);
  }
}

// Also fetch top-level HTML & try to enumerate stylesheets/resources via Page.getResourceTree
try {
  const tree = await send('Page.getResourceTree');
  const walk = async (frame) => {
    for (const r of frame.resources || []) {
      if (!/^https?:\/\/|^http:\/\//.test(r.url) && !r.url.startsWith('http://tauri')) continue;
      try {
        const { content, base64Encoded } = await send('Page.getResourceContent', { frameId: frame.frame.id, url: r.url });
        const rel = safeName(r.url);
        const full = path.join(SRC_DIR, rel);
        fs.mkdirSync(path.dirname(full), { recursive: true });
        fs.writeFileSync(full, base64Encoded ? Buffer.from(content, 'base64') : content);
        saved.push({ url: r.url, file: rel, type: r.type, size: (content || '').length });
      } catch (err) {
        // skip
      }
    }
    for (const child of frame.childFrames || []) await walk(child);
  };
  await walk(tree.frameTree);
} catch (err) {
  console.warn('resource tree failed:', err.message);
}

fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(saved, null, 2));
console.log('saved files:', saved.length);

// Extract Tauri invoke commands from all JS
const invokeSet = new Set();
const eventSet = new Set();
const re = /invoke\s*\(\s*['"`]([\w:.-]+)['"`]/g;
const evRe = /(?:listen|emit)\s*\(\s*['"`]([\w:.-]+)['"`]/g;
for (const s of saved) {
  const f = path.join(SRC_DIR, s.file);
  if (!fs.existsSync(f)) continue;
  let txt;
  try { txt = fs.readFileSync(f, 'utf8'); } catch { continue; }
  for (const m of txt.matchAll(re)) invokeSet.add(m[1]);
  for (const m of txt.matchAll(evRe)) eventSet.add(m[1]);
}
fs.writeFileSync(path.join(OUT, 'tauri-commands.txt'), [...invokeSet].sort().join('\n'));
fs.writeFileSync(path.join(OUT, 'tauri-events.txt'), [...eventSet].sort().join('\n'));
console.log('invoke commands:', invokeSet.size, '| events:', eventSet.size);

ws.close();
process.exit(0);
