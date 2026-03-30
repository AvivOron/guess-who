import { getSession, saveSession } from '../_lib/kv.js';
import { startGame, pickTurn } from '../_lib/gameLogic.js';
import { pusher } from '../_lib/pusher.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { sessionCode, playerId, categoryId } = req.body;
  const session = await getSession(sessionCode);
  if (!session) return res.status(404).json({ error: 'סשן לא נמצא' });
  if (session.initiatorId !== playerId) return res.status(403).json({ error: 'רק מארגן המשחק יכול להתחיל' });
  if (session.players.length < 2) return res.status(400).json({ error: 'נדרשים לפחות 2 שחקנים' });
  if (!categoryId) return res.status(400).json({ error: 'נדרש לבחור קטגוריה' });

  const result = startGame(session, categoryId);
  if (result.error) return res.status(400).json({ error: result.error });

  pickTurn(session);
  await saveSession(session);

  await pusher.trigger(`presence-session-${sessionCode}`, 'GAME_STARTED', {
    turnOrder: session.turnOrder,
    players: session.players,
    categoryId: session.categoryId,
  });

  await broadcastTurn(session);

  return res.status(200).json({ ok: true });
}

export async function broadcastTurn(session) {
  await pusher.trigger(`presence-session-${session.code}`, 'TURN_STARTED', {
    hotSeatPlayerId: session.currentTurnPlayerId,
    players: session.players,
  });

  const batch = session.players
    .filter(p => p.id !== session.currentTurnPlayerId)
    .map(p => ({
      channel: `private-player-${p.id}`,
      name: 'ITEM_ASSIGNED',
      data: JSON.stringify({ item: session.currentItem }),
    }));

  if (batch.length > 0) await pusher.triggerBatch(batch);
}
