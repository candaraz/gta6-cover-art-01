// Vice Cover Studio — screenshot runner (v5).
// Serves app/ on a local port, opens each shot from shots.json in headless
// Chrome over CDP (Node 22's built-in WebSocket, no dependencies), waits for
// the app to signal ready, captures a JPEG, and shrinks quality until it
// fits the 256 KiB cap. Exits non-zero if any page error was logged.
//
//   node src/shots.js [port] [chrome]
// Defaults: port 8123, chrome from CHROME env or the puppeteer cache.

import { createServer } from 'node:http';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = resolve(here, '..', '..');
const appDir = join(repoRoot, 'app');
const shotsFile = join(repoRoot, 'shots.json');
const outDir = join(repoRoot, 'screenshots');
const port = Number(process.argv[2] || 8123);
const chrome =
  process.env.CHROME ||
  `${process.env.HOME}/.cache/puppeteer/chrome/linux-156.0.8078.47/chrome-linux64/chrome`;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.txt': 'text/plain; charset=utf-8',
};

function serve() {
  return new Promise((resolveServer) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url || '/', 'http://localhost');
      let p = decodeURIComponent(url.pathname);
      if (p.endsWith('/')) p += 'index.html';
      const file = join(appDir, p);
      if (!file.startsWith(appDir) || !existsSync(file)) {
        res.writeHead(404).end('not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
      res.end(readFileSync(file));
    });
    server.listen(port, () => resolveServer(server));
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url) {
  const res = await fetch(url);
  return res.json();
}

class CDP {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.pending = new Map();
    this.events = [];
    this.ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      } else if (msg.method) {
        this.events.push(msg);
      }
    };
  }
  ready() {
    return new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });
  }
  send(method, params) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params: params || {} }));
    });
  }
  close() { this.ws.close(); }
}

async function shootOne(cdp, shot) {
  const url = `http://localhost:${port}/index.html${shot.query}`;
  await cdp.send('Page.navigate', { url });
  // Wait for the app to signal ready.
  const deadline = Date.now() + 30000;
  let ready = false;
  while (Date.now() < deadline) {
    const r = await cdp.send('Runtime.evaluate', {
      expression: `document.body && document.body.dataset.ready === '1'`,
      returnByValue: true,
    });
    if (r.result && r.result.value) { ready = true; break; }
    await sleep(250);
  }
  if (!ready) throw new Error(`shot ${shot.name}: app never signalled ready`);
  await sleep(400);
  // Any page errors?
  const errors = cdp.events.filter(
    (e) => (e.method === 'Runtime.exceptionThrown') ||
      (e.method === 'Runtime.consoleAPICalled' && e.params.type === 'error') ||
      (e.method === 'Log.entryAdded' && e.params.entry.level === 'error'),
  );
  const messages = errors.map((e) => JSON.stringify(e.params).slice(0, 300));
  let quality = 82;
  let data = null;
  // Aim a little under the 256 KiB cap so a re-encode never tips it over.
  const TARGET = 258048;
  for (let attempt = 0; attempt < 5; attempt++) {
    const shot2 = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality });
    data = Buffer.from(shot2.data, 'base64');
    if (data.length <= TARGET) break;
    quality -= 12;
  }
  return { data, quality, errors: messages };
}

async function main() {
  const shots = JSON.parse(readFileSync(shotsFile, 'utf8'));
  mkdirSync(outDir, { recursive: true });
  const server = await serve();
  const debugPort = 9333;
  const chromeProc = spawn(chrome, [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
    `--remote-debugging-port=${debugPort}`, '--window-size=1280,720',
    'about:blank',
  ], { stdio: 'ignore' });
  let code = 0;
  try {
    let targets = null;
    for (let i = 0; i < 50; i++) {
      await sleep(200);
      try { targets = await getJson(`http://localhost:${debugPort}/json/list`); break; } catch { /* not up yet */ }
    }
    if (!targets) throw new Error('chrome devtools did not come up');
    const page = targets.find((t) => t.type === 'page');
    const cdp = new CDP(page.webSocketDebuggerUrl);
    await cdp.ready();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Log.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
    for (const shot of shots) {
      // The canvas renders at the export size, but the viewport (and so the
      // captured screenshot) is scaled to fit the 1280 long-side cap.
      const scale = Math.min(1, 1280 / Math.max(shot.w, shot.h));
      const vw = Math.round(shot.w * scale), vh = Math.round(shot.h * scale);
      await cdp.send('Emulation.setDeviceMetricsOverride', { width: vw, height: vh, deviceScaleFactor: 1, mobile: false });
      cdp.events.length = 0;
      const { data, quality, errors } = await shootOne(cdp, shot);
      const out = join(outDir, shot.name);
      writeFileSync(out, data);
      console.log(`${shot.name}: ${shot.w}x${shot.h} quality=${quality} bytes=${data.length}${errors.length ? ` ERRORS: ${errors.join(' | ')}` : ''}`);
      if (errors.length) code = 1;
      if (data.length > 262144) { console.error(`${shot.name}: OVER 256 KiB`); code = 1; }
    }
    cdp.close();
  } finally {
    chromeProc.kill('SIGKILL');
    server.close();
  }
  process.exit(code);
}

main().catch((e) => { console.error(e); process.exit(1); });
