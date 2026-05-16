import React, { useState, useEffect } from 'react';

const NAV_LINKS = (lang, T) => [
  { id: 'home', label: T('nav_home') },
  { id: 'store', label: T('nav_magazine') },
  { id: 'quiz-lobby', label: T('nav_quiz') },
  { id: 'leaderboard', label: T('nav_leaderboard') },
  { id: 'how-to-play', label: T('nav_howtoplay') },
];

export default function Nav({ currentPage, navigate, isLoggedIn, user, onLogout, accent, lang, setLang, T }) {
  const [scrolled, setScrolled] = useState(false);
  const navBg = scrolled ? 'rgba(10, 12, 22, 0.95)' : 'transparent';
  const bodyFont = lang === 'bn' ? "'Anek Bangla', sans-serif" : 'Inter, sans-serif';

  const userName = user?.name || 'Arif';
  const userAvatar = user?.avatar || 'AH';

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      background: navBg, borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
      backdropFilter: scrolled ? 'blur(16px)' : 'none',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      height: 72, display: 'flex', alignItems: 'center'
    }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
        
        {/* Logo */}
        <div onClick={() => navigate('home')} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 16, color: '#fff',
            boxShadow: `0 4px 15px ${accent}44`
          }}>MC</div>
          <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 20, color: '#F0F2FF', letterSpacing: '-0.5px' }}>MCQuiz</span>
        </div>

        {/* Center Links */}
        <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '4px' }}>
          {NAV_LINKS(lang, T).map(link => {
            const active = currentPage === link.id;
            return (
              <button key={link.id} onClick={() => navigate(link.id)} style={{
                background: active ? 'rgba(124,111,255,0.15)' : 'transparent',
                border: 'none', borderRadius: 12,
                padding: '8px 18px', cursor: 'pointer',
                fontFamily: bodyFont, fontSize: 14, fontWeight: active ? 600 : 400,
                color: active ? '#A78BFA' : '#7A82A8',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => !active && (e.currentTarget.style.color = '#F0F2FF')}
              onMouseLeave={e => !active && (e.currentTarget.style.color = '#7A82A8')}
              >{link.label}</button>
            );
          })}
        </div>

        {/* Right Side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          
          {/* Lang Toggle */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 3 }}>
            {['bn', 'en'].map(l => (
              <button key={l} onClick={() => setLang(l)} style={{
                background: lang === l ? 'rgba(124,111,255,0.2)' : 'transparent',
                border: 'none', borderRadius: 9,
                padding: '6px 14px', cursor: 'pointer',
                fontFamily: l === 'bn' ? "'Anek Bangla', sans-serif" : 'Inter, sans-serif',
                fontSize: 12, fontWeight: lang === l ? 700 : 400,
                color: lang === l ? '#A78BFA' : '#7A82A8',
                transition: 'all 0.2s',
                textTransform: 'uppercase'
              }}>{l === 'bn' ? 'বাং' : 'EN'}</button>
            ))}
          </div>

          {isLoggedIn ? (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button onClick={() => navigate('dashboard')} style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 14, padding: '6px 14px 6px 6px',
                display: 'flex', alignItems: 'center', gap: 10,
                cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: 10,
                  background: 'linear-gradient(135deg, #7C6FFF, #A78BFA)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 12, color: '#fff'
                }}>{userAvatar}</div>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#F0F2FF' }}>{userName}</span>
              </button>
              <button onClick={onLogout} style={{
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 12, padding: '10px 18px',
                fontFamily: bodyFont, fontSize: 13, fontWeight: 600, color: '#EF4444',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'; }}
              >{T('nav_logout')}</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => navigate('login')} style={{
                background: 'transparent', border: 'none',
                fontFamily: bodyFont, fontSize: 14, fontWeight: 600, color: '#7A82A8',
                cursor: 'pointer', padding: '10px 16px'
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#F0F2FF'}
              onMouseLeave={e => e.currentTarget.style.color = '#7A82A8'}
              >{T('nav_login')}</button>
              <button onClick={() => navigate('signup')} style={{
                background: 'linear-gradient(135deg, #7C6FFF, #A78BFA)', border: 'none',
                borderRadius: 12, padding: '10px 22px',
                fontFamily: bodyFont, fontSize: 14, fontWeight: 700, color: '#fff',
                cursor: 'pointer', boxShadow: '0 4px 15px rgba(124,111,255,0.3)'
              }}>{T('nav_getstarted')}</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
