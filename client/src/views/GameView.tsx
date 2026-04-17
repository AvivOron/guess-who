import { useState, useEffect, useRef } from 'react';
import { send } from '../pusher';
import { useGame } from '../store/gameStore';
import confetti from 'canvas-confetti';
import type { Player } from '../types';

const TURN_DURATION = 90; // seconds
const PLAYER_COLORS = ['#FF6B6B','#4ECDC4','#FFE66D','#A78BFA','#F97316','#34D399','#60A5FA','#F472B6','#FBBF24','#6EE7B7'];

function getPlayerColor(players: Player[], playerId: string | null): string {
  const idx = players.findIndex(p => p.id === playerId);
  return PLAYER_COLORS[idx % PLAYER_COLORS.length] ?? '#999';
}

function getPlayerName(players: Player[], playerId: string | null): string {
  return players.find(p => p.id === playerId)?.name ?? '???';
}

function useTimer(timerStartedAt: number | null): number {
  const [secondsLeft, setSecondsLeft] = useState(TURN_DURATION);

  useEffect(() => {
    if (timerStartedAt === null) {
      setSecondsLeft(TURN_DURATION);
      return;
    }
    function tick() {
      const elapsed = Math.floor((Date.now() - timerStartedAt!) / 1000);
      setSecondsLeft(Math.max(0, TURN_DURATION - elapsed));
    }
    tick();
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [timerStartedAt]);

  return secondsLeft;
}

export default function GameView() {
  const { state } = useGame();
  const {
    players, item, questionLog, turnResult,
    isInitiator, categoryId, sessionCode, availableCategories,
    groups, scores, guessingGroupIndex, timerStartedAt, myPlayerId,
  } = state;
  const [question, setQuestion] = useState('');
  const [loadingBtn, setLoadingBtn] = useState<string | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const secondsLeft = useTimer(timerStartedAt);
  const timerExpired = secondsLeft === 0;

  const category = availableCategories.find(c => c.id === categoryId);

  // Derive live from current state — don't rely on stale store-computed value
  const iAmGuessing = (groups[guessingGroupIndex] ?? []).includes(myPlayerId ?? '');
  const iAmAnswering = (groups[guessingGroupIndex === 0 ? 1 : 0] ?? []).includes(myPlayerId ?? '');

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [questionLog]);

  useEffect(() => {
    if (turnResult?.correct) {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    }
  }, [turnResult]);

  async function submitQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    setLoadingBtn('ask');
    await send('ASK_QUESTION', { text: question.trim() });
    setQuestion('');
    setLoadingBtn(null);
  }

  // Group name helper
  const groupLabel = (idx: 0 | 1) => idx === 0 ? 'קבוצה א׳' : 'קבוצה ב׳';

  // Timer color
  const timerColor = secondsLeft > 30 ? '#34D399' : secondsLeft > 10 ? '#FFE66D' : '#FF6B6B';

  const btnBase = 'inline-flex items-center justify-center gap-2 rounded-full border-none font-["Heebo",sans-serif] font-bold cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:not-disabled:-translate-y-0.5';

  return (
    <div className="max-w-[900px] mx-auto p-4 flex flex-col gap-4 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="bg-white/[0.07] border border-white/[0.12] px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide">
          🎭 {sessionCode}
        </span>
      </div>

      {/* Timer bar */}
      {!turnResult && timerStartedAt !== null && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-3 bg-white/[0.08] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(secondsLeft / TURN_DURATION) * 100}%`,
                background: timerColor,
                boxShadow: `0 0 8px ${timerColor}`,
              }}
            />
          </div>
          <span className="font-black text-lg min-w-[3rem] text-right" style={{ color: timerColor }}>
            {secondsLeft}s
          </span>
        </div>
      )}

      {/* Main area */}
      <div className="grid grid-cols-[160px_1fr_160px] max-sm:grid-cols-1 gap-4 items-start">
        {/* Group B (left) */}
        {(() => {
          const groupIdx: 0 | 1 = 1;
          const isGuessing = groupIdx === guessingGroupIndex;
          const memberIds = groups[groupIdx] ?? [];
          return (
            <div className={`bg-white/[0.07] border rounded-2xl p-3 backdrop-blur-sm ${isGuessing ? 'border-[#A78BFA] shadow-[0_0_16px_rgba(167,139,250,0.2)]' : 'border-white/[0.12]'}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className={`text-xs font-bold ${isGuessing ? 'text-[#A78BFA]' : 'text-[#8892a4]'}`}>
                  {groupLabel(groupIdx)} {isGuessing ? '🔍' : '💬'}
                </h3>
                <span className={`text-xs font-black px-2 py-0.5 rounded-full ${isGuessing ? 'bg-[rgba(167,139,250,0.2)] text-[#A78BFA]' : 'bg-white/[0.07] text-[#8892a4]'}`}>
                  {scores[groupIdx]}
                </span>
              </div>
              {memberIds.map(id => {
                const player = players.find(p => p.id === id);
                if (!player) return null;
                const color = getPlayerColor(players, id);
                return (
                  <div key={id} className="flex items-center gap-2 px-1.5 py-1 rounded-lg">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-[#1a1a2e] shrink-0" style={{ background: color }}>
                      {player.name[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold truncate">{player.name}</span>
                    {player.isInitiator && <span className="text-xs">👑</span>}
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* Item / result card */}
        <div className="flex items-center justify-center">
          {turnResult ? (
            <div className={`bg-white/[0.07] border-2 rounded-2xl p-10 text-center backdrop-blur-sm flex flex-col items-center gap-3 w-full min-h-[220px] justify-center ${turnResult.correct ? 'border-[#34D399] shadow-[0_0_30px_rgba(52,211,153,0.3)]' : 'border-[#FF6B6B] shadow-[0_0_30px_rgba(255,107,107,0.3)]'}`}>
              <div className="text-[3rem] font-black text-[#FFE66D]">{turnResult.item.name}</div>
              <div className="text-[1.2rem] font-bold">{turnResult.correct ? '🎉 נכון! נקודה לקבוצה!' : '❌ לא נכון...'}</div>
              <div className="text-[#8892a4] text-sm">{groupLabel(turnResult.guessingGroupIndex)} {turnResult.correct ? 'ניחשה נכון!' : 'לא הצליחה לנחש'}</div>
              {isInitiator && (
                <button
                  className={`${btnBase} w-full mt-4 py-3 px-6 text-white bg-gradient-to-br from-[#A78BFA] to-[#60A5FA]`}
                  disabled={loadingBtn === 'next'}
                  onClick={async () => { setLoadingBtn('next'); await send('NEXT_TURN'); setLoadingBtn(null); }}
                >
                  {loadingBtn === 'next' ? <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '➡️ תור הבא'}
                </button>
              )}
            </div>
          ) : iAmGuessing ? (
            <div className="bg-white/[0.07] border-2 border-[#A78BFA] rounded-2xl p-10 text-center backdrop-blur-sm flex flex-col items-center gap-3 w-full min-h-[220px] justify-center shadow-[0_0_30px_rgba(167,139,250,0.2)]">
              <div className="text-[5rem]">❓</div>
              <p className="text-[2rem] font-black text-[#A78BFA]">מה המילה?</p>
              {category && <p className="text-base font-bold text-[#8892a4]">{category.emoji} {category.name}</p>}
              <p className="text-[#8892a4] text-sm">שאלו שאלות כן/לא כדי לגלות!</p>
            </div>
          ) : iAmAnswering ? (
            <div className="bg-white/[0.07] border-2 border-[#4ECDC4] rounded-2xl p-10 text-center backdrop-blur-sm flex flex-col items-center gap-3 w-full min-h-[220px] justify-center shadow-[0_0_30px_rgba(78,205,196,0.15)]">
              {item && (
                <>
                  <div className="text-sm text-[#8892a4] font-semibold">{category?.emoji} {category?.name}</div>
                  <div className="text-[3.5rem] font-black text-[#FFE66D] drop-shadow-[0_0_20px_rgba(255,230,109,0.4)] leading-tight">{item.name}</div>
                  <div className="text-[#8892a4] text-sm">רק הקבוצה שלך רואה את זה! 🤫</div>
                </>
              )}
              {/* Early guess button — available before timer runs out */}
              {!timerExpired && (
                <button
                  className="mt-2 py-2 px-6 rounded-full font-bold text-sm text-[#1a1a2e] bg-[#34D399] disabled:opacity-60 transition-transform hover:-translate-y-0.5"
                  disabled={!!loadingBtn}
                  onClick={async () => { setLoadingBtn('correct'); await send('SUBMIT_RESULT', { correct: true }); setLoadingBtn(null); }}
                >
                  {loadingBtn === 'correct' ? <span className="inline-block w-4 h-4 border-2 border-[#1a1a2e]/30 border-t-[#1a1a2e] rounded-full animate-spin" /> : '🎯 הקבוצה השניה ניחשה!'}
                </button>
              )}
              {/* After timer — must declare result */}
              {timerExpired && (
                <div className="flex gap-2 mt-2 w-full">
                  <button
                    className="flex-1 py-2 px-3 rounded-full font-bold text-sm text-[#1a1a2e] bg-[#34D399] disabled:opacity-60"
                    disabled={!!loadingBtn}
                    onClick={async () => { setLoadingBtn('correct'); await send('SUBMIT_RESULT', { correct: true }); setLoadingBtn(null); }}
                  >
                    {loadingBtn === 'correct' ? <span className="inline-block w-4 h-4 border-2 border-[#1a1a2e]/30 border-t-[#1a1a2e] rounded-full animate-spin" /> : '✅ ניחשו נכון'}
                  </button>
                  <button
                    className="flex-1 py-2 px-3 rounded-full font-bold text-sm text-white bg-[#FF6B6B] disabled:opacity-60"
                    disabled={!!loadingBtn}
                    onClick={async () => { setLoadingBtn('wrong'); await send('SUBMIT_RESULT', { correct: false }); setLoadingBtn(null); }}
                  >
                    {loadingBtn === 'wrong' ? <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '❌ לא הצליחו'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white/[0.07] border-2 border-white/[0.12] rounded-2xl p-10 text-center flex flex-col items-center justify-center w-full min-h-[220px]">
              <div className="text-[5rem]">⏳</div>
            </div>
          )}
        </div>

        {/* Group A (right) */}
        {(() => {
          const groupIdx: 0 | 1 = 0;
          const isGuessing = groupIdx === guessingGroupIndex;
          const memberIds = groups[groupIdx] ?? [];
          return (
            <div className={`bg-white/[0.07] border rounded-2xl p-3 backdrop-blur-sm ${isGuessing ? 'border-[#A78BFA] shadow-[0_0_16px_rgba(167,139,250,0.2)]' : 'border-white/[0.12]'}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className={`text-xs font-bold ${isGuessing ? 'text-[#A78BFA]' : 'text-[#8892a4]'}`}>
                  {groupLabel(groupIdx)} {isGuessing ? '🔍' : '💬'}
                </h3>
                <span className={`text-xs font-black px-2 py-0.5 rounded-full ${isGuessing ? 'bg-[rgba(167,139,250,0.2)] text-[#A78BFA]' : 'bg-white/[0.07] text-[#8892a4]'}`}>
                  {scores[groupIdx]}
                </span>
              </div>
              {memberIds.map(id => {
                const player = players.find(p => p.id === id);
                if (!player) return null;
                const color = getPlayerColor(players, id);
                return (
                  <div key={id} className="flex items-center gap-2 px-1.5 py-1 rounded-lg">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-[#1a1a2e] shrink-0" style={{ background: color }}>
                      {player.name[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold truncate">{player.name}</span>
                    {player.isInitiator && <span className="text-xs">👑</span>}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Q&A */}
      <div className="bg-white/[0.07] border border-white/[0.12] rounded-2xl p-4 backdrop-blur-sm flex flex-col gap-3 flex-1">
        <div className="max-h-[300px] overflow-y-auto flex flex-col gap-2 scrollbar-thin scrollbar-thumb-white/10">
          {questionLog.length === 0 && (
            <p className="text-center text-[#8892a4] py-6 text-[0.95rem]">
              {iAmGuessing ? 'שאלו שאלת כן/לא!' : `ממתין לקבוצה המנחשת לשאול שאלה...`}
            </p>
          )}
          {questionLog.map((q, i) => {
            const askerName = getPlayerName(players, q.askerId);
            return (
              <div key={q.id} className="flex items-start justify-between gap-3 px-3 py-2.5 bg-white/[0.04] rounded-xl flex-wrap">
                <div className="flex gap-2 flex-1">
                  <span className="text-[#8892a4] font-bold shrink-0">{i + 1}.</span>
                  <div className="flex flex-col gap-0.5 flex-1">
                    <span className="text-[0.95rem] leading-snug">{q.text}</span>
                    <span className="text-xs text-[#8892a4]">{askerName}</span>
                  </div>
                </div>
                {q.answer ? (
                  <div className={`px-3 py-1 rounded-full font-bold text-sm shrink-0 ${
                    q.answer === 'כן'    ? 'bg-[rgba(52,211,153,0.2)] text-[#34D399] border border-[#34D399]' :
                    q.answer === 'לא'    ? 'bg-[rgba(255,107,107,0.2)] text-[#FF6B6B] border border-[#FF6B6B]' :
                                           'bg-[rgba(255,230,109,0.2)] text-[#FFE66D] border border-[#FFE66D]'
                  }`}>
                    {q.answer}
                  </div>
                ) : iAmAnswering && (
                  <div className="flex gap-1.5 shrink-0">
                    {(['כן', 'לא', 'אולי'] as const).map(ans => (
                      <button
                        key={ans}
                        className={`px-3.5 py-1 rounded-full font-bold text-sm cursor-pointer transition-transform hover:scale-[1.08] border-none disabled:opacity-60 disabled:cursor-not-allowed ${
                          ans === 'כן'    ? 'bg-[#34D399] text-[#1a1a2e]' :
                          ans === 'לא'    ? 'bg-[#FF6B6B] text-white' :
                                            'bg-[#FFE66D] text-[#1a1a2e]'
                        }`}
                        disabled={loadingBtn === `ans-${q.id}-${ans}`}
                        onClick={async () => { setLoadingBtn(`ans-${q.id}-${ans}`); await send('ANSWER_QUESTION', { questionId: q.id, answer: ans }); setLoadingBtn(null); }}
                      >
                        {loadingBtn === `ans-${q.id}-${ans}`
                          ? <span className={`inline-block w-4 h-4 border-2 rounded-full animate-spin ${ans === 'לא' ? 'border-white/30 border-t-white' : 'border-[#1a1a2e]/30 border-t-[#1a1a2e]'}`} />
                          : ans}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <div ref={logEndRef} />
        </div>

        {iAmGuessing && !turnResult && (
          <form className="flex gap-3 items-center" onSubmit={submitQuestion}>
            <input
              className="flex-1 bg-white/[0.06] border border-white/[0.12] rounded-xl px-4 py-2.5 text-[#f0f0f0] font-['Heebo',sans-serif] text-base placeholder-[#8892a4] focus:outline-none focus:border-[#4ECDC4] disabled:opacity-50"
              type="text"
              placeholder="שאלו שאלת כן/לא..."
              value={question}
              onChange={e => setQuestion(e.target.value)}
              maxLength={100}
              autoFocus
            />
            <button
              className="bg-[#4ECDC4] text-[#1a1a2e] px-4 py-2.5 rounded-full font-bold shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-transform hover:not-disabled:-translate-y-0.5"
              type="submit"
              disabled={!question.trim() || loadingBtn === 'ask'}
            >
              {loadingBtn === 'ask' ? <span className="inline-block w-5 h-5 border-2 border-[#1a1a2e]/30 border-t-[#1a1a2e] rounded-full animate-spin" /> : 'שאל ❓'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
