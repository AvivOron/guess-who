import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { GameProvider, useGame } from './store/gameStore';
import { on } from './pusher';
import HomeView from './views/HomeView';
import LobbyView from './views/LobbyView';
import GameView from './views/GameView';
function AppInner() {
    const { state, dispatch } = useGame();
    useEffect(() => {
        const unsubs = [
            on('SESSION_CREATED', p => dispatch({ type: 'SESSION_CREATED', payload: p })),
            on('SESSION_JOINED', p => dispatch({ type: 'SESSION_JOINED', payload: p })),
            on('PLAYER_JOINED', p => dispatch({ type: 'PLAYER_JOINED', payload: p })),
            on('PLAYER_LEFT', p => dispatch({ type: 'PLAYER_LEFT', payload: p })),
            on('GAME_STARTED', p => dispatch({ type: 'GAME_STARTED', payload: p })),
            on('TURN_STARTED', p => dispatch({ type: 'TURN_STARTED', payload: p })),
            on('ITEM_ASSIGNED', p => dispatch({ type: 'ITEM_ASSIGNED', payload: p })),
            on('QUESTION_ASKED', p => dispatch({ type: 'QUESTION_ASKED', payload: p })),
            on('QUESTION_ANSWERED', p => dispatch({ type: 'QUESTION_ANSWERED', payload: p })),
            on('ITEM_REVEALED', p => dispatch({ type: 'ITEM_REVEALED', payload: p })),
            on('ERROR', p => dispatch({ type: 'SET_ERROR', payload: p.message })),
        ];
        return () => unsubs.forEach(fn => fn());
    }, []);
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (code && state.view === 'home') {
            dispatch({ type: 'SET_PENDING_CODE', payload: code.toUpperCase() });
        }
    }, []);
    const views = { home: HomeView, lobby: LobbyView, game: GameView };
    const View = views[state.view] ?? HomeView;
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] font-['Heebo',sans-serif] text-[#f0f0f0]", dir: "rtl", children: [state.error && (_jsx("div", { className: "fixed top-4 right-1/2 translate-x-1/2 bg-[#FF6B6B] text-white px-6 py-3 rounded-full font-bold z-[9999] cursor-pointer shadow-[0_4px_20px_rgba(255,107,107,0.4)] animate-[slideDown_0.3s_ease]", onClick: () => dispatch({ type: 'CLEAR_ERROR' }), children: state.error })), _jsx(View, {})] }));
}
export default function App() {
    return (_jsx(GameProvider, { children: _jsx(AppInner, {}) }));
}
