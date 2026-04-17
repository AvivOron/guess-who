export interface Player {
  id: string;
  name: string;
  isInitiator: boolean;
}

export interface Item {
  id: string;
  name: string;
  categoryId?: string;
}

export interface CategoryWord {
  id?: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  items?: Array<string | CategoryWord>;
  isCustom?: boolean;
}

export interface Question {
  id: string;
  askerId: string;
  text: string;
  answer: string | null;
  timestamp: number;
}

export interface TurnResult {
  item: Item;
  correct: boolean;
  guessingGroupIndex: 0 | 1;
  scores: [number, number];
}

export type View = 'home' | 'lobby' | 'game';
export type Phase = 'lobby' | 'playing';

export interface GameState {
  view: View;
  sessionCode: string | null;
  myPlayerId: string | null;
  myName: string | null;
  isInitiator: boolean;
  players: Player[];
  phase: Phase;
  categoryId: string | null;
  availableCategories: Category[];
  selectedCategoryIds: string[];
  hotSeatPlayerId: string | null;
  item: Item | null;
  iAmOnHotSeat: boolean;
  questionLog: Question[];
  turnResult: TurnResult | null;
  error: string | null;
  // Team mode
  groups: [string[], string[]];
  scores: [number, number];
  guessingGroupIndex: 0 | 1;
  timerStartedAt: number | null;
  iAmGuessing: boolean; // am I in the guessing group this turn
}

export type GameAction =
  | { type: 'SESSION_CREATED'; payload: { sessionCode: string; playerId: string; players: Player[]; availableCategories: Category[]; selectedCategoryIds: string[] } }
  | { type: 'SESSION_JOINED'; payload: { sessionCode: string; playerId: string; players: Player[]; availableCategories: Category[]; selectedCategoryIds: string[] } }
  | { type: 'PLAYER_JOINED'; payload: { players: Player[] } }
  | { type: 'PLAYER_LEFT'; payload: { playerId: string; players: Player[] | null } }
  | { type: 'GAME_STARTED'; payload: { players: Player[]; availableCategories?: Category[]; selectedCategoryIds?: string[]; groups: [string[], string[]]; scores: [number, number] } }
  | { type: 'TURN_STARTED'; payload: { categoryId?: string; players?: Player[]; guessingGroupIndex: 0 | 1; timerStartedAt: number } }
  | { type: 'SETTINGS_UPDATED'; payload: { availableCategories: Category[]; selectedCategoryIds: string[] } }
  | { type: 'ITEM_ASSIGNED'; payload: { item: Item } }
  | { type: 'QUESTION_ASKED'; payload: { question: Question } }
  | { type: 'QUESTION_ANSWERED'; payload: { question: Question } }
  | { type: 'TURN_RESULT'; payload: TurnResult }
  | { type: 'SET_MY_NAME'; payload: string }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_PENDING_CODE'; payload: string };
