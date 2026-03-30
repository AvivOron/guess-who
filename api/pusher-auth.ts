import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSessionByPlayerId } from './_lib/kv.js';
import { pusher } from './_lib/pusher.js';
import { parse } from 'querystring';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  let body = req.body as Record<string, string> | string | undefined;
  if (typeof body === 'string') {
    body = parse(body) as Record<string, string>;
  }
  if (!body || !(body as Record<string, string>).socket_id) {
    const raw = await new Promise<string>((resolve) => {
      let data = '';
      req.on('data', (chunk: Buffer) => { data += chunk; });
      req.on('end', () => resolve(data));
    });
    body = parse(raw) as Record<string, string>;
  }

  const { socket_id, channel_name, playerId } = body as Record<string, string>;

  if (!socket_id || !channel_name || !playerId) {
    return res.status(400).json({ error: 'Missing required fields', got: JSON.stringify(body) });
  }

  const session = await getSessionByPlayerId(playerId);
  if (!session) return res.status(403).json({ error: 'Not in session' });

  const player = session.players.find(p => p.id === playerId);
  if (!player) return res.status(403).json({ error: 'Player not found' });

  const auth = pusher.authorizeChannel(socket_id, channel_name, {
    user_id: playerId,
    user_info: { name: player.name },
  });

  return res.status(200).json(auth);
}
