import React, { useState } from 'react';
import { send } from '../pusher.js';
import { useGame } from '../store/gameStore.jsx';
import { categories } from '../categories.js';

const PLAYER_COLORS = ['#FF6B6B','#4ECDC4','#FFE66D','#A78BFA','#F97316','#34D399','#60A5FA','#F472B6','#FBBF24','#6EE7B7'];

export default function LobbyView() {
  const { state } = useGame();
  const { sessionCode, players, isInitiator } = state;
  const [copied, setCopied] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');

  const shareUrl = `${window.location.origin}?code=${sessionCode}`;

  function copyLink() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function startGame() {
    send('START_GAME', { categoryId: selectedCategory });
  }

  const canStart = players.length >= 2 && selectedCategory;

  return (
    <div className="lobby-view">
      <div className="lobby-header">
        <div className="lobby-emoji">🎭</div>
        <h1 className="lobby-title">חדר המתנה</h1>
      </div>

      <div className="session-code-card">
        <p className="session-label">קוד המשחק</p>
        <div className="session-code">{sessionCode}</div>
        <button className="btn btn-secondary" onClick={copyLink}>
          {copied ? '✅ הועתק!' : '🔗 העתק קישור'}
        </button>
      </div>

      <div className="players-section">
        <h2 className="players-title">שחקנים ({players.length}/10)</h2>
        <div className="players-grid">
          {players.map((player, i) => (
            <div
              key={player.id}
              className="player-chip"
              style={{ '--player-color': PLAYER_COLORS[i % PLAYER_COLORS.length] }}
            >
              <div className="player-avatar">{player.name[0]?.toUpperCase()}</div>
              <span className="player-name">{player.name}</span>
              {player.isInitiator && <span className="initiator-badge">👑</span>}
            </div>
          ))}
          {Array.from({ length: Math.max(0, 10 - players.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="player-chip empty">
              <div className="player-avatar empty-avatar">?</div>
              <span className="player-name muted">ממתין...</span>
            </div>
          ))}
        </div>
      </div>

      {isInitiator ? (
        <div className="start-section">
          <h2 className="players-title">בחר קטגוריה</h2>
          <div className="category-grid">
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`category-btn ${selectedCategory === cat.id ? 'selected' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <span className="cat-emoji">{cat.emoji}</span>
                <span className="cat-name">{cat.name}</span>
              </button>
            ))}
          </div>

          {players.length < 2 ? (
            <p className="waiting-text">ממתין לשחקנים נוספים... (נדרשים לפחות 2)</p>
          ) : !selectedCategory ? (
            <p className="waiting-text">בחר קטגוריה כדי להתחיל</p>
          ) : (
            <button className="btn btn-start" onClick={startGame}>
              🚀 התחל משחק!
            </button>
          )}
        </div>
      ) : (
        <div className="waiting-section">
          <div className="pulse-dot"></div>
          <p className="waiting-text">ממתין למארגן המשחק שיתחיל...</p>
        </div>
      )}
    </div>
  );
}
