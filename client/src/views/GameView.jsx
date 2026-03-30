import React, { useState, useEffect, useRef } from 'react';
import { send } from '../pusher.js';
import { useGame } from '../store/gameStore.jsx';
import { categories } from '../categories.js';
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
  const { players, hotSeatPlayerId, item, iAmOnHotSeat, questionLog, revealed, isInitiator, categoryId } = state;
  const [question, setQuestion] = useState('');
  const logEndRef = useRef(null);

  const category = categories.find(c => c.id === categoryId);

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

  function revealResult(correct) {
    send('REVEAL_GUESS', { correct });
  }

  function nextTurn() {
    send('NEXT_TURN');
  }

  const hotSeatName = getPlayerName(players, hotSeatPlayerId);
  const hotSeatColor = getPlayerColor(players, hotSeatPlayerId);

  return (
    <div className="game-view">
      {/* Header */}
      <div className="game-header">
        <span className="session-badge">🎭 {state.sessionCode}</span>
        {category && <span className="category-badge">{category.emoji} {category.name}</span>}
        <div className="hot-seat-indicator" style={{ '--hs-color': hotSeatColor }}>
          {iAmOnHotSeat ? '🔥 זה התור שלך!' : `🎯 ${hotSeatName} מנחש`}
        </div>
      </div>

      {/* Main area */}
      <div className="game-main">
        <div className="item-section">
          {revealed ? (
            <div className={`reveal-card ${revealed.correct ? 'correct' : 'wrong'}`}>
              <div className="reveal-item-name">{revealed.item.name}</div>
              <div className="reveal-badge">
                {revealed.correct ? '🎉 נכון! ניצחתם!' : '❌ לא נכון...'}
              </div>
              <div className="reveal-sub">
                {revealed.hotSeatPlayerName} {revealed.correct ? 'ניחש נכון!' : 'לא הצליח לנחש'}
              </div>
              {isInitiator && (
                <button className="btn btn-next" onClick={nextTurn}>➡️ תור הבא</button>
              )}
            </div>
          ) : iAmOnHotSeat ? (
            <div className="hot-seat-card">
              <div className="mystery-icon">❓</div>
              <p className="hot-seat-text">מי אני?</p>
              {category && <p className="hot-seat-category">{category.emoji} {category.name}</p>}
              <p className="hot-seat-sub">שאל שאלות כן/לא כדי לגלות!</p>
            </div>
          ) : item ? (
            <div className="item-card">
              <div className="item-category-label">{category?.emoji} {category?.name}</div>
              <div className="item-name">{item.name}</div>
              <div className="item-sub">רק אתה רואה את זה! 🤫</div>
            </div>
          ) : (
            <div className="item-card loading">
              <div className="mystery-icon">⏳</div>
            </div>
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

          {isInitiator && !revealed && questionLog.length > 0 && (
            <div className="sidebar-reveal-controls">
              <p className="sidebar-reveal-label">האם {hotSeatName} ניחש?</p>
              <button className="btn btn-correct btn-sm" onClick={() => revealResult(true)}>✅ נכון</button>
              <button className="btn btn-wrong btn-sm" onClick={() => revealResult(false)}>❌ לא נכון</button>
            </div>
          )}
        </div>
      </div>

      {/* Q&A */}
      <div className="qa-section">
        <div className="qa-log">
          {questionLog.length === 0 && (
            <p className="qa-empty">
              {iAmOnHotSeat ? 'שאל שאלת כן/לא!' : `ממתין ל${hotSeatName} לשאול שאלה...`}
            </p>
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
              ) : !iAmOnHotSeat && (
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

        {iAmOnHotSeat && !revealed && (
          <form className="question-form" onSubmit={submitQuestion}>
            <input
              className="question-input"
              type="text"
              placeholder={questionLog.length >= 10 ? 'הגעת למגבלת 10 שאלות' : 'שאל שאלת כן/לא...'}
              value={question}
              onChange={e => setQuestion(e.target.value)}
              maxLength={100}
              autoFocus
              disabled={questionLog.length >= 10}
            />
            <button className="btn btn-ask" type="submit" disabled={!question.trim() || questionLog.length >= 10}>
              שאל ❓
            </button>
            <span className={`question-counter ${questionLog.length >= 10 ? 'counter-limit' : ''}`}>
              {questionLog.length}/10
            </span>
          </form>
        )}
      </div>
    </div>
  );
}
