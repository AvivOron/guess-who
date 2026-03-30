import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { send } from '../pusher';
import { useGame } from '../store/gameStore';
export default function HomeView() {
    const { dispatch } = useGame();
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [tab, setTab] = useState('create');
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
        if (!name.trim())
            return;
        dispatch({ type: 'SET_MY_NAME', payload: name.trim() });
        send('CREATE_SESSION', { playerName: name.trim() });
    }
    function handleJoin(e) {
        e.preventDefault();
        if (!name.trim() || !code.trim())
            return;
        dispatch({ type: 'SET_MY_NAME', payload: name.trim() });
        send('JOIN_SESSION', { code: code.trim().toUpperCase(), playerName: name.trim() });
    }
    const tabBase = 'flex-1 py-4 border-none bg-transparent text-[#8892a4] font-semibold text-[0.95rem] cursor-pointer transition-all';
    const tabActive = 'text-[#f0f0f0] bg-white/5 border-b-2 border-[#FF6B6B]';
    return (_jsxs("div", { className: "max-w-[480px] mx-auto px-4 py-8 pb-12 flex flex-col gap-6", children: [_jsxs("div", { className: "text-center py-8", children: [_jsx("div", { className: "text-[5rem] animate-[float_3s_ease-in-out_infinite]", children: "\uD83C\uDFAD" }), _jsx("h1", { className: "text-[2.8rem] font-black leading-[1.1] bg-gradient-to-br from-[#FF6B6B] via-[#FFE66D] to-[#4ECDC4] bg-clip-text text-transparent", children: "\u05E0\u05D9\u05D7\u05D5\u05E9 \u05DE\u05D9?" }), _jsx("p", { className: "text-[#8892a4] text-lg mt-2", children: "\u05DE\u05E9\u05D7\u05E7 \u05D4\u05E0\u05D9\u05D7\u05D5\u05E9\u05D9\u05DD \u05D1\u05E7\u05D1\u05D5\u05E6\u05D4" })] }), _jsxs("div", { className: "bg-white/[0.07] border border-white/[0.12] rounded-2xl overflow-hidden backdrop-blur-xl", children: [_jsxs("div", { className: "grid grid-cols-2 border-b border-white/[0.12]", children: [_jsx("button", { className: `${tabBase} ${tab === 'create' ? tabActive : ''}`, onClick: () => setTab('create'), children: "\u05E6\u05D5\u05E8 \u05DE\u05E9\u05D7\u05E7 \u05D7\u05D3\u05E9" }), _jsx("button", { className: `${tabBase} ${tab === 'join' ? tabActive : ''}`, onClick: () => setTab('join'), children: "\u05D4\u05E6\u05D8\u05E8\u05E3 \u05DC\u05DE\u05E9\u05D7\u05E7" })] }), _jsxs("div", { className: "p-6 flex flex-col gap-4", children: [_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "font-semibold text-sm text-[#8892a4]", children: "\u05D4\u05E9\u05DD \u05E9\u05DC\u05DA" }), _jsx("input", { className: "bg-white/[0.06] border border-white/[0.12] rounded-xl px-4 py-3 text-[#f0f0f0] font-['Heebo',sans-serif] text-base placeholder-[#8892a4] focus:outline-none focus:border-[#4ECDC4] transition-colors", type: "text", placeholder: "\u05D4\u05DB\u05E0\u05E1 \u05D0\u05EA \u05E9\u05DE\u05DA...", value: name, onChange: e => setName(e.target.value), maxLength: 20 })] }), tab === 'join' && (_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "font-semibold text-sm text-[#8892a4]", children: "\u05E7\u05D5\u05D3 \u05DE\u05E9\u05D7\u05E7" }), _jsx("input", { className: "bg-white/[0.06] border border-white/[0.12] rounded-xl px-4 py-3 text-[#f0f0f0] font-['Heebo',sans-serif] text-[1.3rem] font-bold tracking-[0.3em] text-center placeholder-[#8892a4] focus:outline-none focus:border-[#4ECDC4] transition-colors uppercase", type: "text", placeholder: "XXXXXX", value: code, onChange: e => setCode(e.target.value.toUpperCase()), maxLength: 6 })] })), _jsx("button", { className: "w-full py-4 px-8 rounded-full font-bold text-[1.1rem] text-white bg-gradient-to-br from-[#FF6B6B] to-[#F97316] shadow-[0_4px_15px_rgba(255,107,107,0.3)] transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none", onClick: tab === 'create' ? handleCreate : handleJoin, disabled: !name.trim() || (tab === 'join' && !code.trim()), children: tab === 'create' ? '🎮 צור משחק' : '🚀 הצטרף' })] })] }), _jsxs("div", { className: "bg-white/[0.07] border border-white/[0.12] rounded-2xl p-6 backdrop-blur-sm", children: [_jsx("h3", { className: "text-[1.1rem] font-bold mb-3 text-[#FFE66D]", children: "\u05D0\u05D9\u05DA \u05DE\u05E9\u05D7\u05E7\u05D9\u05DD?" }), _jsx("ul", { className: "flex flex-col gap-2", children: [
                            '🃏 כל שחקן בתורו מקבל מילה סודית – אבל הוא לא רואה אותה!',
                            '❓ השחקן שואל שאלות כן/לא כדי לנחש מה המילה',
                            '👀 שאר השחקנים רואים את המילה ועונים על השאלות',
                            '🏆 מי שינחש הכי מהר מנצח!',
                        ].map((rule, i) => (_jsx("li", { className: "text-[0.95rem] leading-snug", children: rule }, i))) })] })] }));
}
