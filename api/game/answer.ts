import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSession, saveSession } from '../_lib/kv.js';
import { answerQuestion } from '../_lib/gameLogic.js';
import { pusher } from '../_lib/pusher.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { sessionCode, playerId, questionId, answer } = req.body as {
    sessionCode?: string;
    playerId?: string;
    questionId?: string;
    answer?: string;
  };

  if (!['כן', 'לא', 'אולי'].includes(answer ?? '')) {
    return res.status(400).json({ error: 'תשובה לא חוקית' });
  }

  const session = await getSession(sessionCode ?? '');
  if (!session) return res.status(404).json({ error: 'סשן לא נמצא' });
  if (session.currentTurnPlayerId === playerId) {
    return res.status(403).json({ error: 'אתה לא יכול לענות על שאלות שלך' });
  }

  const result = answerQuestion(session, questionId ?? '', answer!);
  if ('error' in result) return res.status(404).json({ error: result.error });

  await saveSession(session);

  await pusher.trigger(`presence-session-${sessionCode}`, 'QUESTION_ANSWERED', {
    question: result.question,
  });

  return res.status(200).json({ ok: true });
}
