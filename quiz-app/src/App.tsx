import React, { useState, useEffect } from 'react';
import HomePage from './components/HomePage';
import MagazineStore from './components/MagazineStore';
import QuizLobby from './components/QuizLobby';
import LiveQuiz from './components/LiveQuiz';
import Leaderboard from './components/Leaderboard';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';
import PaymentGateway from './components/PaymentGateway';
import Nav from './components/Nav';
import HowToPlay from './components/HowToPlay';
import { t } from './components/translations';
import MCQUIZ_API from './components/api';

const TWEAK_DEFAULTS = {
  "accentColor": "#7C6FFF",
  "goldColor": "#D4A843",
  "bgColor": "#0C0E1A",
  "activeAccent": "#10B981"
};

function MeshGradient() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <radialGradient id="g1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7C6FFF" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#7C6FFF" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="g2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4F9CF9" stopOpacity="0.20" />
            <stop offset="100%" stopColor="#4F9CF9" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="g3" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#D4A843" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#D4A843" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="g4" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#EC4899" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#EC4899" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse className="blob1" cx="15%" cy="20%" rx="45%" ry="40%" fill="url(#g1)" />
        <ellipse className="blob2" cx="85%" cy="15%" rx="42%" ry="38%" fill="url(#g2)" />
        <ellipse className="blob3" cx="75%" cy="80%" rx="48%" ry="42%" fill="url(#g3)" />
        <ellipse className="blob4" cx="20%" cy="85%" rx="38%" ry="34%" fill="url(#g4)" />
        <ellipse className="blob5" cx="50%" cy="50%" rx="35%" ry="30%" fill="url(#g1)" />
      </svg>
      <style>{`
        .blob1 { animation: b1 18s ease-in-out infinite alternate; }
        .blob2 { animation: b2 22s ease-in-out infinite alternate; }
        .blob3 { animation: b3 20s ease-in-out infinite alternate; }
        .blob4 { animation: b4 25s ease-in-out infinite alternate; }
        .blob5 { animation: b5 16s ease-in-out infinite alternate; }
        @keyframes b1 { 0%{cx:15%;cy:20%;rx:38%;ry:32%} 50%{cx:25%;cy:30%;rx:44%;ry:36%} 100%{cx:10%;cy:15%;rx:35%;ry:28%} }
        @keyframes b2 { 0%{cx:80%;cy:15%;rx:35%;ry:30%} 50%{cx:70%;cy:25%;rx:42%;ry:34%} 100%{cx:85%;cy:10%;rx:30%;ry:26%} }
        @keyframes b3 { 0%{cx:70%;cy:75%;rx:40%;ry:34%} 50%{cx:60%;cy:65%;rx:46%;ry:38%} 100%{cx:75%;cy:80%;rx:36%;ry:30%} }
        @keyframes b4 { 0%{cx:20%;cy:80%;rx:32%;ry:28%} 50%{cx:30%;cy:70%;rx:38%;ry:32%} 100%{cx:15%;cy:85%;rx:28%;ry:24%} }
        @keyframes b5 { 0%{cx:50%;cy:48%;rx:28%;ry:24%} 50%{cx:45%;cy:52%;rx:34%;ry:28%} 100%{cx:55%;cy:44%;rx:24%;ry:20%} }
      `}</style>
    </div>
  );
}

export default function App() {
  const saved = (() => { try { return JSON.parse(localStorage.getItem('mcquiz_state3') || '{}'); } catch { return {}; } })();
  const [page, setPage] = useState(saved.page || 'home');
  const [isLoggedIn, setIsLoggedIn] = useState(saved.isLoggedIn || false);
  const [purchasedMags, setPurchasedMags] = useState(saved.purchasedMags || []);
  const [payingMag, setPayingMag] = useState(null);
  const [lang, setLang] = useState(saved.lang || 'bn');
  const [tweaks, setTweaks] = useState(TWEAK_DEFAULTS);
  const [user, setUser] = useState<any>(null);
  const [magazines, setMagazines] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tweakVisible, setTweakVisible] = useState(false);

  const hasPurchased = purchasedMags.length > 0;
  const accent = hasPurchased ? tweaks.activeAccent : tweaks.accentColor;
  
  // T helper function
  const T = (key: string) => t(lang, key);

  const bodyFont = lang === 'bn' ? "'Anek Bangla', sans-serif" : 'Inter, sans-serif';

  useEffect(() => {
    localStorage.setItem('mcquiz_state3', JSON.stringify({ page, isLoggedIn, purchasedMags, lang }));
  }, [page, isLoggedIn, purchasedMags, lang]);

  const refreshData = async () => {
    try {
      const [u, mags, qzs, lb] = await Promise.all([
        MCQUIZ_API.getMe(),
        MCQUIZ_API.getMagazines(),
        MCQUIZ_API.getQuizzes(),
        MCQUIZ_API.getLeaderboard()
      ]);
      if (u) {
        setIsLoggedIn(true);
        setUser(u.user);
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
      if (mags) setMagazines(mags);
      if (qzs) setQuizzes(qzs);
      if (lb) setLeaderboard(lb);
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setLoading(false);
    }
  };
  const openPdf = (path: string) => {
    if (!path) return;
    const base = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:8000';
    const url = path.startsWith('http') ? path : `${base}/storage/${path}`;
    window.open(url, '_blank');
  };
  // Initial Data Fetch
  useEffect(() => {
    refreshData();
  }, []);

  const navigate = (p: string, extra?: any) => {
    if (p === 'buy-magazine') {
      if (!isLoggedIn) { setPage('signup'); window.scrollTo({ top: 0 }); return; }
      setPayingMag(extra);
      setPage('payment');
    } else {
      setPage(p);
    }
    window.scrollTo({ top: 0 });
  };

  const handlePurchaseSuccess = (magId: number) => {
    setPurchasedMags(prev => prev.includes(magId) ? prev : [...prev, magId]);
    refreshData();
    navigate('dashboard');
  };

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === '__activate_edit_mode') setTweakVisible(true);
      if (e.data?.type === '__deactivate_edit_mode') setTweakVisible(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  const applyTweak = (key: string, value: string) => {
    const next = { ...tweaks, [key]: value };
    setTweaks(next as typeof TWEAK_DEFAULTS);
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [key]: value } }, '*');
  };

  const commonProps = { navigate, isLoggedIn, hasPurchased, lang, T, magazines, quizzes, leaderboard, purchasedMags, openPdf };

  const pages: Record<string, React.ReactNode> = {
    'home': <HomePage {...commonProps} />,
    'store': <MagazineStore {...commonProps} purchasedMags={purchasedMags} magazines={magazines} />,
    'quiz-lobby': <QuizLobby {...commonProps} quizzes={quizzes} />,
    'live-quiz': <LiveQuiz navigate={navigate} lang={lang} T={T} quizId={quizzes[0]?.id} />,
    'leaderboard': <Leaderboard navigate={navigate} lang={lang} T={T} leaderboard={leaderboard} />,
    'dashboard': isLoggedIn
      ? <Dashboard navigate={navigate} user={user} magazines={magazines} purchasedMags={purchasedMags} lang={lang} T={T} />
      : <Auth mode="login" navigate={navigate} onLogin={() => { refreshData(); navigate('home'); }} lang={lang} T={T} />,
    'how-to-play': <HowToPlay {...commonProps} />,
    'login': <Auth mode="login" navigate={navigate} onLogin={() => { refreshData(); navigate('home'); }} lang={lang} T={T} />,
    'signup': <Auth mode="signup" navigate={navigate} onLogin={() => { refreshData(); navigate('home'); }} lang={lang} T={T} />,
    'payment': payingMag
      ? <PaymentGateway magazine={payingMag} navigate={navigate} onSuccess={handlePurchaseSuccess} lang={lang} T={T} />
      : null,
  };

  const showNav = page !== 'live-quiz';

  return (
    <div style={{ minHeight: '100vh', background: tweaks.bgColor, fontFamily: bodyFont, position: 'relative' }}>
      {loading && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: '#0C0E1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 40, height: 40, border: '3px solid rgba(124,111,255,0.1)', borderTopColor: '#7C6FFF', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 16 }} />
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, color: '#A78BFA' }}>MCQuiz</div>
          </div>
        </div>
      )}
      <MeshGradient />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {showNav && (
          <Nav currentPage={page} navigate={navigate} isLoggedIn={isLoggedIn} user={user}
            onLogout={() => { setIsLoggedIn(false); setUser(null); navigate('home'); }}
            accent={accent} lang={lang} setLang={setLang} T={T} />
        )}

        <div key={page + lang} style={{ animation: 'fadeIn 0.25s ease' }}>
          {pages[page] || pages['home']}
        </div>

        {showNav && page !== 'login' && page !== 'signup' && page !== 'payment' && (
          <footer style={{ background: 'rgba(8,10,21,0.95)', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '48px 24px' }}>
            <div style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 14, color: '#fff' }}>MC</div>
                  <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 18, color: '#F0F2FF' }}>MCQuiz</span>
                </div>
                <p style={{ fontFamily: bodyFont, fontSize: 13, color: '#7A82A8', lineHeight: 1.7, margin: '0 0 16px', maxWidth: 260 }}>{T('footer_desc')}</p>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#555C7A' }}>© 2026 MCQuiz. All rights reserved.</div>
              </div>
              {[
                { title: T('footer_platform'), links: [[T('nav_magazine'), 'store'], [T('nav_quiz'), 'quiz-lobby'], [T('nav_leaderboard'), 'leaderboard']] },
                { title: T('footer_learn'), links: [[T('nav_howtoplay'), 'how-to-play'], [T('footer_quiz_rules'), 'how-to-play'], [T('footer_prize_guide'), 'how-to-play']] },
                { title: T('footer_account'), links: [[T('footer_sign_up'), 'signup'], [T('footer_login'), 'login'], [T('footer_dashboard'), 'dashboard']] },
              ].map(col => (
                <div key={col.title}>
                  <div style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 14, color: '#F0F2FF', marginBottom: 16 }}>{col.title}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {col.links.map(([label, p]) => (
                      <span key={label} onClick={() => navigate(p as string)} style={{ fontFamily: bodyFont, fontSize: 13, color: '#7A82A8', cursor: 'pointer', transition: 'color 0.2s' }}
                        onMouseEnter={e => (e.target as HTMLElement).style.color = '#F0F2FF'}
                        onMouseLeave={e => (e.target as HTMLElement).style.color = '#7A82A8'}>{label}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </footer>
        )}
      </div>

      {/* Tweaks Panel */}
      {tweakVisible && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: 'rgba(20,23,42,0.97)', backdropFilter: 'blur(20px)', border: '1px solid rgba(124,111,255,0.3)', borderRadius: 18, padding: '22px 22px', width: 260, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 15, color: '#F0F2FF', marginBottom: 18 }}>Tweaks</div>
          {[
            { label: 'Default Accent', key: 'accentColor' },
            { label: 'Post-Purchase Accent', key: 'activeAccent' },
            { label: 'Prize Gold', key: 'goldColor' },
            { label: 'Background', key: 'bgColor' },
          ].map(({ label, key }) => (
            <div key={key} style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#8B90B0' }}>{label}</span>
              <input type="color" value={tweaks[key as keyof typeof TWEAK_DEFAULTS]} onChange={e => applyTweak(key, e.target.value)} style={{ width: 32, height: 24, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'none', padding: 0 }} />
            </div>
          ))}
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#8B90B0', marginBottom: 8 }}>Language / ভাষা</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['bn', 'en'].map(l => (
                <button key={l} onClick={() => setLang(l)} style={{ flex: 1, background: lang === l ? 'rgba(124,111,255,0.2)' : 'rgba(255,255,255,0.04)', border: `1px solid ${lang === l ? 'rgba(124,111,255,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 8, padding: '7px', color: lang === l ? '#A78BFA' : '#7A82A8', fontFamily: l === 'bn' ? "'Anek Bangla', sans-serif" : 'Inter, sans-serif', fontSize: 13, fontWeight: lang === l ? 700 : 400, cursor: 'pointer' }}>
                  {l === 'bn' ? 'বাংলা' : 'English'}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#8B90B0', marginBottom: 8 }}>Simulate Purchase</div>
            <button onClick={() => { if (hasPurchased) setPurchasedMags([]); else { setPurchasedMags([1]); navigate('home'); } }} style={{ width: '100%', background: hasPurchased ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)', border: `1px solid ${hasPurchased ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`, borderRadius: 8, padding: '8px', color: hasPurchased ? '#EF4444' : '#10B981', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {hasPurchased ? 'Reset to Pre-Purchase' : 'Simulate Purchase'}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; }
        input::placeholder { color: #555C7A; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0C0E1A; }
        ::-webkit-scrollbar-thumb { background: rgba(124,111,255,0.3); border-radius: 3px; }
        select option { background: #1C2040; }
      `}</style>
    </div>
  );
}
