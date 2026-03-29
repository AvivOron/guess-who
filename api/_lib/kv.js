import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const TTL = 60 * 60 * 4; // 4 hours

export async function getSession(code) {
  return redis.get(`session:${code.toUpperCase()}`);
}

export async function saveSession(session) {
  await redis.set(`session:${session.code}`, session, { ex: TTL });
}

export async function getSessionByPlayerId(playerId) {
  const code = await redis.get(`player:${playerId}`);
  if (!code) return null;
  return redis.get(`session:${code}`);
}

export async function setPlayerIndex(playerId, code) {
  await redis.set(`player:${playerId}`, code, { ex: TTL });
}

export async function removePlayerIndex(playerId) {
  await redis.del(`player:${playerId}`);
}
