import { useEffect, useMemo, useState } from 'react';
import { send } from '../pusher';
import { useGame } from '../store/gameStore';
import type { Category } from '../types';

const PLAYER_COLORS = ['#FF6B6B','#4ECDC4','#FFE66D','#A78BFA','#F97316','#34D399','#60A5FA','#F472B6','#FBBF24','#6EE7B7'];

function toEditableCategories(categories: Category[]): Category[] {
  return categories.map(category => ({
    ...category,
    items: [...(category.items ?? [])],
  }));
}

function createCustomCategory(): Category {
  return {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: '',
    emoji: '✨',
    items: [''],
    isCustom: true,
  };
}

function getItemText(item: string | { name: string }): string {
  return typeof item === 'string' ? item : item.name;
}

export default function LobbyView() {
  const { state } = useGame();
  const { sessionCode, players, isInitiator, availableCategories, selectedCategoryIds } = state;
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localCategories, setLocalCategories] = useState<Category[]>(() => toEditableCategories(availableCategories));
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedCategoryIds);

  const shareUrl = `${window.location.origin}/guess-who/play?code=${sessionCode}`;

  useEffect(() => {
    setLocalCategories(toEditableCategories(availableCategories));
    setLocalSelectedIds(selectedCategoryIds);
  }, [availableCategories, selectedCategoryIds]);

  const selectedSet = useMemo(() => new Set(localSelectedIds), [localSelectedIds]);
  const builtInCategories = localCategories.filter(category => !category.isCustom);
  const customCategories = localCategories.filter(category => category.isCustom);
  const normalizedLocalState = JSON.stringify({
    categories: localCategories,
    selectedCategoryIds: [...localSelectedIds].sort(),
  });
  const normalizedServerState = JSON.stringify({
    categories: toEditableCategories(availableCategories),
    selectedCategoryIds: [...selectedCategoryIds].sort(),
  });
  const hasUnsavedChanges = normalizedLocalState !== normalizedServerState;
  const hasSelectedCategories = localSelectedIds.length > 0;

  function copyLink() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function toggleCategory(categoryId: string) {
    setLocalSelectedIds(current =>
      current.includes(categoryId)
        ? current.filter(id => id !== categoryId)
        : [...current, categoryId]
    );
  }

  function updateCustomCategory(categoryId: string, patch: Partial<Category>) {
    setLocalCategories(current =>
      current.map(category => category.id === categoryId ? { ...category, ...patch } : category)
    );
  }

  function removeCustomCategory(categoryId: string) {
    setLocalCategories(current => current.filter(category => category.id !== categoryId));
    setLocalSelectedIds(current => current.filter(id => id !== categoryId));
  }

  async function saveSettings() {
    setSaving(true);
    await send('UPDATE_SETTINGS', {
      selectedCategoryIds: localSelectedIds,
      customCategories: customCategories.map(category => ({
        id: category.id,
        name: category.name,
        emoji: category.emoji,
        items: (category.items ?? []).map(item => getItemText(item).trim()).filter(Boolean),
      })),
    });
    setSaving(false);
  }

  const activeCategories = availableCategories.filter(category => selectedCategoryIds.includes(category.id));

  return (
    <div className="max-w-[760px] mx-auto px-4 py-8 pb-12 flex flex-col gap-6">
      <div className="text-center">
        <div className="text-[3.5rem]">🎭</div>
        <h1 className="text-[2rem] font-black text-[#FFE66D]">חדר המתנה</h1>
      </div>

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

      <div className="bg-white/[0.07] border border-white/[0.12] rounded-2xl p-6 backdrop-blur-sm flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-[1.1rem] font-bold text-[#FFE66D]">קטגוריות למשחק</h2>
            <p className="text-sm text-[#8892a4]">
              {activeCategories.length > 0
                ? `${activeCategories.length} קטגוריות פעילות`
                : 'לא נבחרו קטגוריות'}
            </p>
          </div>
          {isInitiator && (
            <span className="px-3 py-1 rounded-full bg-[rgba(78,205,196,0.12)] border border-[rgba(78,205,196,0.3)] text-sm font-bold text-[#4ECDC4]">
              הגדרות מתקדמות
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {activeCategories.map(category => (
            <span key={category.id} className="px-3 py-2 rounded-full bg-white/[0.06] border border-white/[0.12] text-sm font-semibold">
              {category.emoji} {category.name}
            </span>
          ))}
          {activeCategories.length === 0 && (
            <span className="text-sm text-[#FF6B6B] font-semibold">בחר לפחות קטגוריה אחת כדי להתחיל משחק</span>
          )}
        </div>

        {isInitiator ? (
          <div className="flex flex-col gap-5 pt-2 border-t border-white/[0.08]">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
              {builtInCategories.map(category => (
                <label
                  key={category.id}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 cursor-pointer transition-colors ${
                    selectedSet.has(category.id)
                      ? 'bg-[rgba(78,205,196,0.12)] border-[rgba(78,205,196,0.4)]'
                      : 'bg-white/[0.04] border-white/[0.1]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedSet.has(category.id)}
                    onChange={() => toggleCategory(category.id)}
                    className="accent-[#4ECDC4]"
                  />
                  <span className="font-bold">{category.emoji} {category.name}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h3 className="text-base font-bold text-[#f0f0f0]">קטגוריות מותאמות</h3>
              <button
                className="px-4 py-2 rounded-full font-bold text-[#1a1a2e] bg-[#FFE66D] transition-transform hover:-translate-y-0.5"
                onClick={() => {
                  const category = createCustomCategory();
                  setLocalCategories(current => [...current, category]);
                  setLocalSelectedIds(current => [...current, category.id]);
                }}
              >
                + הוסף קטגוריה
              </button>
            </div>

            {customCategories.length === 0 && (
              <div className="rounded-2xl border border-dashed border-white/[0.14] p-4 text-sm text-[#8892a4]">
                אפשר להוסיף קטגוריה משלך עם שם, אימוג'י ורשימת מילים.
              </div>
            )}

            <div className="flex flex-col gap-4">
              {customCategories.map(category => (
                <div key={category.id} className="rounded-2xl border border-white/[0.12] bg-white/[0.04] p-4 flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <label className="inline-flex items-center gap-2 text-sm font-semibold text-[#4ECDC4]">
                      <input
                        type="checkbox"
                        checked={selectedSet.has(category.id)}
                        onChange={() => toggleCategory(category.id)}
                        className="accent-[#4ECDC4]"
                      />
                      כלול במשחק
                    </label>
                    <button
                      className="px-3 py-1.5 rounded-full text-sm font-bold bg-[rgba(255,107,107,0.16)] border border-[rgba(255,107,107,0.35)] text-[#FF6B6B]"
                      onClick={() => removeCustomCategory(category.id)}
                    >
                      הסר
                    </button>
                  </div>

                  <div className="grid grid-cols-[90px_1fr] max-sm:grid-cols-1 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-[#8892a4]">אימוג'י</label>
                      <input
                        className="bg-white/[0.06] border border-white/[0.12] rounded-xl px-3 py-3 text-center text-xl"
                        type="text"
                        maxLength={2}
                        value={category.emoji}
                        onChange={e => updateCustomCategory(category.id, { emoji: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-[#8892a4]">שם קטגוריה</label>
                      <input
                        className="bg-white/[0.06] border border-white/[0.12] rounded-xl px-4 py-3 text-[#f0f0f0] placeholder-[#8892a4] focus:outline-none focus:border-[#4ECDC4]"
                        type="text"
                        maxLength={30}
                        placeholder="למשל: דמויות מסרטים"
                        value={category.name}
                        onChange={e => updateCustomCategory(category.id, { name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-[#8892a4]">מילים, אחת בכל שורה</label>
                    <textarea
                      className="min-h-[140px] bg-white/[0.06] border border-white/[0.12] rounded-xl px-4 py-3 text-[#f0f0f0] placeholder-[#8892a4] focus:outline-none focus:border-[#4ECDC4]"
                      placeholder={'באטמן\nסופרמן\nוונדר וומן'}
                      value={(category.items ?? []).join('\n')}
                      onChange={e => updateCustomCategory(category.id, { items: e.target.value.split('\n') })}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className={`text-sm ${hasUnsavedChanges ? 'text-[#FFE66D]' : 'text-[#8892a4]'}`}>
                {hasUnsavedChanges ? 'יש שינויים שלא נשמרו' : 'ההגדרות מסונכרנות עם החדר'}
              </p>
              <button
                className="px-5 py-3 rounded-full font-black text-[#1a1a2e] bg-gradient-to-br from-[#FFE66D] to-[#FBBF24] disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={saveSettings}
                disabled={saving || !hasUnsavedChanges || !hasSelectedCategories}
              >
                {saving ? 'שומר...' : 'שמור הגדרות'}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[#8892a4]">רק מארגן המשחק יכול לשנות את הקטגוריות לפני תחילת המשחק.</p>
        )}
      </div>

      {isInitiator ? (
        <div className="flex flex-col gap-4">
          {players.length < 4 ? (
            <p className="text-[#8892a4] text-center">ממתין לשחקנים נוספים... (נדרשים לפחות 4 לחלוקה לקבוצות)</p>
          ) : (
            <button
              className="w-full py-4 px-10 rounded-full font-black text-[1.2rem] text-[#1a1a2e] bg-gradient-to-br from-[#34D399] to-[#4ECDC4] shadow-[0_4px_20px_rgba(52,211,153,0.4)] transition-transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading || saving || hasUnsavedChanges || !hasSelectedCategories || players.length < 4}
              onClick={async () => { setLoading(true); await send('START_GAME'); setLoading(false); }}
            >
              {loading ? <span className="inline-block w-5 h-5 border-2 border-[#1a1a2e]/30 border-t-[#1a1a2e] rounded-full animate-spin" /> : '🚀 התחל משחק!'}
            </button>
          )}
          {hasUnsavedChanges && <p className="text-center text-sm text-[#FFE66D]">שמור את ההגדרות לפני שמתחילים.</p>}
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
