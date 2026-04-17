import { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { Dispatch } from 'react';
import type { GameState, GameAction } from '../types';
import { categories as defaultCategories } from '../categories';

function normalizeCategories(categories: GameState['availableCategories']): GameState['availableCategories'] {
  return categories.map(category => ({
    ...category,
    items: (category.items ?? []).map(item =>
      typeof item === 'string' ? item : item.name
    ),
  }));
}

const initialState: GameState = {
  view: 'home',
  sessionCode: null,
  myPlayerId: null,
  myName: null,
  isInitiator: false,
  players: [],
  phase: 'lobby',
  categoryId: null,
  availableCategories: defaultCategories,
  selectedCategoryIds: defaultCategories.map(category => category.id),
  hotSeatPlayerId: null,
  item: null,
  iAmOnHotSeat: false,
  questionLog: [],
  turnResult: null,
  error: null,
  groups: [[], []],
  scores: [0, 0],
  guessingGroupIndex: 0,
  timerStartedAt: null,
  iAmGuessing: false,
};

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SESSION_CREATED':
      return {
        ...state,
        view: 'lobby',
        sessionCode: action.payload.sessionCode,
        myPlayerId: action.payload.playerId,
        players: action.payload.players,
        isInitiator: true,
        availableCategories: normalizeCategories(action.payload.availableCategories),
        selectedCategoryIds: action.payload.selectedCategoryIds,
      };

    case 'SESSION_JOINED':
      return {
        ...state,
        view: 'lobby',
        sessionCode: action.payload.sessionCode,
        myPlayerId: action.payload.playerId,
        players: action.payload.players,
        isInitiator: false,
        availableCategories: normalizeCategories(action.payload.availableCategories),
        selectedCategoryIds: action.payload.selectedCategoryIds,
      };

    case 'PLAYER_JOINED':
      return { ...state, players: action.payload.players };

    case 'PLAYER_LEFT': {
      const players = action.payload.players
        ? action.payload.players
        : state.players.filter(p => p.id !== action.payload.playerId);
      return { ...state, players };
    }

    case 'GAME_STARTED': {
      const groups = action.payload.groups;
      return {
        ...state,
        view: 'game',
        phase: 'playing',
        players: action.payload.players,
        availableCategories: action.payload.availableCategories
          ? normalizeCategories(action.payload.availableCategories)
          : state.availableCategories,
        selectedCategoryIds: action.payload.selectedCategoryIds ?? state.selectedCategoryIds,
        groups,
        scores: action.payload.scores,
        guessingGroupIndex: 0,
        questionLog: [],
        turnResult: null,
      };
    }

    case 'TURN_STARTED': {
      const guessingGroupIndex = action.payload.guessingGroupIndex;
      const guessingGroup = state.groups[guessingGroupIndex] ?? [];
      const iAmGuessing = guessingGroup.includes(state.myPlayerId ?? '');
      const iAmOnHotSeat = false; // no individual hot seat in team mode
      return {
        ...state,
        hotSeatPlayerId: null,
        categoryId: action.payload.categoryId ?? state.categoryId,
        item: null,
        iAmOnHotSeat,
        iAmGuessing,
        guessingGroupIndex,
        timerStartedAt: action.payload.timerStartedAt,
        questionLog: [],
        turnResult: null,
        players: action.payload.players ?? state.players,
      };
    }

    case 'SETTINGS_UPDATED':
      return {
        ...state,
        availableCategories: normalizeCategories(action.payload.availableCategories),
        selectedCategoryIds: action.payload.selectedCategoryIds,
      };

    case 'ITEM_ASSIGNED':
      return { ...state, item: action.payload.item };

    case 'QUESTION_ASKED':
      return {
        ...state,
        questionLog: [...state.questionLog, action.payload.question],
      };

    case 'QUESTION_ANSWERED': {
      const log = state.questionLog.map(q =>
        q.id === action.payload.question.id ? action.payload.question : q
      );
      return { ...state, questionLog: log };
    }

    case 'TURN_RESULT':
      return {
        ...state,
        turnResult: action.payload,
        scores: action.payload.scores,
      };

    case 'SET_MY_NAME':
      return { ...state, myName: action.payload };

    case 'SET_PENDING_CODE':
      return state; // handled in HomeView via URL params

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    default:
      return state;
  }
}

interface GameContextValue {
  state: GameState;
  dispatch: Dispatch<GameAction>;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
