// Twin Vistas — a tiny static server for playing the game locally.
//   node serve.ts        then open http://localhost:8080
// It serves only the game/ folder, one file at a time, nothing else.

import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('./game/', import.meta.url));
const port = Number(process.env.PORT ?? 8080);

const contentTypes: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.json': 'application/json',
};

createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const wanted = url.pathname === '/' ? '/index.html' : url.pathname;
    const file = normalize(join(root, wanted));
    if (!file.startsWith(root)) throw new Error('outside game/');
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': contentTypes[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found');
  }
}).listen(port, () => {
  console.log(`Twin Vistas at http://localhost:${port}`);
});
