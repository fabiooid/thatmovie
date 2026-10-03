import { existsSync, createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join } from 'node:path';
import { getRequestListener } from '@hono/node-server';
import './load-env.ts';
import { app } from './app.ts';

const port = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';
const apiListener = getRequestListener(app.fetch);

const MIME: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const isApiRequest = (url = '') => url.split('?')[0]?.startsWith('/api/') ?? false;

if (isProd) {
  const dist = join(process.cwd(), 'dist');

  createServer((req, res) => {
    if (isApiRequest(req.url)) {
      apiListener(req, res);
      return;
    }

    const url = new URL(req.url ?? '/', 'http://127.0.0.1');
    let filePath = join(dist, decodeURIComponent(url.pathname));

    if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
      filePath = join(dist, 'index.html');
    }

    res.setHeader(
      'Content-Type',
      MIME[extname(filePath)] ?? 'application/octet-stream',
    );
    createReadStream(filePath).pipe(res);
  }).listen(port, () => {
    console.log(`That Movie is running at http://localhost:${port}`);
  });
} else {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  createServer((req, res) => {
    if (isApiRequest(req.url)) {
      apiListener(req, res);
      return;
    }

    vite.middlewares(req, res);
  }).listen(port, () => {
    console.log(`That Movie is running at http://localhost:${port}`);
  });
}
