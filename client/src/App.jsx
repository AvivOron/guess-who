import React, { useEffect } from 'react';
import { GameProvider, useGame } from './store/gameStore.jsx';
import { on } from './pusher.js';
import HomeView from './views/HomeView.jsx';
import LobbyView from './views/LobbyView.jsx';
import GameView from './views/GameView.jsx';

function AppInner() {
  const { state, dispatch } = useGame();

  useEffect(() => {
    const unsubs = [
      on('SESSION_CREATED',    p => dispatch({ type: 'SESSION_CREATED',    payload: p })),
      on('SESSION_JOINED',     p => dispatch({ type: 'SESSION_JOINED',     payload: p })),
      on('PLAYER_JOINED',      p => dispatch({ type: 'PLAYER_JOINED',      payload: p })),
      on('PLAYER_LEFT',        p => dispatch({ type: 'PLAYER_LEFT',        payload: p })),
      on('GAME_STARTED',       p => dispatch({ type: 'GAME_STARTED',       payload: p })),
      on('TURN_STARTED',       p => dispatch({ type: 'TURN_STARTED',       payload: p })),
      on('CELEBRITY_ASSIGNED', p => dispatch({ type: 'CELEBRITY_ASSIGNED', payload: p })),
      on('QUESTION_ASKED',     p => dispatch({ type: 'QUESTION_ASKED',     payload: p })),
      on('QUESTION_ANSWERED',  p => dispatch({ type: 'QUESTION_ANSWERED',  payload: p })),
      on('CELEBRITY_REVEALED', p => dispatch({ type: 'CELEBRITY_REVEALED', payload: p })),
      on('ERROR',              p => dispatch({ type: 'SET_ERROR',          payload: p.message })),
    ];
    return () => unsubs.forEach(fn => fn());
  }, []);

  // Pre-fill join code from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code && state.view === 'home') {
      dispatch({ type: 'SET_PENDING_CODE', payload: code.toUpperCase() });
    }
  }, []);

  const views = { home: HomeView, lobby: LobbyView, game: GameView };
  const View = views[state.view] || HomeView;

  return (
    <div className="app">
      {state.error && (
        <div className="error-toast" onClick={() => dispatch({ type: 'CLEAR_ERROR' })}>
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
