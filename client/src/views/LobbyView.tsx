import { useState } from 'react';
import { send } from '../pusher';
import { useGame } from '../store/gameStore';

const PLAYER_COLORS = ['#FF6B6B','#4ECDC4','#FFE66D','#A78BFA','#F97316','#34D399','#60A5FA','#F472B6','#FBBF24','#6EE7B7'];

export default function LobbyView() {
  const { state } = useGame();
  const { sessionCode, players, isInitiator } = state;
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const shareUrl = `${window.location.origin}${import.meta.env.BASE_URL}?code=${sessionCode}`;

  function copyLink() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="max-w-[560px] mx-auto px-4 py-8 pb-12 flex flex-col gap-6">
      {/* Header */}
      <div className="text-center">
        <div className="text-[3.5rem]">🎭</div>
        <h1 className="text-[2rem] font-black text-[#FFE66D]">חדר המתנה</h1>
      </div>

      {/* Session code */}
      <div className="bg-white/[0.07] border border-white/[0.12] rounded-2xl p-6 text-center flex flex-col gap-3 backdrop-blur-sm">
        <p className="text-[#8892a4] text-sm">קוד המשחק</p>
        <div className="text-[2.5rem] font-black tracking-[0.3em] text-[#FFE66D] drop-shadow-[0_0_20px_rgba(255,230,109,0.4)]">
          {sessionCode}
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold bg-white/[0.07] border border-white/[0.12] text-[#f0f0f0] transition-transform hover:-translate-y-0.5"
          onClick={copyLink}
        >
          {copied ? '✅ הועתק!' : '🔗 העתק קישור'}
        </button>
      </div>

      {/* Players */}
      <div>
        <h2 className="text-[1.1rem] font-bold mb-3 text-[#4ECDC4]">שחקנים ({players.length}/10)</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
          {players.map((player, i) => (
            <div
              key={player.id}
              className="flex items-center gap-3 bg-white/[0.07] border border-white/[0.12] rounded-full py-2 px-4 pr-2"
              style={{ borderRightColor: PLAYER_COLORS[i % PLAYER_COLORS.length], borderRightWidth: 3 }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-base text-[#1a1a2e] shrink-0"
                style={{ background: PLAYER_COLORS[i % PLAYER_COLORS.length] }}
              >
                {player.name[0]?.toUpperCase()}
              </div>
              <span className="flex-1 font-semibold text-[0.95rem]">{player.name}</span>
              {player.isInitiator && <span>👑</span>}
            </div>
          ))}
          {Array.from({ length: Math.max(0, 10 - players.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="flex items-center gap-3 bg-white/[0.07] border border-white/[0.12] rounded-full py-2 px-4 pr-2 opacity-30">
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold bg-[#333] text-[#8892a4] shrink-0">?</div>
              <span className="text-[#8892a4] font-semibold text-[0.95rem]">ממתין...</span>
            </div>
          ))}
        </div>
      </div>

      {/* Start / Wait */}
      {isInitiator ? (
        <div className="flex flex-col gap-4">
          {players.length < 2 ? (
            <p className="text-[#8892a4] text-center">ממתין לשחקנים נוספים... (נדרשים לפחות 2)</p>
          ) : (
            <button
              className="w-full py-4 px-10 rounded-full font-black text-[1.2rem] text-[#1a1a2e] bg-gradient-to-br from-[#34D399] to-[#4ECDC4] shadow-[0_4px_20px_rgba(52,211,153,0.4)] transition-transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading}
              onClick={async () => { setLoading(true); await send('START_GAME'); setLoading(false); }}
            >
              {loading ? <span className="inline-block w-5 h-5 border-2 border-[#1a1a2e]/30 border-t-[#1a1a2e] rounded-full animate-spin" /> : '🚀 התחל משחק!'}
            </button>
          )}
        </div>
      ) : (
        <div className="text-center">
          <div className="w-3.5 h-3.5 bg-[#4ECDC4] rounded-full mx-auto mb-3 animate-[pulse_1.5s_ease-in-out_infinite]" />
          <p className="text-[#8892a4]">ממתין למארגן המשחק שיתחיל...</p>
        </div>
      )}
    </div>
  );
}
