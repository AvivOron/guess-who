import React, { createContext, useContext, useReducer } from 'react';

const initialState = {
  view: 'home', // home | lobby | game
  sessionCode: null,
  myPlayerId: null,
  myName: null,
  isInitiator: false,
  players: [],
  phase: 'lobby',
  hotSeatPlayerId: null,
  celebrity: null,      // null if I'm on the hot seat
  iAmOnHotSeat: false,
  questionLog: [],
  revealed: null,       // { celebrity, correct, hotSeatPlayerName }
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SESSION_CREATED':
      return {
        ...state,
        view: 'lobby',
        sessionCode: action.payload.sessionCode,
        myPlayerId: action.payload.playerId,
        players: action.payload.players,
        isInitiator: true,
      };

    case 'SESSION_JOINED':
      return {
        ...state,
        view: 'lobby',
        sessionCode: action.payload.sessionCode,
        myPlayerId: action.payload.playerId,
        players: action.payload.players,
        isInitiator: false,
      };

    case 'PLAYER_JOINED':
      return { ...state, players: action.payload.players };

    case 'PLAYER_LEFT': {
      const newState = { ...state, players: action.payload.players };
      if (action.payload.newInitiatorId === state.myPlayerId) {
        newState.isInitiator = true;
      }
      return newState;
    }

    case 'GAME_STARTED':
      return {
        ...state,
        view: 'game',
        phase: 'playing',
        players: action.payload.players,
        questionLog: [],
        revealed: null,
      };

    case 'TURN_STARTED': {
      const iAmOnHotSeat = action.payload.hotSeatPlayerId === state.myPlayerId;
      return {
        ...state,
        hotSeatPlayerId: action.payload.hotSeatPlayerId,
        celebrity: action.payload.celebrity,
        iAmOnHotSeat,
        questionLog: [],
        revealed: null,
        players: action.payload.players || state.players,
      };
    }

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

    case 'CELEBRITY_REVEALED':
      return {
        ...state,
        revealed: {
          celebrity: action.payload.celebrity,
          correct: action.payload.correct,
          hotSeatPlayerName: action.payload.hotSeatPlayerName,
        },
      };

    case 'SET_MY_NAME':
      return { ...state, myName: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    default:
      return state;
  }
}

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
