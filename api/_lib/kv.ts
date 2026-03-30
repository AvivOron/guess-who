import { Redis } from '@upstash/redis';
import type { Session } from './types.js';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const TTL = 60 * 60 * 4; // 4 hours

export async function getSession(code: string): Promise<Session | null> {
  return redis.get<Session>(`session:${code.toUpperCase()}`);
}

export async function saveSession(session: Session): Promise<void> {
  await redis.set(`session:${session.code}`, session, { ex: TTL });
}

export async function getSessionByPlayerId(playerId: string): Promise<Session | null> {
  const code = await redis.get<string>(`player:${playerId}`);
  if (!code) return null;
  return redis.get<Session>(`session:${code}`);
}

export async function setPlayerIndex(playerId: string, code: string): Promise<void> {
  await redis.set(`player:${playerId}`, code, { ex: TTL });
}

export async function removePlayerIndex(playerId: string): Promise<void> {
  await redis.del(`player:${playerId}`);
}
