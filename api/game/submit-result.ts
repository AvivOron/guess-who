import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSession, saveSession } from '../_lib/kv.js';
import { submitTurnResult } from '../_lib/gameLogic.js';
import { pusher } from '../_lib/pusher.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { sessionCode, playerId, correct } = req.body as {
    sessionCode?: string;
    playerId?: string;
    correct?: boolean;
  };
  const session = await getSession(sessionCode ?? '');
  if (!session) return res.status(404).json({ error: 'סשן לא נמצא' });

  // Any player in the answering group can submit the result (they know the word)
  const answeringGroupIndex = session.guessingGroupIndex === 0 ? 1 : 0;
  const answeringGroup = session.groups[answeringGroupIndex];
  if (!answeringGroup?.includes(playerId ?? '')) {
    return res.status(403).json({ error: 'רק הקבוצה שיודעת את המילה יכולה לדווח על תוצאה' });
  }

  const item = session.currentItem;
  const guessingGroupIndex = session.guessingGroupIndex;

  submitTurnResult(session, !!correct);
  await saveSession(session);

  await pusher.trigger(`presence-session-${sessionCode}`, 'TURN_RESULT', {
    item,
    correct: !!correct,
    guessingGroupIndex,
    scores: session.scores,
  });

  return res.status(200).json({ ok: true });
}
