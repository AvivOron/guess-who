import { kv } from '@vercel/kv';

const TTL = 60 * 60 * 4; // 4 hours

export async function getSession(code) {
  return kv.get(`session:${code.toUpperCase()}`);
}

export async function saveSession(session) {
  await kv.set(`session:${session.code}`, session, { ex: TTL });
}

export async function getSessionByPlayerId(playerId) {
  const code = await kv.get(`player:${playerId}`);
  if (!code) return null;
  return kv.get(`session:${code}`);
}

export async function setPlayerIndex(playerId, code) {
  await kv.set(`player:${playerId}`, code, { ex: TTL });
}

export async function removePlayerIndex(playerId) {
  await kv.del(`player:${playerId}`);
}
