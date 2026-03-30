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

export interface Question {
  id: string;
  askerId: string;
  text: string;
  answer: string | null;
  timestamp: number;
}

export interface Revealed {
  item: Item;
  correct: boolean;
  hotSeatPlayerName: string;
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
  hotSeatPlayerId: string | null;
  item: Item | null;
  iAmOnHotSeat: boolean;
  questionLog: Question[];
  revealed: Revealed | null;
  error: string | null;
}

export type GameAction =
  | { type: 'SESSION_CREATED'; payload: { sessionCode: string; playerId: string; players: Player[] } }
  | { type: 'SESSION_JOINED'; payload: { sessionCode: string; playerId: string; players: Player[] } }
  | { type: 'PLAYER_JOINED'; payload: { players: Player[] } }
  | { type: 'PLAYER_LEFT'; payload: { playerId: string; players: Player[] | null } }
  | { type: 'GAME_STARTED'; payload: { players: Player[] } }
  | { type: 'TURN_STARTED'; payload: { hotSeatPlayerId: string; categoryId?: string; players?: Player[] } }
  | { type: 'ITEM_ASSIGNED'; payload: { item: Item } }
  | { type: 'QUESTION_ASKED'; payload: { question: Question } }
  | { type: 'QUESTION_ANSWERED'; payload: { question: Question } }
  | { type: 'ITEM_REVEALED'; payload: { item: Item; correct: boolean; hotSeatPlayerName: string } }
  | { type: 'SET_MY_NAME'; payload: string }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_PENDING_CODE'; payload: string };
