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

export interface CategoryItem {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  items: CategoryItem[];
  isCustom?: boolean;
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
  availableCategories: Category[];
  selectedCategoryIds: string[];
  players: Player[];
  currentTurnPlayerId: string | null;
  currentItem: Item | null;
  turnOrder: string[];
  turnIndex: number;
  questionLog: Question[];
  usedItemIds: string[];
  // Team mode fields
  groups: [string[], string[]]; // [groupA playerIds, groupB playerIds]
  scores: [number, number];     // [groupA score, groupB score]
  guessingGroupIndex: 0 | 1;    // which group is currently guessing
  timerStartedAt: number | null; // ms timestamp when current turn timer started
}
