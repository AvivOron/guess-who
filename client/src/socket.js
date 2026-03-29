// Singleton WebSocket with event emitter pattern

const listeners = new Map();
let ws = null;
let socketId = null;

function getWsUrl() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = import.meta.env.VITE_WS_HOST || window.location.host;
  return `${protocol}//${host}/ws`;
}

export function connect() {
  if (ws && ws.readyState === WebSocket.OPEN) return;

  ws = new WebSocket(getWsUrl());

  ws.onopen = () => {
    console.log('WS connected');
  };

  ws.onmessage = (event) => {
    try {
      const { type, payload } = JSON.parse(event.data);
      if (type === 'CONNECTED') {
        socketId = payload.socketId;
      }
      const handlers = listeners.get(type) || [];
      handlers.forEach(fn => fn(payload));
      const allHandlers = listeners.get('*') || [];
      allHandlers.forEach(fn => fn({ type, payload }));
    } catch (e) {
      console.error('WS parse error', e);
    }
  };

  ws.onclose = () => {
    console.log('WS closed, reconnecting in 2s...');
    setTimeout(connect, 2000);
  };

  ws.onerror = (err) => {
    console.error('WS error', err);
  };
}

export function send(type, payload = {}) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, payload }));
  } else {
    console.warn('WS not connected, queuing...', type);
    setTimeout(() => send(type, payload), 500);
  }
}

export function on(type, fn) {
  if (!listeners.has(type)) listeners.set(type, []);
  listeners.get(type).push(fn);
  return () => off(type, fn);
}

export function off(type, fn) {
  const fns = listeners.get(type) || [];
  listeners.set(type, fns.filter(f => f !== fn));
}

export function getSocketId() {
  return socketId;
}
