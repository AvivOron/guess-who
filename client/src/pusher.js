import Pusher from 'pusher-js';
const listeners = new Map();
function emit(type, payload) {
    (listeners.get(type) ?? []).forEach(fn => fn(payload));
}
export function on(type, fn) {
    if (!listeners.has(type))
        listeners.set(type, []);
    listeners.get(type).push(fn);
    return () => {
        listeners.set(type, (listeners.get(type) ?? []).filter(f => f !== fn));
    };
}
// ── Pusher client ──────────────────────────────────────────────────────────
let pusherClient = null;
let playerId = null;
let sessionCode = null;
let presenceChannel = null;
let privateChannel = null;
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
function getPusher() {
    if (!pusherClient) {
        pusherClient = new Pusher(import.meta.env.VITE_PUSHER_KEY, {
            cluster: import.meta.env.VITE_PUSHER_CLUSTER,
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
                        .then((data) => {
                        if (data.error)
                            callback(new Error(data.error), null);
                        else
                            callback(null, data);
                    })
                        .catch(err => callback(err, null));
                },
            }),
        });
    }
    return pusherClient;
}
function resubscribe() {
    if (!playerId || !sessionCode) return;
    const client = getPusher();
    // Force reconnect if the socket dropped while in background
    if (client.connection.state !== 'connected') {
        client.connect();
    }
    if (presenceChannel)
        client.unsubscribe(presenceChannel.name);
    if (privateChannel)
        client.unsubscribe(privateChannel.name);
    presenceChannel = client.subscribe(`presence-session-${sessionCode}`);
    privateChannel = client.subscribe(`private-player-${playerId}`);
    presenceChannel.bind('pusher:subscription_error', (err) => {
        console.error('Presence channel auth error:', err);
        emit('ERROR', { message: 'שגיאת חיבור לשרת – נסה לרענן את הדף' });
    });
    const presenceEvents = [
        'PLAYER_JOINED', 'GAME_STARTED', 'TURN_STARTED',
        'QUESTION_ASKED', 'QUESTION_ANSWERED', 'ITEM_REVEALED',
    ];
    presenceEvents.forEach(name => {
        presenceChannel.bind(name, (payload) => emit(name, payload));
    });
    privateChannel.bind('ITEM_ASSIGNED', (payload) => emit('ITEM_ASSIGNED', payload));
    presenceChannel.bind('pusher:member_removed', (member) => {
        emit('PLAYER_LEFT', { playerId: member.id, players: null });
    });
}
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        resubscribe();
    }
});
export function connectToPusher(pid, code) {
    playerId = pid;
    sessionCode = code;
    resubscribe();
}
const ROUTES = {
    CREATE_SESSION: `${BASE}/api/session/create`,
    JOIN_SESSION: `${BASE}/api/session/join`,
    START_GAME: `${BASE}/api/game/start`,
    ASK_QUESTION: `${BASE}/api/game/ask`,
    ANSWER_QUESTION: `${BASE}/api/game/answer`,
    REVEAL_GUESS: `${BASE}/api/game/reveal`,
    NEXT_TURN: `${BASE}/api/game/next-turn`,
};
export async function send(type, payload = {}) {
    const route = ROUTES[type];
    const body = { ...payload, playerId, sessionCode };
    let data;
    try {
        const res = await fetch(route, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        data = await res.json();
    }
    catch {
        emit('ERROR', { message: 'שגיאת רשת – נסה שוב' });
        return;
    }
    if (data.error) {
        emit('ERROR', { message: data.error });
        return;
    }
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
