import { getSession } from '../_lib/kv.js';
import { pusher } from '../_lib/pusher.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { sessionCode, playerId, correct } = req.body;
  const session = await getSession(sessionCode);
  if (!session) return res.status(404).json({ error: 'סשן לא נמצא' });
  if (session.initiatorId !== playerId) return res.status(403).json({ error: 'רק מארגן המשחק יכול לגלות' });

  const hotSeatPlayerName = session.players.find(p => p.id === session.currentTurnPlayerId)?.name;

  await pusher.trigger(`presence-session-${sessionCode}`, 'CELEBRITY_REVEALED', {
    celebrity: session.currentCelebrity,
    correct: !!correct,
    hotSeatPlayerId: session.currentTurnPlayerId,
    hotSeatPlayerName,
  });

  return res.status(200).json({ ok: true });
}
