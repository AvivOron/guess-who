import { getDefaultCategories } from './categories.js';
import type { Session, Question, Item, Category } from './types.js';

function getPlayableCategories(session: Session): Category[] {
  const selectedIds = new Set(session.selectedCategoryIds);
  return session.availableCategories.filter(category => selectedIds.has(category.id));
}

export function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function createSession(code: string, initiatorId: string, initiatorName: string): Session {
  const availableCategories = getDefaultCategories();
  return {
    code,
    initiatorId,
    phase: 'lobby',
    categoryId: null,
    availableCategories,
    selectedCategoryIds: availableCategories.map(category => category.id),
    players: [{ id: initiatorId, name: initiatorName, isInitiator: true }],
    currentTurnPlayerId: null,
    currentItem: null,
    turnOrder: [],
    turnIndex: 0,
    questionLog: [],
    usedItemIds: [],
    groups: [[], []],
    scores: [0, 0],
    guessingGroupIndex: 0,
    timerStartedAt: null,
  };
}

export function addPlayerToSession(
  session: Session,
  playerId: string,
  playerName: string,
): { session: Session } | { error: string } {
  if (session.phase !== 'lobby') return { error: 'המשחק כבר התחיל' };
  if (session.players.length >= 10) return { error: 'הסשן מלא (מקסימום 10 שחקנים)' };
  if (session.players.some(p => p.name === playerName)) return { error: 'השם הזה כבר תפוס' };
  session.players.push({ id: playerId, name: playerName, isInitiator: false });
  return { session };
}

export function startGame(session: Session): { session: Session } {
  session.phase = 'playing';
  session.categoryId = null;
  session.turnOrder = shuffle(session.players.map(p => p.id));
  session.turnIndex = 0;
  session.questionLog = [];
  session.usedItemIds = [];

  // Split players into two groups
  const shuffled = shuffle(session.players.map(p => p.id));
  const mid = Math.ceil(shuffled.length / 2);
  session.groups = [shuffled.slice(0, mid), shuffled.slice(mid)];
  session.scores = [0, 0];
  session.guessingGroupIndex = 0;

  return { session };
}

export function submitTurnResult(
  session: Session,
  correct: boolean,
): { session: Session } {
  if (correct) {
    session.scores[session.guessingGroupIndex]++;
  }
  // Swap which group guesses next
  session.guessingGroupIndex = session.guessingGroupIndex === 0 ? 1 : 0;
  return { session };
}

export function pickTurn(session: Session): Session {
  const playableCategories = getPlayableCategories(session);
  // Pick a representative from the guessing group as the "hot seat" display player
  const guessingGroup = session.groups[session.guessingGroupIndex];
  const playerId = guessingGroup[session.turnIndex % guessingGroup.length]!;
  session.currentTurnPlayerId = playerId;
  session.timerStartedAt = Date.now();
  session.questionLog = [];

  const categoriesWithFreshItems = playableCategories
    .map(category => ({
      category,
      items: category.items.filter(item => !session.usedItemIds.includes(item.id)),
    }))
    .filter(({ items }) => items.length > 0);

  const categoriesWithFallbackItems = playableCategories
    .map(category => ({
      category,
      items: category.items,
    }))
    .filter(({ items }) => items.length > 0);

  const categoryPool = categoriesWithFreshItems.length > 0
    ? categoriesWithFreshItems
    : categoriesWithFallbackItems;

  if (categoryPool.length === 0) {
    throw new Error('No items available for selected categories');
  }

  const chosenCategory = categoryPool[Math.floor(Math.random() * categoryPool.length)]!;
  const chosenItem = chosenCategory.items[Math.floor(Math.random() * chosenCategory.items.length)]!;
  const item: Item = { ...chosenItem, categoryId: chosenCategory.category.id };

  session.currentItem = item;
  session.categoryId = item.categoryId;
  session.usedItemIds.push(item.id);

  return session;
}

export function addQuestion(
  session: Session,
  askerId: string,
  text: string,
): { session: Session; question: Question } {
  const question: Question = {
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    askerId,
    text,
    answer: null,
    timestamp: Date.now(),
  };
  session.questionLog.push(question);
  return { session, question };
}

export function answerQuestion(
  session: Session,
  questionId: string,
  answer: string,
): { session: Session; question: Question } | { error: string } {
  const question = session.questionLog.find(q => q.id === questionId);
  if (!question) return { error: 'שאלה לא נמצאה' };
  question.answer = answer;
  return { session, question };
}

export function removePlayer(session: Session, playerId: string): Session {
  session.players = session.players.filter(p => p.id !== playerId);
  if (session.players.length > 0 && session.initiatorId === playerId) {
    session.players[0]!.isInitiator = true;
    session.initiatorId = session.players[0]!.id;
  }
  return session;
}
