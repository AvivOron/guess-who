import { getSession, saveSession } from '../_lib/kv.js';
import { addQuestion } from '../_lib/gameLogic.js';
import { pusher } from '../_lib/pusher.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { sessionCode, playerId, text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'שאלה ריקה' });

  const session = await getSession(sessionCode);
  if (!session) return res.status(404).json({ error: 'סשן לא נמצא' });
  if (session.currentTurnPlayerId !== playerId) {
    return res.status(403).json({ error: 'רק השחקן הנוכחי יכול לשאול שאלה' });
  }
  if (session.questionLog.length >= 10) {
    return res.status(400).json({ error: 'הגעת למגבלת 10 שאלות לתור' });
  }

  const { question } = addQuestion(session, playerId, text.trim());
  await saveSession(session);

  const askerName = session.players.find(p => p.id === playerId)?.name;
  await pusher.trigger(`presence-session-${sessionCode}`, 'QUESTION_ASKED', {
    question,
    askerName,
  });

  return res.status(200).json({ ok: true });
}
