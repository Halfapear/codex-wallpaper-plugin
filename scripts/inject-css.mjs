#!/usr/bin/env node
import fs from 'node:fs';

function parseArgs(argv) {
  const opts = {
    host: '127.0.0.1',
    port: 9444,
    targetPrefix: 'app://',
    css: null,
    removeStyle: false,
    status: false,
    timeoutMs: 5000,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === '--host') {
      opts.host = next;
      i++;
    } else if (arg === '--port') {
      opts.port = Number(next);
      i++;
    } else if (arg === '--target-prefix') {
      opts.targetPrefix = next;
      i++;
    } else if (arg === '--css') {
      opts.css = next;
      i++;
    } else if (arg === '--remove-style') {
      opts.removeStyle = true;
    } else if (arg === '--status') {
      opts.status = true;
    } else if (arg === '--timeout-ms') {
      opts.timeoutMs = Number(next);
      i++;
    } else if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!opts.css && !opts.removeStyle && !opts.status) {
    throw new Error('Missing action. Use --css <path>, --remove-style, or --status.');
  }
  if (!Number.isFinite(opts.port) || opts.port < 1) {
    throw new Error(`Invalid --port: ${opts.port}`);
  }
  if (!Number.isFinite(opts.timeoutMs) || opts.timeoutMs < 1000) {
    throw new Error(`Invalid --timeout-ms: ${opts.timeoutMs}`);
  }
  return opts;
}

function printUsage() {
  console.log(`Usage:
  node scripts/inject-css.mjs --css <path> [--port 9444]
  node scripts/inject-css.mjs --remove-style [--port 9444]
  node scripts/inject-css.mjs --status [--port 9444]

Options:
  --host <host>              CDP host. Default: 127.0.0.1
  --port <port>              CDP port. Default: 9444
  --target-prefix <prefix>   Target page URL prefix. Default: app://
  --timeout-ms <ms>          Connection timeout. Default: 5000
`);
}

async function fetchJson(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`Timed out connecting to ${url}`);
    }
    throw new Error(`Could not connect to ${url}: ${error.message}`);
  } finally {
    clearTimeout(timer);
  }
}

class CdpClient {
  constructor(wsUrl, timeoutMs) {
    this.wsUrl = wsUrl;
    this.timeoutMs = timeoutMs;
    this.nextId = 1;
    this.pending = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timed out connecting to ${this.wsUrl}`)), this.timeoutMs);
      this.ws.addEventListener(
        'open',
        () => {
          clearTimeout(timer);
          resolve();
        },
        { once: true },
      );
      this.ws.addEventListener(
        'error',
        (event) => {
          clearTimeout(timer);
          reject(event.error || event);
        },
        { once: true },
      );
    });

    this.ws.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data));
      if (!message.id || !this.pending.has(message.id)) return;
      const pending = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(JSON.stringify(message.error)));
      else pending.resolve(message.result || {});
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP method timed out: ${method}`));
      }, this.timeoutMs);
      this.pending.set(id, {
        resolve: (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        },
      });
    });
  }

  close() {
    try {
      this.ws.close();
    } catch {
      // ignore close failures
    }
  }
}

function selectPageTargets(targets, targetPrefix) {
  const matchingPages = targets.filter((item) => item.type === 'page' && String(item.url).startsWith(targetPrefix));
  if (matchingPages.length) return matchingPages;
  return targets.filter((item) => item.type === 'page');
}

async function evaluateOnTarget(target, opts, expression) {
  const client = new CdpClient(target.webSocketDebuggerUrl, opts.timeoutMs);
  await client.connect();
  try {
    await client.send('Runtime.enable');
    await client.send('Page.enable');
    const result = await client.send('Runtime.evaluate', {
      expression,
      awaitPromise: false,
      returnByValue: true,
    });
    return result.result.value;
  } finally {
    client.close();
  }
}

async function main() {
  if (typeof WebSocket === 'undefined') {
    throw new Error('Node.js 22+ with built-in WebSocket support is required.');
  }

  const opts = parseArgs(process.argv.slice(2));
  const css = opts.css ? fs.readFileSync(opts.css, 'utf8') : '';
  const targets = await fetchJson(`http://${opts.host}:${opts.port}/json/list`, opts.timeoutMs);

  const pageTargets = selectPageTargets(targets, opts.targetPrefix).filter((target) => target.webSocketDebuggerUrl);

  if (!pageTargets.length) {
    throw new Error(`No CDP page target found on ${opts.host}:${opts.port}`);
  }

  if (opts.status) {
    const expression = `
          (() => {
            const style = document.getElementById('codex-wallpaper-plugin-style');
            return {
              target: location.href,
              active: Boolean(style),
              cssBytes: style ? style.textContent.length : 0,
              marker: document.documentElement.dataset.codexWallpaperPlugin || null
            };
          })()
        `;
    const results = [];
    for (const target of pageTargets) {
      results.push(await evaluateOnTarget(target, opts, expression));
    }
    const activeCount = results.filter((result) => result.active).length;
    console.log(
      JSON.stringify(
        {
          active: activeCount > 0 && activeCount === results.length,
          activeCount,
          targetCount: results.length,
          targets: results,
        },
        null,
        2,
      ),
    );
    return;
  }

  const expression = opts.removeStyle
    ? `
          (() => {
            document.getElementById('codex-wallpaper-plugin-style')?.remove();
            delete document.documentElement.dataset.codexWallpaperPlugin;
            return { removed: true, target: location.href };
          })()
        `
    : `
          (() => {
            const id = 'codex-wallpaper-plugin-style';
            let style = document.getElementById(id);
            if (!style) {
              style = document.createElement('style');
              style.id = id;
              document.documentElement.appendChild(style);
            }
            style.textContent = ${JSON.stringify(css)};
            document.documentElement.dataset.codexWallpaperPlugin = 'active';
            return { injected: true, cssBytes: style.textContent.length, target: location.href };
          })()
        `;

  const results = [];
  for (const target of pageTargets) {
    results.push(await evaluateOnTarget(target, opts, expression));
  }
  console.log(
    JSON.stringify(
      {
        [opts.removeStyle ? 'removed' : 'injected']: true,
        targetCount: results.length,
        targets: results,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error.message || String(error));
  console.error(`Hint: start Codex Desktop with --remote-debugging-address=127.0.0.1 --remote-debugging-port=<port>.`);
  process.exit(1);
});
