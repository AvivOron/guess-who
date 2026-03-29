import { getSession, saveSession } from '../_lib/kv.js';
import { pickTurn } from '../_lib/gameLogic.js';
import { broadcastTurn } from './start.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { sessionCode, playerId } = req.body;
  const session = await getSession(sessionCode);
  if (!session) return res.status(404).json({ error: 'סשן לא נמצא' });
  if (session.initiatorId !== playerId) return res.status(403).json({ error: 'רק מארגן המשחק יכול להמשיך' });

  session.turnIndex++;
  pickTurn(session);
  await saveSession(session);

  await broadcastTurn(session);

  return res.status(200).json({ ok: true });
}
