#!/usr/bin/env node
import fs from 'node:fs';

function parseArgs(argv) {
  const opts = {
    host: '127.0.0.1',
    port: 9444,
    targetPrefix: 'app://',
    css: null,
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
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!opts.css) {
    throw new Error('Missing --css <path>');
  }
  if (!Number.isFinite(opts.port) || opts.port < 1) {
    throw new Error(`Invalid --port: ${opts.port}`);
  }
  return opts;
}

class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.nextId = 1;
    this.pending = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', (event) => reject(event.error || event), { once: true });
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
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }

  close() {
    try {
      this.ws.close();
    } catch {
      // ignore close failures
    }
  }
}

async function main() {
  if (typeof WebSocket === 'undefined') {
    throw new Error('Node.js 18+ with global WebSocket is required.');
  }

  const opts = parseArgs(process.argv.slice(2));
  const css = fs.readFileSync(opts.css, 'utf8');
  const targets = await fetch(`http://${opts.host}:${opts.port}/json/list`).then((res) => {
    if (!res.ok) throw new Error(`CDP target list failed: ${res.status}`);
    return res.json();
  });

  const target =
    targets.find((item) => item.type === 'page' && String(item.url).startsWith(opts.targetPrefix)) ||
    targets.find((item) => item.type === 'page');

  if (!target?.webSocketDebuggerUrl) {
    throw new Error(`No CDP page target found on ${opts.host}:${opts.port}`);
  }

  const client = new CdpClient(target.webSocketDebuggerUrl);
  await client.connect();
  try {
    await client.send('Runtime.enable');
    await client.send('Page.enable');
    await client.send('Runtime.evaluate', {
      expression: `
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
          return true;
        })()
      `,
      awaitPromise: false,
      returnByValue: true,
    });
  } finally {
    client.close();
  }

  console.log(`Injected ${opts.css} into ${target.url}`);
}

main().catch((error) => {
  console.error(error.stack || String(error));
  process.exit(1);
});
