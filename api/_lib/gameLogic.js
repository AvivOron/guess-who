import { categories, getCategoryById } from './categories.js';

export function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createSession(code, initiatorId, initiatorName) {
  return {
    code,
    initiatorId,
    phase: 'lobby',
    categoryId: null,
    players: [{ id: initiatorId, name: initiatorName, isInitiator: true }],
    currentTurnPlayerId: null,
    currentItem: null,
    turnOrder: [],
    turnIndex: 0,
    questionLog: [],
    usedItemIds: [],
  };
}

export function addPlayerToSession(session, playerId, playerName) {
  if (session.phase !== 'lobby') return { error: 'המשחק כבר התחיל' };
  if (session.players.length >= 10) return { error: 'הסשן מלא (מקסימום 10 שחקנים)' };
  if (session.players.some(p => p.name === playerName)) return { error: 'השם הזה כבר תפוס' };
  session.players.push({ id: playerId, name: playerName, isInitiator: false });
  return { session };
}

export function startGame(session) {
  session.phase = 'playing';
  session.categoryId = null;
  session.turnOrder = shuffle(session.players.map(p => p.id));
  session.turnIndex = 0;
  session.questionLog = [];
  session.usedItemIds = [];
  return { session };
}

export function pickTurn(session) {
  const playerId = session.turnOrder[session.turnIndex % session.turnOrder.length];
  session.currentTurnPlayerId = playerId;
  session.questionLog = [];

  // Pick a random category, then a random unused item from it
  const available = categories.flatMap(cat =>
    cat.items
      .filter(i => !session.usedItemIds.includes(i.id))
      .map(i => ({ ...i, categoryId: cat.id }))
  );
  const pool = available.length > 0 ? available : categories.flatMap(cat =>
    cat.items.map(i => ({ ...i, categoryId: cat.id }))
  );
  const item = pool[Math.floor(Math.random() * pool.length)];
  session.currentItem = item;
  session.categoryId = item.categoryId;
  session.usedItemIds.push(item.id);

  return session;
}

export function addQuestion(session, askerId, text) {
  const question = {
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    askerId,
    text,
    answer: null,
    timestamp: Date.now(),
  };
  session.questionLog.push(question);
  return { session, question };
}

export function answerQuestion(session, questionId, answer) {
  const question = session.questionLog.find(q => q.id === questionId);
  if (!question) return { error: 'שאלה לא נמצאה' };
  question.answer = answer;
  return { session, question };
}

export function removePlayer(session, playerId) {
  session.players = session.players.filter(p => p.id !== playerId);
  if (session.players.length > 0 && session.initiatorId === playerId) {
    session.players[0].isInitiator = true;
    session.initiatorId = session.players[0].id;
  }
  return session;
}
