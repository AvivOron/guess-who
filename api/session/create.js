import { kv } from '@vercel/kv';
import { createSession, generateCode } from '../_lib/gameLogic.js';
import { saveSession, setPlayerIndex } from '../_lib/kv.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { playerName } = req.body;
  if (!playerName?.trim()) return res.status(400).json({ error: 'נדרש שם שחקן' });

  // Generate a unique code
  let code;
  for (let i = 0; i < 10; i++) {
    const candidate = generateCode();
    const existing = await kv.get(`session:${candidate}`);
    if (!existing) { code = candidate; break; }
  }
  if (!code) return res.status(500).json({ error: 'לא ניתן ליצור קוד ייחודי' });

  const playerId = `p_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const session = createSession(code, playerId, playerName.trim());

  await saveSession(session);
  await setPlayerIndex(playerId, code);

  return res.status(200).json({ sessionCode: code, playerId, players: session.players });
}
