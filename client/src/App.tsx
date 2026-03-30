import { useEffect } from 'react';
import { GameProvider, useGame } from './store/gameStore';
import { on } from './pusher';
import HomeView from './views/HomeView';
import LobbyView from './views/LobbyView';
import GameView from './views/GameView';
import type { GameAction } from './types';

function AppInner() {
  const { state, dispatch } = useGame();

  useEffect(() => {
    const unsubs = [
      on('SESSION_CREATED',   p => dispatch({ type: 'SESSION_CREATED',   payload: p } as GameAction)),
      on('SESSION_JOINED',    p => dispatch({ type: 'SESSION_JOINED',    payload: p } as GameAction)),
      on('PLAYER_JOINED',     p => dispatch({ type: 'PLAYER_JOINED',     payload: p } as GameAction)),
      on('PLAYER_LEFT',       p => dispatch({ type: 'PLAYER_LEFT',       payload: p } as GameAction)),
      on('GAME_STARTED',      p => dispatch({ type: 'GAME_STARTED',      payload: p } as GameAction)),
      on('TURN_STARTED',      p => dispatch({ type: 'TURN_STARTED',      payload: p } as GameAction)),
      on('ITEM_ASSIGNED',     p => dispatch({ type: 'ITEM_ASSIGNED',     payload: p } as GameAction)),
      on('QUESTION_ASKED',    p => dispatch({ type: 'QUESTION_ASKED',    payload: p } as GameAction)),
      on('QUESTION_ANSWERED', p => dispatch({ type: 'QUESTION_ANSWERED', payload: p } as GameAction)),
      on('ITEM_REVEALED',     p => dispatch({ type: 'ITEM_REVEALED',     payload: p } as GameAction)),
      on('ERROR',             p => dispatch({ type: 'SET_ERROR', payload: (p as { message: string }).message })),
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] font-['Heebo',sans-serif] text-[#f0f0f0]" dir="rtl">
      {state.error && (
        <div
          className="fixed top-4 right-1/2 translate-x-1/2 bg-[#FF6B6B] text-white px-6 py-3 rounded-full font-bold z-[9999] cursor-pointer shadow-[0_4px_20px_rgba(255,107,107,0.4)] animate-[slideDown_0.3s_ease]"
          onClick={() => dispatch({ type: 'CLEAR_ERROR' })}
        >
          {state.error}
        </div>
      )}
      <View />
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <AppInner />
    </GameProvider>
  );
}
