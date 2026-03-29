import { getSessionByPlayerId } from './_lib/kv.js';
import { pusher } from './_lib/pusher.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { socket_id, channel_name, playerId } = req.body;
  if (!socket_id || !channel_name || !playerId) {
    return res.status(400).json({ error: 'Missing required fields' });
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
