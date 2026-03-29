import React, { useState, useEffect, useRef } from 'react';
import { send } from '../pusher.js';
import { useGame } from '../store/gameStore.jsx';
import confetti from 'canvas-confetti';

const PLAYER_COLORS = ['#FF6B6B','#4ECDC4','#FFE66D','#A78BFA','#F97316','#34D399','#60A5FA','#F472B6','#FBBF24','#6EE7B7'];

function getPlayerColor(players, playerId) {
  const idx = players.findIndex(p => p.id === playerId);
  return PLAYER_COLORS[idx % PLAYER_COLORS.length] || '#999';
}

function getPlayerName(players, playerId) {
  return players.find(p => p.id === playerId)?.name || '???';
}

export default function GameView() {
  const { state } = useGame();
  const { players, hotSeatPlayerId, celebrity, iAmOnHotSeat, questionLog, revealed, isInitiator, myPlayerId } = state;
  const [question, setQuestion] = useState('');
  const logEndRef = useRef(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [questionLog]);

  useEffect(() => {
    if (revealed?.correct) {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    }
  }, [revealed]);

  function submitQuestion(e) {
    e.preventDefault();
    if (!question.trim()) return;
    send('ASK_QUESTION', { text: question.trim() });
    setQuestion('');
  }

  function answer(questionId, ans) {
    send('ANSWER_QUESTION', { questionId, answer: ans });
  }

  function nextTurn() {
    send('NEXT_TURN');
  }

  function revealResult(correct) {
    send('REVEAL_GUESS', { correct });
  }

  const hotSeatName = getPlayerName(players, hotSeatPlayerId);

  return (
    <div className="game-view">
      {/* Header */}
      <div className="game-header">
        <span className="session-badge">🎭 {state.sessionCode}</span>
        <div className="hot-seat-indicator" style={{ '--hs-color': getPlayerColor(players, hotSeatPlayerId) }}>
          {iAmOnHotSeat ? '🔥 זה התור שלך!' : `🎯 ${hotSeatName} מנחש`}
        </div>
      </div>

      {/* Main area */}
      <div className="game-main">
        {/* Celebrity card */}
        <div className="celebrity-section">
          {revealed ? (
            <div className={`reveal-card ${revealed.correct ? 'correct' : 'wrong'}`}>
              <img
                src={revealed.celebrity.imageUrl}
                alt={revealed.celebrity.name}
                className="celebrity-img"
                onError={e => { e.target.src = '/images/placeholder.jpg'; }}
              />
              <div className="reveal-name">{revealed.celebrity.name}</div>
              <div className="reveal-badge">
                {revealed.correct ? '🎉 נכון! ניצחתם!' : '❌ לא נכון...'}
              </div>
              {isInitiator && (
                <button className="btn btn-next" onClick={nextTurn}>
                  ➡️ תור הבא
                </button>
              )}
            </div>
          ) : iAmOnHotSeat ? (
            <div className="hot-seat-card">
              <div className="mystery-icon">🃏</div>
              <p className="hot-seat-text">מי אני?</p>
              <p className="hot-seat-sub">שאל שאלות כן/לא כדי לגלות!</p>
            </div>
          ) : celebrity ? (
            <div className="celebrity-card">
              <img
                src={celebrity.imageUrl}
                alt={celebrity.name}
                className="celebrity-img"
                onError={e => { e.target.src = '/images/placeholder.jpg'; }}
              />
              <div className="celebrity-name">{celebrity.name}</div>
              <div className="celebrity-hint">({celebrity.hint})</div>
            </div>
          ) : (
            <div className="loading-card">טוען...</div>
          )}
        </div>

        {/* Players sidebar */}
        <div className="players-sidebar">
          <h3 className="sidebar-title">שחקנים</h3>
          {players.map((player, i) => (
            <div
              key={player.id}
              className={`sidebar-player ${player.id === hotSeatPlayerId ? 'on-hot-seat' : ''}`}
              style={{ '--player-color': PLAYER_COLORS[i % PLAYER_COLORS.length] }}
            >
              <div className="sidebar-avatar">{player.name[0]?.toUpperCase()}</div>
              <span className="sidebar-name">{player.name}</span>
              {player.id === hotSeatPlayerId && <span className="fire-badge">🔥</span>}
              {player.isInitiator && <span className="crown-badge">👑</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Q&A Log */}
      <div className="qa-section">
        <div className="qa-log">
          {questionLog.length === 0 && (
            <p className="qa-empty">עדיין אין שאלות. {iAmOnHotSeat ? 'שאל שאלה!' : `ממתין ל${hotSeatName}...`}</p>
          )}
          {questionLog.map((q, i) => (
            <div key={q.id} className="qa-item">
              <div className="qa-question">
                <span className="qa-index">{i + 1}.</span>
                <span className="qa-text">{q.text}</span>
              </div>
              {q.answer ? (
                <div className={`qa-answer answer-${q.answer === 'כן' ? 'yes' : q.answer === 'לא' ? 'no' : 'maybe'}`}>
                  {q.answer}
                </div>
              ) : !iAmOnHotSeat && myPlayerId !== hotSeatPlayerId && (
                <div className="qa-buttons">
                  {['כן', 'לא', 'אולי'].map(ans => (
                    <button
                      key={ans}
                      className={`btn-answer btn-${ans === 'כן' ? 'yes' : ans === 'לא' ? 'no' : 'maybe'}`}
                      onClick={() => answer(q.id, ans)}
                    >
                      {ans}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div ref={logEndRef} />
        </div>

        {/* Question input (hot seat only) */}
        {iAmOnHotSeat && !revealed && (
          <form className="question-form" onSubmit={submitQuestion}>
            <input
              className="question-input"
              type="text"
              placeholder="שאל שאלת כן/לא..."
              value={question}
              onChange={e => setQuestion(e.target.value)}
              maxLength={100}
            />
            <button className="btn btn-ask" type="submit" disabled={!question.trim()}>
              שאל ❓
            </button>
          </form>
        )}

        {/* Reveal controls — initiator only, when not already revealed */}
        {isInitiator && !revealed && questionLog.length > 0 && (
          <div className="reveal-controls">
            <p className="reveal-label">האם {hotSeatName} ניחש נכון?</p>
            <div className="reveal-buttons">
              <button className="btn btn-correct" onClick={() => revealResult(true)}>✅ ניחש נכון!</button>
              <button className="btn btn-wrong" onClick={() => revealResult(false)}>❌ לא נכון</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
