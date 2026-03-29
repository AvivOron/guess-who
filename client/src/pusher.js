import Pusher from 'pusher-js';

const listeners = new Map();

function emit(type, payload) {
  (listeners.get(type) || []).forEach(fn => fn(payload));
}

export function on(type, fn) {
  if (!listeners.has(type)) listeners.set(type, []);
  listeners.get(type).push(fn);
  return () => {
    listeners.set(type, (listeners.get(type) || []).filter(f => f !== fn));
  };
}

// ── Pusher client ──────────────────────────────────────────────────────────

let pusherClient = null;
let playerId = null;
let sessionCode = null;
let presenceChannel = null;
let privateChannel = null;

function getPusher() {
  if (!pusherClient) {
    pusherClient = new Pusher(import.meta.env.VITE_PUSHER_KEY, {
      cluster: import.meta.env.VITE_PUSHER_CLUSTER,
      // Use a custom authorizer so we can include playerId at subscription time
      authorizer: (channel) => ({
        authorize: (socketId, callback) => {
          const params = new URLSearchParams({
            socket_id: socketId,
            channel_name: channel.name,
            playerId: playerId || '',
          });
          fetch('/api/pusher-auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
          })
            .then(r => r.json())
            .then(data => {
              if (data.error) callback(new Error(data.error), null);
              else callback(null, data);
            })
            .catch(err => callback(err, null));
        },
      }),
    });
  }
  return pusherClient;
}

export function connectToPusher(pid, code) {
  playerId = pid;
  sessionCode = code;

  const client = getPusher();

  // Unsubscribe from previous channels if any
  if (presenceChannel) client.unsubscribe(presenceChannel.name);
  if (privateChannel) client.unsubscribe(privateChannel.name);

  presenceChannel = client.subscribe(`presence-session-${code}`);
  privateChannel  = client.subscribe(`private-player-${pid}`);

  presenceChannel.bind('pusher:subscription_error', err => {
    console.error('Presence channel auth error:', err);
    emit('ERROR', { message: 'שגיאת חיבור לשרת – נסה לרענן את הדף' });
  });

  const presenceEvents = [
    'PLAYER_JOINED', 'GAME_STARTED', 'TURN_STARTED',
    'QUESTION_ASKED', 'QUESTION_ANSWERED', 'CELEBRITY_REVEALED',
  ];
  presenceEvents.forEach(name => {
    presenceChannel.bind(name, payload => emit(name, payload));
  });

  privateChannel.bind('CELEBRITY_ASSIGNED', payload => emit('CELEBRITY_ASSIGNED', payload));

  presenceChannel.bind('pusher:member_removed', member => {
    emit('PLAYER_LEFT', { playerId: member.id, players: null });
  });
}

// ── HTTP-based send ────────────────────────────────────────────────────────

const ROUTES = {
  CREATE_SESSION:  '/api/session/create',
  JOIN_SESSION:    '/api/session/join',
  START_GAME:      '/api/game/start',
  ASK_QUESTION:    '/api/game/ask',
  ANSWER_QUESTION: '/api/game/answer',
  REVEAL_GUESS:    '/api/game/reveal',
  NEXT_TURN:       '/api/game/next-turn',
};

export async function send(type, payload = {}) {
  const route = ROUTES[type];
  if (!route) return;

  const body = { ...payload, playerId, sessionCode };

  let data;
  try {
    const res = await fetch(route, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    data = await res.json();
  } catch (err) {
    emit('ERROR', { message: 'שגיאת רשת – נסה שוב' });
    return;
  }

  if (data.error) {
    emit('ERROR', { message: data.error });
    return;
  }

  // Direct response events (no Pusher broadcast for the sender)
  if (type === 'CREATE_SESSION') {
    playerId = data.playerId;
    sessionCode = data.sessionCode;
    connectToPusher(data.playerId, data.sessionCode);
    emit('SESSION_CREATED', data);
  }
  if (type === 'JOIN_SESSION') {
    playerId = data.playerId;
    sessionCode = data.sessionCode;
    connectToPusher(data.playerId, data.sessionCode);
    emit('SESSION_JOINED', data);
  }
}
