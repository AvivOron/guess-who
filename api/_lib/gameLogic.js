import { celebrities } from './celebrities.js';

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
    players: [{ id: initiatorId, name: initiatorName, isInitiator: true }],
    currentTurnPlayerId: null,
    currentCelebrity: null,
    turnOrder: [],
    turnIndex: 0,
    questionLog: [],
    usedCelebrityIds: [],
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
  session.turnOrder = shuffle(session.players.map(p => p.id));
  session.turnIndex = 0;
  session.questionLog = [];
  return session;
}

export function pickTurn(session) {
  const playerId = session.turnOrder[session.turnIndex % session.turnOrder.length];
  session.currentTurnPlayerId = playerId;
  session.questionLog = [];

  const available = celebrities.filter(c => !session.usedCelebrityIds.includes(c.id));
  const pool = available.length > 0 ? available : celebrities;
  const celebrity = pool[Math.floor(Math.random() * pool.length)];
  session.currentCelebrity = celebrity;
  session.usedCelebrityIds.push(celebrity.id);

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
