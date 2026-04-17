import http, { IncomingMessage, ServerResponse } from 'http';
import { pathToFileURL } from 'url';
import path from 'path';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const PORT = 3000;
const API_DIR = path.resolve('./api');

const routes: Record<string, string> = {
  'POST /api/session/create':  `${API_DIR}/session/create.ts`,
  'POST /api/session/join':    `${API_DIR}/session/join.ts`,
  'POST /api/session/update-settings': `${API_DIR}/session/update-settings.ts`,
  'POST /api/game/start':      `${API_DIR}/game/start.ts`,
  'POST /api/game/ask':        `${API_DIR}/game/ask.ts`,
  'POST /api/game/answer':     `${API_DIR}/game/answer.ts`,
  'POST /api/game/reveal':         `${API_DIR}/game/reveal.ts`,
  'POST /api/game/submit-result':  `${API_DIR}/game/submit-result.ts`,
  'POST /api/game/next-turn':      `${API_DIR}/game/next-turn.ts`,
  'POST /api/pusher-auth':     `${API_DIR}/pusher-auth.ts`,
};

function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk: Buffer) => (data += chunk));
    req.on('end', () => {
      const ct = req.headers['content-type'] ?? '';
      try {
        if (ct.includes('application/json'))
          resolve(JSON.parse(data || '{}'));
        else if (ct.includes('application/x-www-form-urlencoded'))
          resolve(Object.fromEntries(new URLSearchParams(data)));
        else resolve({});
      } catch {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

function makeRes(res: ServerResponse): VercelResponse {
  let statusCode = 200;
  const extraHeaders: Record<string, string> = {};
  const mock = {
    status(code: number) { statusCode = code; return mock; },
    setHeader(k: string, v: string) { extraHeaders[k] = v; return mock; },
    json(data: unknown) {
      res.writeHead(statusCode, { 'Content-Type': 'application/json', ...extraHeaders });
      res.end(JSON.stringify(data));
    },
    send(data: unknown) {
      res.writeHead(statusCode, extraHeaders);
      res.end(data as string);
    },
    end(data?: string) {
      res.writeHead(statusCode, extraHeaders);
      res.end(data ?? '');
    },
  } as unknown as VercelResponse;
  return mock;
}

const server = http.createServer(async (req: IncomingMessage, res: ServerResponse) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const url = (req.url ?? '/').replace(/^\/guess-who/, '') || '/';
  const key = `${req.method} ${url.split('?')[0]}`;
  const handlerFile = routes[key];

  if (!handlerFile) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `No handler for ${key}` }));
    return;
  }

  try {
    (req as VercelRequest).body = await readBody(req);
    const mod = await import(`${pathToFileURL(handlerFile)}?t=${Date.now()}`);
    await (mod.default as (req: VercelRequest, res: VercelResponse) => Promise<void>)(
      req as VercelRequest,
      makeRes(res),
    );
  } catch (err) {
    console.error(`[${key}]`, err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: (err as Error).message }));
  }
});

server.listen(PORT, () => {
  console.log(`API dev server running at http://localhost:${PORT}`);
});
