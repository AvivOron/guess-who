import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSession, saveSession } from '../_lib/kv.js';
import { startGame, pickTurn } from '../_lib/gameLogic.js';
import { pusher } from '../_lib/pusher.js';
import type { Session } from '../_lib/types.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { sessionCode, playerId } = req.body as { sessionCode?: string; playerId?: string };
  const session = await getSession(sessionCode ?? '');
  if (!session) return res.status(404).json({ error: 'סשן לא נמצא' });
  if (session.initiatorId !== playerId) return res.status(403).json({ error: 'רק מארגן המשחק יכול להתחיל' });
  if (session.players.length < 4) return res.status(400).json({ error: 'נדרשים לפחות 4 שחקנים לחלוקה לשתי קבוצות' });
  if (session.selectedCategoryIds.length === 0) return res.status(400).json({ error: 'צריך לבחור לפחות קטגוריה אחת' });

  startGame(session);
  try {
    pickTurn(session);
  } catch {
    return res.status(400).json({ error: 'אין מילים זמינות בקטגוריות שנבחרו' });
  }
  await saveSession(session);

  await pusher.trigger(`presence-session-${sessionCode}`, 'GAME_STARTED', {
    players: session.players,
    availableCategories: session.availableCategories,
    selectedCategoryIds: session.selectedCategoryIds,
    groups: session.groups,
    scores: session.scores,
  });

  await broadcastTurn(session);

  return res.status(200).json({ ok: true });
}

export async function broadcastTurn(session: Session) {
  await pusher.trigger(`presence-session-${session.code}`, 'TURN_STARTED', {
    categoryId: session.categoryId,
    players: session.players,
    guessingGroupIndex: session.guessingGroupIndex,
    timerStartedAt: session.timerStartedAt,
  });

  // Send item only to the answering group (they know the word, guessing group must not see it)
  const answeringGroupIndex = session.guessingGroupIndex === 0 ? 1 : 0;
  const answeringGroupIds = new Set(session.groups[answeringGroupIndex]);
  const batch = session.players
    .filter(p => answeringGroupIds.has(p.id))
    .map(p => ({
      channel: `private-player-${p.id}`,
      name: 'ITEM_ASSIGNED',
      data: JSON.stringify({ item: session.currentItem }),
    }));

  if (batch.length > 0) await pusher.triggerBatch(batch);
}
