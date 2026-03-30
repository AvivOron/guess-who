export interface Player {
  id: string;
  name: string;
  isInitiator: boolean;
}

export interface Item {
  id: string;
  name: string;
  categoryId: string;
}

export interface Question {
  id: string;
  askerId: string;
  text: string;
  answer: string | null;
  timestamp: number;
}

export interface Session {
  code: string;
  initiatorId: string;
  phase: 'lobby' | 'playing';
  categoryId: string | null;
  players: Player[];
  currentTurnPlayerId: string | null;
  currentItem: Item | null;
  turnOrder: string[];
  turnIndex: number;
  questionLog: Question[];
  usedItemIds: string[];
}
