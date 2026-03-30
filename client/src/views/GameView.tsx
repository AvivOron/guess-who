import { useState, useEffect, useRef } from 'react';
import { send } from '../pusher';
import { useGame } from '../store/gameStore';
import { categories } from '../categories';
import confetti from 'canvas-confetti';
import type { Player } from '../types';

const PLAYER_COLORS = ['#FF6B6B','#4ECDC4','#FFE66D','#A78BFA','#F97316','#34D399','#60A5FA','#F472B6','#FBBF24','#6EE7B7'];

function getPlayerColor(players: Player[], playerId: string | null): string {
  const idx = players.findIndex(p => p.id === playerId);
  return PLAYER_COLORS[idx % PLAYER_COLORS.length] ?? '#999';
}

function getPlayerName(players: Player[], playerId: string | null): string {
  return players.find(p => p.id === playerId)?.name ?? '???';
}

export default function GameView() {
  const { state } = useGame();
  const { players, hotSeatPlayerId, item, iAmOnHotSeat, questionLog, revealed, isInitiator, categoryId, sessionCode } = state;
  const [question, setQuestion] = useState('');
  const [loadingBtn, setLoadingBtn] = useState<string | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const category = categories.find(c => c.id === categoryId);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [questionLog]);

  useEffect(() => {
    if (revealed?.correct) {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    }
  }, [revealed]);

  async function submitQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    setLoadingBtn('ask');
    await send('ASK_QUESTION', { text: question.trim() });
    setQuestion('');
    setLoadingBtn(null);
  }

  const hotSeatName = getPlayerName(players, hotSeatPlayerId);
  const hotSeatColor = getPlayerColor(players, hotSeatPlayerId);

  const btnBase = 'inline-flex items-center justify-center gap-2 rounded-full border-none font-["Heebo",sans-serif] font-bold cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:not-disabled:-translate-y-0.5';

  return (
    <div className="max-w-[900px] mx-auto p-4 flex flex-col gap-4 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <span className="bg-white/[0.07] border border-white/[0.12] px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide">
          🎭 {sessionCode}
        </span>
        {category && (
          <span className="bg-[rgba(78,205,196,0.1)] border border-[rgba(78,205,196,0.3)] px-4 py-1.5 rounded-full text-sm font-bold text-[#4ECDC4]">
            {category.emoji} {category.name}
          </span>
        )}
        <div
          className="px-5 py-2 rounded-full font-bold text-base border"
          style={{ background: `linear-gradient(135deg, ${hotSeatColor}, rgba(255,255,255,0.1))`, borderColor: hotSeatColor }}
        >
          {iAmOnHotSeat ? '🔥 זה התור שלך!' : `🎯 ${hotSeatName} מנחש`}
        </div>
      </div>

      {/* Main area */}
      <div className="grid grid-cols-[1fr_180px] max-sm:grid-cols-1 gap-4 items-start">
        {/* Item / hot-seat / reveal card */}
        <div className="flex items-center justify-center">
          {revealed ? (
            <div className={`bg-white/[0.07] border-2 rounded-2xl p-10 text-center backdrop-blur-sm flex flex-col items-center gap-3 w-full min-h-[220px] justify-center ${revealed.correct ? 'border-[#34D399] shadow-[0_0_30px_rgba(52,211,153,0.3)]' : 'border-[#FF6B6B] shadow-[0_0_30px_rgba(255,107,107,0.3)]'}`}>
              <div className="text-[3rem] font-black text-[#FFE66D]">{revealed.item.name}</div>
              <div className="text-[1.2rem] font-bold">{revealed.correct ? '🎉 נכון! ניצחתם!' : '❌ לא נכון...'}</div>
              <div className="text-[#8892a4] text-sm">{revealed.hotSeatPlayerName} {revealed.correct ? 'ניחש נכון!' : 'לא הצליח לנחש'}</div>
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
          ) : iAmOnHotSeat ? (
            <div className="bg-white/[0.07] border-2 border-[#F97316] rounded-2xl p-10 text-center backdrop-blur-sm flex flex-col items-center gap-3 w-full min-h-[220px] justify-center shadow-[0_0_30px_rgba(249,115,22,0.2)] animate-[hotPulse_2s_ease-in-out_infinite]">
              <div className="text-[5rem]">❓</div>
              <p className="text-[2.5rem] font-black text-[#F97316]">מי אני?</p>
              {category && <p className="text-base font-bold text-[#8892a4]">{category.emoji} {category.name}</p>}
              <p className="text-[#8892a4] text-sm">שאל שאלות כן/לא כדי לגלות!</p>
            </div>
          ) : item ? (
            <div className="bg-white/[0.07] border-2 border-[#4ECDC4] rounded-2xl p-10 text-center backdrop-blur-sm flex flex-col items-center gap-3 w-full min-h-[220px] justify-center shadow-[0_0_30px_rgba(78,205,196,0.15)]">
              <div className="text-sm text-[#8892a4] font-semibold">{category?.emoji} {category?.name}</div>
              <div className="text-[3.5rem] font-black text-[#FFE66D] drop-shadow-[0_0_20px_rgba(255,230,109,0.4)] leading-tight">{item.name}</div>
              <div className="text-[#8892a4] text-sm">רק אתה רואה את זה! 🤫</div>
            </div>
          ) : (
            <div className="bg-white/[0.07] border-2 border-white/[0.12] rounded-2xl p-10 text-center flex flex-col items-center justify-center w-full min-h-[220px]">
              <div className="text-[5rem]">⏳</div>
            </div>
          )}
        </div>

        {/* Players sidebar */}
        <div className="bg-white/[0.07] border border-white/[0.12] rounded-2xl p-4 flex flex-col gap-2 backdrop-blur-sm">
          <h3 className="text-sm text-[#8892a4] font-semibold mb-1">שחקנים</h3>
          {players.map((player, i) => (
            <div
              key={player.id}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors border-r-[3px] ${player.id === hotSeatPlayerId ? 'bg-[rgba(249,115,22,0.1)]' : ''}`}
              style={{ borderRightColor: PLAYER_COLORS[i % PLAYER_COLORS.length] }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-[#1a1a2e] shrink-0"
                style={{ background: PLAYER_COLORS[i % PLAYER_COLORS.length] }}
              >
                {player.name[0]?.toUpperCase()}
              </div>
              <span className="flex-1 text-sm font-semibold">{player.name}</span>
              {player.id === hotSeatPlayerId && <span className="text-sm">🔥</span>}
              {player.isInitiator && <span className="text-sm">👑</span>}
            </div>
          ))}

          {isInitiator && !revealed && questionLog.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/[0.12] flex flex-col gap-1.5">
              <p className="text-[#8892a4] text-xs font-semibold">האם {hotSeatName} ניחש?</p>
              <button
                className="w-full py-1.5 px-2.5 rounded-full font-bold text-sm text-[#1a1a2e] bg-[#34D399] transition-transform hover:scale-[1.04] disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={loadingBtn === 'reveal-correct' || loadingBtn === 'reveal-wrong'}
                onClick={async () => { setLoadingBtn('reveal-correct'); await send('REVEAL_GUESS', { correct: true }); setLoadingBtn(null); }}
              >
                {loadingBtn === 'reveal-correct' ? <span className="inline-block w-4 h-4 border-2 border-[#1a1a2e]/30 border-t-[#1a1a2e] rounded-full animate-spin" /> : '✅ נכון'}
              </button>
              <button
                className="w-full py-1.5 px-2.5 rounded-full font-bold text-sm text-white bg-[#FF6B6B] transition-transform hover:scale-[1.04] disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={loadingBtn === 'reveal-correct' || loadingBtn === 'reveal-wrong'}
                onClick={async () => { setLoadingBtn('reveal-wrong'); await send('REVEAL_GUESS', { correct: false }); setLoadingBtn(null); }}
              >
                {loadingBtn === 'reveal-wrong' ? <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '❌ לא נכון'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Q&A */}
      <div className="bg-white/[0.07] border border-white/[0.12] rounded-2xl p-4 backdrop-blur-sm flex flex-col gap-3 flex-1">
        <div className="max-h-[300px] overflow-y-auto flex flex-col gap-2 scrollbar-thin scrollbar-thumb-white/10">
          {questionLog.length === 0 && (
            <p className="text-center text-[#8892a4] py-6 text-[0.95rem]">
              {iAmOnHotSeat ? 'שאל שאלת כן/לא!' : `ממתין ל${hotSeatName} לשאול שאלה...`}
            </p>
          )}
          {questionLog.map((q, i) => (
            <div key={q.id} className="flex items-start justify-between gap-3 px-3 py-2.5 bg-white/[0.04] rounded-xl flex-wrap">
              <div className="flex gap-2 flex-1">
                <span className="text-[#8892a4] font-bold shrink-0">{i + 1}.</span>
                <span className="text-[0.95rem] leading-snug">{q.text}</span>
              </div>
              {q.answer ? (
                <div className={`px-3 py-1 rounded-full font-bold text-sm shrink-0 ${
                  q.answer === 'כן'    ? 'bg-[rgba(52,211,153,0.2)] text-[#34D399] border border-[#34D399]' :
                  q.answer === 'לא'    ? 'bg-[rgba(255,107,107,0.2)] text-[#FF6B6B] border border-[#FF6B6B]' :
                                         'bg-[rgba(255,230,109,0.2)] text-[#FFE66D] border border-[#FFE66D]'
                }`}>
                  {q.answer}
                </div>
              ) : !iAmOnHotSeat && (
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
          ))}
          <div ref={logEndRef} />
        </div>

        {iAmOnHotSeat && !revealed && (
          <form className="flex gap-3 items-center" onSubmit={submitQuestion}>
            <input
              className="flex-1 bg-white/[0.06] border border-white/[0.12] rounded-xl px-4 py-2.5 text-[#f0f0f0] font-['Heebo',sans-serif] text-base placeholder-[#8892a4] focus:outline-none focus:border-[#4ECDC4] disabled:opacity-50"
              type="text"
              placeholder={questionLog.length >= 10 ? 'הגעת למגבלת 10 שאלות' : 'שאל שאלת כן/לא...'}
              value={question}
              onChange={e => setQuestion(e.target.value)}
              maxLength={100}
              autoFocus
              disabled={questionLog.length >= 10}
            />
            <button
              className="bg-[#4ECDC4] text-[#1a1a2e] px-4 py-2.5 rounded-full font-bold shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-transform hover:not-disabled:-translate-y-0.5"
              type="submit"
              disabled={!question.trim() || questionLog.length >= 10 || loadingBtn === 'ask'}
            >
              {loadingBtn === 'ask' ? <span className="inline-block w-5 h-5 border-2 border-[#1a1a2e]/30 border-t-[#1a1a2e] rounded-full animate-spin" /> : 'שאל ❓'}
            </button>
            <span className={`text-sm shrink-0 min-w-[2.5rem] text-center ${questionLog.length >= 10 ? 'text-[#FF6B6B] font-bold' : 'text-[#8892a4]'}`}>
              {questionLog.length}/10
            </span>
          </form>
        )}
      </div>
    </div>
  );
}
