import { getSession, saveSession, setPlayerIndex } from '../_lib/kv.js';
import { addPlayerToSession } from '../_lib/gameLogic.js';
import { pusher } from '../_lib/pusher.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { code, playerName } = req.body;
  if (!code?.trim() || !playerName?.trim()) {
    return res.status(400).json({ error: 'נדרש קוד סשן ושם שחקן' });
  }

  const session = await getSession(code.trim().toUpperCase());
  if (!session) return res.status(404).json({ error: 'סשן לא נמצא' });

  const playerId = `p_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const result = addPlayerToSession(session, playerId, playerName.trim());
  if (result.error) return res.status(400).json({ error: result.error });

  await saveSession(result.session);
  await setPlayerIndex(playerId, result.session.code);

  await pusher.trigger(`presence-session-${result.session.code}`, 'PLAYER_JOINED', {
    player: { id: playerId, name: playerName.trim(), isInitiator: false },
    players: result.session.players,
  });

  return res.status(200).json({
    sessionCode: result.session.code,
    playerId,
    players: result.session.players,
    phase: result.session.phase,
  });
}
