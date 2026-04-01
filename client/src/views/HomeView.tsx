import { useState, useEffect } from 'react';
import { send } from '../pusher';
import { useGame } from '../store/gameStore';

export default function HomeView() {
  const { dispatch } = useGame();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlCode = params.get('code');
    if (urlCode) {
      setCode(urlCode.toUpperCase());
      setTab('join');
    }
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    dispatch({ type: 'SET_MY_NAME', payload: name.trim() });
    setLoading(true);
    await send('CREATE_SESSION', { playerName: name.trim() });
    setLoading(false);
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    dispatch({ type: 'SET_MY_NAME', payload: name.trim() });
    setLoading(true);
    await send('JOIN_SESSION', { code: code.trim().toUpperCase(), playerName: name.trim() });
    setLoading(false);
  }

  const tabBase = 'flex-1 py-4 border-none bg-transparent text-[#8892a4] font-semibold text-[0.95rem] cursor-pointer transition-all';
  const tabActive = 'text-[#f0f0f0] bg-white/5 border-b-2 border-[#FF6B6B]';

  return (
    <div className="max-w-[480px] mx-auto px-4 py-8 pb-12 flex flex-col gap-6">
      {/* Hero */}
      <div className="text-center py-8">
        <div className="text-[5rem] animate-[float_3s_ease-in-out_infinite]">🎭</div>
        <h1 className="text-[2.8rem] font-black leading-[1.1] bg-gradient-to-br from-[#FF6B6B] via-[#FFE66D] to-[#4ECDC4] bg-clip-text text-transparent">
          נחש מי?
        </h1>
        <p className="text-[#8892a4] text-lg mt-2">משחק הניחושים בקבוצה</p>
      </div>

      {/* Card */}
      <div className="bg-white/[0.07] border border-white/[0.12] rounded-2xl overflow-hidden backdrop-blur-xl">
        <div className="grid grid-cols-2 border-b border-white/[0.12]">
          <button className={`${tabBase} ${tab === 'create' ? tabActive : ''}`} onClick={() => setTab('create')}>
            צור משחק חדש
          </button>
          <button className={`${tabBase} ${tab === 'join' ? tabActive : ''}`} onClick={() => setTab('join')}>
            הצטרף למשחק
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-sm text-[#8892a4]">השם שלך</label>
            <input
              className="bg-white/[0.06] border border-white/[0.12] rounded-xl px-4 py-3 text-[#f0f0f0] font-['Heebo',sans-serif] text-base placeholder-[#8892a4] focus:outline-none focus:border-[#4ECDC4] transition-colors"
              type="text"
              placeholder="הכנס את שמך..."
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={20}
            />
          </div>

          {tab === 'join' && (
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-sm text-[#8892a4]">קוד משחק</label>
              <input
                className="bg-white/[0.06] border border-white/[0.12] rounded-xl px-4 py-3 text-[#f0f0f0] font-['Heebo',sans-serif] text-[1.3rem] font-bold tracking-[0.3em] text-center placeholder-[#8892a4] focus:outline-none focus:border-[#4ECDC4] transition-colors uppercase"
                type="text"
                placeholder="XXXXXX"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                maxLength={6}
              />
            </div>
          )}

          <button
            className="w-full py-4 px-8 rounded-full font-bold text-[1.1rem] text-white bg-gradient-to-br from-[#FF6B6B] to-[#F97316] shadow-[0_4px_15px_rgba(255,107,107,0.3)] transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
            onClick={tab === 'create' ? handleCreate : handleJoin}
            disabled={loading || !name.trim() || (tab === 'join' && !code.trim())}
          >
            {loading ? <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : tab === 'create' ? '🎮 צור משחק' : '🚀 הצטרף'}
          </button>
        </div>
      </div>

      {/* Rules */}
      <div className="bg-white/[0.07] border border-white/[0.12] rounded-2xl p-6 backdrop-blur-sm">
        <h3 className="text-[1.1rem] font-bold mb-3 text-[#FFE66D]">איך משחקים?</h3>
        <ul className="flex flex-col gap-2">
          {[
            '🃏 כל שחקן בתורו מקבל מילה סודית – אבל הוא לא רואה אותה!',
            '❓ השחקן שואל שאלות כן/לא כדי לנחש מה המילה',
            '👀 שאר השחקנים רואים את המילה ועונים על השאלות',
            '🏆 מי שינחש הכי מהר מנצח!',
          ].map((rule, i) => (
            <li key={i} className="text-[0.95rem] leading-snug">{rule}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
