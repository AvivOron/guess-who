import { getSessionByPlayerId } from './_lib/kv.js';
import { pusher } from './_lib/pusher.js';
import { parse } from 'querystring';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Pusher sends auth as application/x-www-form-urlencoded
  // Vercel may or may not parse it automatically — handle both cases
  let body = req.body;
  if (typeof body === 'string') {
    body = parse(body);
  }
  // If body is empty (Vercel didn't parse urlencoded), read raw stream
  if (!body || !body.socket_id) {
    const raw = await new Promise((resolve) => {
      let data = '';
      req.on('data', chunk => { data += chunk; });
      req.on('end', () => resolve(data));
    });
    body = parse(raw);
  }

  const { socket_id, channel_name, playerId } = body;

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
