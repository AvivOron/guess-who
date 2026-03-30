import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useReducer } from 'react';
const initialState = {
    view: 'home',
    sessionCode: null,
    myPlayerId: null,
    myName: null,
    isInitiator: false,
    players: [],
    phase: 'lobby',
    categoryId: null,
    hotSeatPlayerId: null,
    item: null,
    iAmOnHotSeat: false,
    questionLog: [],
    revealed: null,
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
            const players = action.payload.players
                ? action.payload.players
                : state.players.filter(p => p.id !== action.payload.playerId);
            return { ...state, players };
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
                categoryId: action.payload.categoryId ?? state.categoryId,
                item: null,
                iAmOnHotSeat,
                questionLog: [],
                revealed: null,
                players: action.payload.players ?? state.players,
            };
        }
        case 'ITEM_ASSIGNED':
            return { ...state, item: action.payload.item };
        case 'QUESTION_ASKED':
            return {
                ...state,
                questionLog: [...state.questionLog, action.payload.question],
            };
        case 'QUESTION_ANSWERED': {
            const log = state.questionLog.map(q => q.id === action.payload.question.id ? action.payload.question : q);
            return { ...state, questionLog: log };
        }
        case 'ITEM_REVEALED':
            return {
                ...state,
                revealed: {
                    item: action.payload.item,
                    correct: action.payload.correct,
                    hotSeatPlayerName: action.payload.hotSeatPlayerName,
                },
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
const GameContext = createContext(null);
export function GameProvider({ children }) {
    const [state, dispatch] = useReducer(reducer, initialState);
    return (_jsx(GameContext.Provider, { value: { state, dispatch }, children: children }));
}
export function useGame() {
    const ctx = useContext(GameContext);
    if (!ctx)
        throw new Error('useGame must be used within GameProvider');
    return ctx;
}
