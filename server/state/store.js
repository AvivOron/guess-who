import { celebrities } from '../data/celebrities.js';

const sessions = new Map();

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return sessions.has(code) ? generateCode() : code;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createSession(initiatorId, initiatorName) {
  const code = generateCode();
  const session = {
    code,
    initiatorId,
    phase: 'lobby',
    players: new Map(),
    currentTurnPlayerId: null,
    currentCelebrity: null,
    turnOrder: [],
    turnIndex: 0,
    questionLog: [],
    usedCelebrityIds: new Set(),
  };
  session.players.set(initiatorId, { id: initiatorId, name: initiatorName, isInitiator: true });
  sessions.set(code, session);
  return session;
}

export function getSession(code) {
  return sessions.get(code) || null;
}

export function getSessionByPlayerId(playerId) {
  for (const session of sessions.values()) {
    if (session.players.has(playerId)) return session;
  }
  return null;
}

export function joinSession(code, playerId, playerName) {
  const session = sessions.get(code);
  if (!session) return { error: 'סשן לא נמצא' };
  if (session.phase !== 'lobby') return { error: 'המשחק כבר התחיל' };
  if (session.players.size >= 10) return { error: 'הסשן מלא (מקסימום 10 שחקנים)' };
  if ([...session.players.values()].some(p => p.name === playerName)) {
    return { error: 'השם הזה כבר תפוס' };
  }
  session.players.set(playerId, { id: playerId, name: playerName, isInitiator: false });
  return { session };
}

export function startGame(sessionCode) {
  const session = sessions.get(sessionCode);
  if (!session) return null;
  session.phase = 'playing';
  session.turnOrder = shuffle([...session.players.keys()]);
  session.turnIndex = 0;
  session.questionLog = [];
  return session;
}

export function startTurn(sessionCode) {
  const session = sessions.get(sessionCode);
  if (!session) return null;

  const playerId = session.turnOrder[session.turnIndex % session.turnOrder.length];
  session.currentTurnPlayerId = playerId;
  session.questionLog = [];

  // Pick a celebrity not yet used this game
  const available = celebrities.filter(c => !session.usedCelebrityIds.has(c.id));
  const pool = available.length > 0 ? available : celebrities;
  const celebrity = pool[Math.floor(Math.random() * pool.length)];
  session.currentCelebrity = celebrity;
  session.usedCelebrityIds.add(celebrity.id);

  return { session, playerId, celebrity };
}

export function nextTurn(sessionCode) {
  const session = sessions.get(sessionCode);
  if (!session) return null;
  session.turnIndex++;
  return startTurn(sessionCode);
}

export function addQuestion(sessionCode, askerId, text) {
  const session = sessions.get(sessionCode);
  if (!session) return null;
  const question = {
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    askerId,
    text,
    answer: null,
    timestamp: Date.now(),
  };
  session.questionLog.push(question);
  return question;
}

export function answerQuestion(sessionCode, questionId, answer) {
  const session = sessions.get(sessionCode);
  if (!session) return null;
  const question = session.questionLog.find(q => q.id === questionId);
  if (!question) return null;
  question.answer = answer;
  return question;
}

export function removePlayer(playerId) {
  const session = getSessionByPlayerId(playerId);
  if (!session) return null;
  session.players.delete(playerId);
  if (session.players.size === 0) {
    sessions.delete(session.code);
    return { session: null, empty: true };
  }
  // Transfer initiator if needed
  if (session.initiatorId === playerId) {
    const newInitiator = [...session.players.values()][0];
    newInitiator.isInitiator = true;
    session.initiatorId = newInitiator.id;
  }
  return { session };
}

export function getPlayers(session) {
  return [...session.players.values()];
}
