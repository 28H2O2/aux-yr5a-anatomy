import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const mime = {'.html':'text/html; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.md':'text/plain; charset=utf-8'};
createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const relative = pathname.endsWith('/') ? pathname + 'index.html' : pathname;
    const target = resolve(root, '.' + relative);
    if (!target.startsWith(root + sep)) { response.writeHead(403).end(); return; }
    const data = await readFile(target);
    response.writeHead(200, {'Content-Type': mime[extname(target)] ?? 'application/octet-stream'});
    response.end(data);
  } catch { response.writeHead(404).end('Not found'); }
}).listen(8080, '127.0.0.1', () => console.log('Preview: http://127.0.0.1:8080'));
