// serve.ts — a tiny static server for local play. Serves game/ at
// http://localhost:8080 (or $PORT). Node 22 standard library only.

import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const gameDir = resolve(dirname(fileURLToPath(import.meta.url)), 'game');
const port = Number(process.env.PORT ?? 8080);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost');
    let path = url.pathname === '/' ? '/index.html' : url.pathname;
    const file = resolve(gameDir, normalize('.' + path));
    if (!file.startsWith(gameDir)) {
      res.writeHead(403);
      res.end('forbidden');
      return;
    }
    const info = await stat(file);
    if (!info.isFile()) {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    res.writeHead(200, { 'content-type': MIME_TYPES[extname(file)] ?? 'application/octet-stream' });
    createReadStream(file).pipe(res);
  } catch {
    res.writeHead(404);
    res.end('not found');
  }
});

server.listen(port, () => {
  console.log(`Night at Dusk Gallery at http://localhost:${port}`);
});
