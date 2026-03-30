import Pusher from 'pusher-js';

type Listener = (payload: unknown) => void;
const listeners = new Map<string, Listener[]>();

function emit(type: string, payload: unknown) {
  (listeners.get(type) ?? []).forEach(fn => fn(payload));
}

export function on(type: string, fn: Listener): () => void {
  if (!listeners.has(type)) listeners.set(type, []);
  listeners.get(type)!.push(fn);
  return () => {
    listeners.set(type, (listeners.get(type) ?? []).filter(f => f !== fn));
  };
}

// ── Pusher client ──────────────────────────────────────────────────────────

let pusherClient: Pusher | null = null;
let playerId: string | null = null;
let sessionCode: string | null = null;
let presenceChannel: ReturnType<Pusher['subscribe']> | null = null;
let privateChannel: ReturnType<Pusher['subscribe']> | null = null;

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

function getPusher(): Pusher {
  if (!pusherClient) {
    pusherClient = new Pusher(import.meta.env.VITE_PUSHER_KEY as string, {
      cluster: import.meta.env.VITE_PUSHER_CLUSTER as string,
      authorizer: (channel) => ({
        authorize: (socketId, callback) => {
          const params = new URLSearchParams({
            socket_id: socketId,
            channel_name: channel.name,
            playerId: playerId ?? '',
          });
          fetch(`${BASE}/api/pusher-auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
          })
            .then(r => r.json())
            .then((data: { error?: string }) => {
              if (data.error) callback(new Error(data.error), null);
              else callback(null, data as Parameters<typeof callback>[1]);
            })
            .catch(err => callback(err as Error, null));
        },
      }),
    });
  }
  return pusherClient;
}

export function connectToPusher(pid: string, code: string) {
  playerId = pid;
  sessionCode = code;

  const client = getPusher();

  if (presenceChannel) client.unsubscribe(presenceChannel.name);
  if (privateChannel) client.unsubscribe(privateChannel.name);

  presenceChannel = client.subscribe(`presence-session-${code}`);
  privateChannel  = client.subscribe(`private-player-${pid}`);

  presenceChannel.bind('pusher:subscription_error', (err: unknown) => {
    console.error('Presence channel auth error:', err);
    emit('ERROR', { message: 'שגיאת חיבור לשרת – נסה לרענן את הדף' });
  });

  const presenceEvents = [
    'PLAYER_JOINED', 'GAME_STARTED', 'TURN_STARTED',
    'QUESTION_ASKED', 'QUESTION_ANSWERED', 'ITEM_REVEALED',
  ];
  presenceEvents.forEach(name => {
    presenceChannel!.bind(name, (payload: unknown) => emit(name, payload));
  });

  privateChannel.bind('ITEM_ASSIGNED', (payload: unknown) => emit('ITEM_ASSIGNED', payload));

  presenceChannel.bind('pusher:member_removed', (member: { id: string }) => {
    emit('PLAYER_LEFT', { playerId: member.id, players: null });
  });
}

// ── HTTP-based send ────────────────────────────────────────────────────────

export type SendType =
  | 'CREATE_SESSION'
  | 'JOIN_SESSION'
  | 'START_GAME'
  | 'ASK_QUESTION'
  | 'ANSWER_QUESTION'
  | 'REVEAL_GUESS'
  | 'NEXT_TURN';

const ROUTES: Record<SendType, string> = {
  CREATE_SESSION:  `${BASE}/api/session/create`,
  JOIN_SESSION:    `${BASE}/api/session/join`,
  START_GAME:      `${BASE}/api/game/start`,
  ASK_QUESTION:    `${BASE}/api/game/ask`,
  ANSWER_QUESTION: `${BASE}/api/game/answer`,
  REVEAL_GUESS:    `${BASE}/api/game/reveal`,
  NEXT_TURN:       `${BASE}/api/game/next-turn`,
};

export async function send(type: SendType, payload: Record<string, unknown> = {}) {
  const route = ROUTES[type];
  const body = { ...payload, playerId, sessionCode };

  let data: Record<string, unknown>;
  try {
    const res = await fetch(route, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    data = await res.json() as Record<string, unknown>;
  } catch {
    emit('ERROR', { message: 'שגיאת רשת – נסה שוב' });
    return;
  }

  if (data.error) {
    emit('ERROR', { message: data.error });
    return;
  }

  if (type === 'CREATE_SESSION') {
    playerId = data.playerId as string;
    sessionCode = data.sessionCode as string;
    connectToPusher(data.playerId as string, data.sessionCode as string);
    emit('SESSION_CREATED', data);
  }
  if (type === 'JOIN_SESSION') {
    playerId = data.playerId as string;
    sessionCode = data.sessionCode as string;
    connectToPusher(data.playerId as string, data.sessionCode as string);
    emit('SESSION_JOINED', data);
  }
}
