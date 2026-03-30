import React, { useState, useEffect } from 'react';
import { send } from '../pusher.js';
import { useGame } from '../store/gameStore.jsx';

export default function HomeView() {
  const { state, dispatch } = useGame();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [tab, setTab] = useState('create'); // create | join

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlCode = params.get('code');
    if (urlCode) {
      setCode(urlCode.toUpperCase());
      setTab('join');
    }
  }, []);

  function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    dispatch({ type: 'SET_MY_NAME', payload: name.trim() });
    send('CREATE_SESSION', { playerName: name.trim() });
  }

  function handleJoin(e) {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    dispatch({ type: 'SET_MY_NAME', payload: name.trim() });
    send('JOIN_SESSION', { code: code.trim().toUpperCase(), playerName: name.trim() });
  }

  return (
    <div className="home-view">
      <div className="home-hero">
        <div className="home-emoji">🎭</div>
        <h1 className="home-title">ניחוש מי?</h1>
        <p className="home-subtitle">משחק הניחושים בקבוצה</p>
      </div>

      <div className="home-card">
        <div className="tab-bar">
          <button
            className={`tab-btn ${tab === 'create' ? 'active' : ''}`}
            onClick={() => setTab('create')}
          >
            צור משחק חדש
          </button>
          <button
            className={`tab-btn ${tab === 'join' ? 'active' : ''}`}
            onClick={() => setTab('join')}
          >
            הצטרף למשחק
          </button>
        </div>

        <div className="tab-content">
          <div className="form-group">
            <label className="form-label">השם שלך</label>
            <input
              className="form-input"
              type="text"
              placeholder="הכנס את שמך..."
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={20}
            />
          </div>

          {tab === 'join' && (
            <div className="form-group">
              <label className="form-label">קוד משחק</label>
              <input
                className="form-input code-input"
                type="text"
                placeholder="XXXXXX"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                maxLength={6}
              />
            </div>
          )}

          <button
            className="btn btn-primary btn-large"
            onClick={tab === 'create' ? handleCreate : handleJoin}
            disabled={!name.trim() || (tab === 'join' && !code.trim())}
          >
            {tab === 'create' ? '🎮 צור משחק' : '🚀 הצטרף'}
          </button>
        </div>
      </div>

      <div className="home-rules">
        <h3>איך משחקים?</h3>
        <ul>
          <li>🃏 כל שחקן בתורו מקבל מילה סודית – אבל הוא לא רואה אותה!</li>
          <li>❓ השחקן שואל שאלות כן/לא כדי לנחש מה המילה</li>
          <li>👀 שאר השחקנים רואים את המילה ועונים על השאלות</li>
          <li>🏆 מי שינחש הכי מהר מנצח!</li>
        </ul>
      </div>
    </div>
  );
}
