import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createSession, generateCode } from '../_lib/gameLogic.js';
import { getSession, saveSession, setPlayerIndex } from '../_lib/kv.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { playerName } = req.body as { playerName?: string };
  if (!playerName?.trim()) return res.status(400).json({ error: 'נדרש שם שחקן' });

  let code: string | undefined;
  for (let i = 0; i < 10; i++) {
    const candidate = generateCode();
    const existing = await getSession(candidate);
    if (!existing) { code = candidate; break; }
  }
  if (!code) return res.status(500).json({ error: 'לא ניתן ליצור קוד ייחודי' });

  const playerId = `p_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const session = createSession(code, playerId, playerName.trim());

  await saveSession(session);
  await setPlayerIndex(playerId, code);

  return res.status(200).json({ sessionCode: code, playerId, players: session.players });
}
