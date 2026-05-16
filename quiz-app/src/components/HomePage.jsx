import React, { useState, useEffect } from 'react';
import { MCQUIZ_DATA } from './data';

function CountdownTimer({ targetDate, compact, lang }) {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = new Date(targetDate + 'T23:59:59') - new Date();
      if (diff <= 0) { setTime({ d: 0, h: 0, m: 0, s: 0 }); return; }
      setTime({ d: Math.floor(diff / 86400000), h: Math.floor(diff % 86400000 / 3600000), m: Math.floor(diff % 3600000 / 60000), s: Math.floor(diff % 60000 / 1000) });
    };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, [targetDate]);

  const labels = lang === 'bn' ? ['দিন', 'ঘণ্টা', 'মিনিট', 'সেকেন্ড'] : ['Days', 'Hours', 'Mins', 'Secs'];

  if (compact) return (
    <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: '#D4A843' }}>
      {time.d}d {String(time.h).padStart(2, '0')}h {String(time.m).padStart(2, '0')}m {String(time.s).padStart(2, '0')}s
    </span>
  );

  const Box = ({ v, label }) => (
    <div style={{ textAlign: 'center' }}>
      <div style={{ 
        background: 'rgba(28,32,64,0.8)', 
        border: '1px solid rgba(124,111,255,0.25)', 
        borderRadius: 14, padding: '12px 14px', 
        minWidth: 64, fontFamily: 'Space Grotesk, sans-serif', 
        fontWeight: 800, fontSize: 32, color: '#A78BFA', 
        lineHeight: 1, boxShadow: '0 4px 15px rgba(0,0,0,0.2)' 
      }}>
        {String(v).padStart(2, '0')}
      </div>
      <div style={{ fontFamily: lang === 'bn' ? "'Anek Bangla', sans-serif" : 'Inter, sans-serif', fontSize: 11, color: '#7A82A8', marginTop: 8, letterSpacing: '0.05em' }}>{label}</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <Box v={time.d} label={labels[0]} />
      <div style={{ color: '#555C7A', fontSize: 24, fontWeight: 700, paddingTop: 14 }}>:</div>
      <Box v={time.h} label={labels[1]} />
      <div style={{ color: '#555C7A', fontSize: 24, fontWeight: 700, paddingTop: 14 }}>:</div>
      <Box v={time.m} label={labels[2]} />
      <div style={{ color: '#555C7A', fontSize: 24, fontWeight: 700, paddingTop: 14 }}>:</div>
      <Box v={time.s} label={labels[3]} />
    </div>
  );
}

function MiniLeaderboard({ navigate, lang, T, leaderboard }) {
  const medals = { 1: '#D4A843', 2: '#A8A8B3', 3: '#CD7F32' };
  const VISIBLE = 7;
  const rowH = 60;
  const list = leaderboard || [];
  const maxScroll = Math.max(0, (list.length - VISIBLE) * rowH);
  const [scrollTop, setScrollTop] = useState(0);
  const bodyFont = lang === 'bn' ? "'Anek Bangla', sans-serif" : 'Inter, sans-serif';

  return (
    <div style={{ padding: '80px 24px' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 36, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontFamily: bodyFont, fontSize: 13, color: '#7C6FFF', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>{T('lb_month')} · HALL OF FAME</div>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 36, color: '#F0F2FF', margin: 0, letterSpacing: '-1.2px' }}>{T('lb_top_winners')}</h2>
          </div>
          <button onClick={() => navigate('leaderboard')} style={{ background: 'transparent', border: '1px solid rgba(124,111,255,0.25)', borderRadius: 10, padding: '10px 22px', color: '#A78BFA', fontFamily: bodyFont, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,111,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(124,111,255,0.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(124,111,255,0.25)'; }}>{T('lb_view_full')}</button>
        </div>

        <div style={{ background: 'rgba(28,32,64,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 24, overflow: 'hidden', backdropFilter: 'blur(16px)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 100px 140px 140px', padding: '16px 28px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {[T('lb_rank'), T('lb_participant'), T('lb_score'), T('lb_district'), T('lb_prize')].map((h) => (
              <div key={h} style={{ fontFamily: bodyFont, fontSize: 12, color: '#7A82A8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
            ))}
          </div>

          <div style={{ height: VISIBLE * rowH, overflow: 'hidden' }}
            onWheel={(e) => { e.preventDefault(); setScrollTop((t) => Math.min(maxScroll, Math.max(0, t + e.deltaY))); }}>
            <div style={{ transform: `translateY(-${scrollTop}px)`, transition: 'transform 0.2s cubic-bezier(0.2, 0, 0.2, 1)' }}>
              {list.map((p, i) => {
                const mc = medals[p.rank];
                const isPrize = p.prize && p.prize !== '—';
                return (
                  <div key={p.rank} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 100px 140px 140px', padding: '0 28px', height: rowH, alignItems: 'center', borderBottom: i < list.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', background: p.rank <= 3 ? `${mc}08` : 'transparent' }}>
                    <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 16, color: mc || '#7A82A8' }}>
                      {p.rank <= 3 ? ['🥇', '🥈', '🥉'][p.rank - 1] : `#${p.rank}`}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: mc ? `${mc}20` : 'rgba(124,111,255,0.1)', border: `1px solid ${mc ? mc + '40' : 'rgba(124,111,255,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 12, color: mc || '#A78BFA' }}>{p.avatar || p.name[0]}</div>
                      <span style={{ fontFamily: bodyFont, fontWeight: 600, fontSize: 15, color: '#F0F2FF' }}>{p.name}</span>
                    </div>
                    <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 16, color: '#A78BFA' }}>{p.score}</div>
                    <div style={{ fontFamily: bodyFont, fontSize: 14, color: '#7A82A8' }}>{p.district}</div>
                    <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 14, color: isPrize ? '#D4A843' : '#555C7A' }}>{p.prize || '—'}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ padding: '12px 28px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: bodyFont, fontSize: 12, color: '#555C7A' }}>{T('lb_scroll')}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setScrollTop((t) => Math.max(0, t - rowH * 3))} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, width: 32, height: 32, color: '#7A82A8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↑</button>
              <button onClick={() => setScrollTop((t) => Math.min(maxScroll, t + rowH * 3))} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, width: 32, height: 32, color: '#7A82A8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↓</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HomePage({ navigate, isLoggedIn, hasPurchased, lang, T, magazines, leaderboard }) {
  const featured = magazines?.[0] || { name: 'MCQuiz', month: '...', topics: [] };
  const bodyFont = lang === 'bn' ? "'Anek Bangla', sans-serif" : 'Inter, sans-serif';

  return (
    <div style={{ minHeight: '100vh', color: '#F0F2FF' }}>
      <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '120px 24px 80px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 60, alignItems: 'center', width: '100%' }}>
          
          {/* Left Column: Hero Text */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(124,111,255,0.1)', border: '1px solid rgba(124,111,255,0.25)', borderRadius: 50, padding: '6px 16px', marginBottom: 28 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 10px #22C55E', animation: 'pulse 2s infinite' }} />
              <span style={{ fontFamily: bodyFont, fontSize: 13, color: '#A78BFA', fontWeight: 500 }}>{T('hero_badge')}</span>
            </div>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 'clamp(36px, 5vw, 68px)', lineHeight: 1.1, color: '#F0F2FF', margin: '0 0 24px', letterSpacing: '-2px' }}>
              {T('hero_h1_line1')}<br />
              {T('hero_h1_line2')}<br />
              <span style={{ color: '#D4A843' }}>{T('hero_h1_line3')}</span>
            </h1>
            <p style={{ fontFamily: bodyFont, fontSize: 18, color: '#8B90B0', lineHeight: 1.75, margin: '0 0 40px', maxWidth: 540 }}>
              {T('hero_desc')} <strong style={{ color: '#D4A843' }}>{T('hero_prize_text')}</strong>।
            </p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <button onClick={() => navigate(isLoggedIn ? 'store' : 'signup')} style={{ 
                background: 'linear-gradient(135deg, #7C6FFF, #A78BFA)', border: 'none', 
                borderRadius: 14, padding: '14px 32px', color: '#fff', 
                fontFamily: bodyFont, fontSize: 16, fontWeight: 700, 
                cursor: 'pointer', boxShadow: '0 8px 25px rgba(124,111,255,0.4)', 
                transition: 'all 0.3s' 
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(124,111,255,0.5)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(124,111,255,0.4)'; }}>
                {T('hero_btn_get')}</button>
              <button onClick={() => navigate('how-to-play')} style={{ 
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: 14, padding: '14px 28px', color: '#F0F2FF', 
                fontFamily: bodyFont, fontSize: 16, fontWeight: 600, 
                cursor: 'pointer', transition: 'all 0.3s' 
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}>
                {T('hero_btn_how')}</button>
            </div>
            
            {/* Stats row */}
            <div style={{ display: 'flex', gap: 40, marginTop: 52, alignItems: 'center' }}>
              {[
                ['১২,০০০+', T('hero_members')], 
                ['৳১,৫০,০০০+', T('hero_prizes_paid')], 
                ['২৪', T('hero_editions')]
              ].map(([v, l]) => (
                <div key={l}>
                  <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 28, color: '#F0F2FF', lineHeight: 1 }}>{v}</div>
                  <div style={{ fontFamily: bodyFont, fontSize: 13, color: '#7A82A8', marginTop: 8 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* Magazine Card */}
            <div style={{ background: 'rgba(28,32,64,0.6)', border: '1px solid rgba(124,111,255,0.2)', borderRadius: 24, padding: 28, backdropFilter: 'blur(20px)', position: 'relative' }}>
              <div style={{ display: 'flex', gap: 24, alignItems: 'start' }}>
                {/* Visual Box */}
                <div style={{ 
                  width: 90, height: 120, borderRadius: 14, flexShrink: 0, 
                  background: 'rgba(124,111,255,0.15)', border: '1px solid rgba(124,111,255,0.3)', 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 
                }}>
                  <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 24, color: '#A78BFA' }}>MC</div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 700, color: '#7A82A8', textAlign: 'center', lineHeight: 1.3 }}>APRIL<br/>2026</div>
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'inline-block', background: 'rgba(124,111,255,0.1)', border: '1px solid rgba(124,111,255,0.25)', borderRadius: 8, padding: '4px 12px', marginBottom: 12 }}>
                    <span style={{ fontFamily: bodyFont, fontSize: 12, color: '#A78BFA', fontWeight: 600 }}>{T('new_issue')}</span>
                  </div>
                  <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 22, color: '#F0F2FF', margin: '0 0 6px', letterSpacing: '-0.5px' }}>MCQuiz April 2026</h3>
                  <p style={{ fontFamily: bodyFont, fontSize: 14, color: '#7A82A8', margin: '0 0 16px', lineHeight: 1.5 }}>
                    {lang === 'bn' ? '২০০টি MCQ মডেল প্রশ্ন · BCS ও GK কেন্দ্রিক' : '200 MCQ model questions · BCS & GK focused'}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {featured.topics.slice(0, 4).map((t) => (
                      <span key={t} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: '3px 10px', fontFamily: bodyFont, fontSize: 11, color: '#8B90B0' }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 24, color: '#F0F2FF' }}>৳৫০</span>
                  <span style={{ fontFamily: bodyFont, fontSize: 13, color: '#7A82A8', marginLeft: 8 }}>{T('mag_quiz_included')}</span>
                </div>
                {purchasedMags.includes(featured.id) ? (
                  <button onClick={() => openPdf(featured.pdf_path)} style={{ 
                    background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.35)', 
                    borderRadius: 12, padding: '10px 24px', color: '#22C55E', 
                    fontFamily: bodyFont, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' 
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.12)'; }}>
                    {T('mag_read')}
                  </button>
                ) : (
                  <button onClick={() => navigate('buy-magazine', featured)} style={{ 
                    background: 'rgba(124,111,255,0.12)', border: '1px solid rgba(124,111,255,0.3)', 
                    borderRadius: 12, padding: '10px 22px', color: '#A78BFA', 
                    fontFamily: bodyFont, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' 
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,111,255,0.2)'; e.currentTarget.style.borderColor = 'rgba(124,111,255,0.5)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,111,255,0.12)'; e.currentTarget.style.borderColor = 'rgba(124,111,255,0.3)'; }}>
                    {lang === 'bn' ? 'সংখ্যাটি নিন →' : 'Get Issue →'}
                  </button>
                )}
              </div>
            </div>

            {/* Countdown Card */}
            <div style={{ background: 'rgba(28,32,64,0.6)', border: '1px solid rgba(212,168,67,0.2)', borderRadius: 24, padding: '26px 28px', display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: bodyFont, fontSize: 12, color: '#D4A843', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 6, textTransform: 'uppercase' }}>{T('hero_quiz_deadline')}</div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 20, color: '#F0F2FF', marginBottom: 4 }}>
                  {featured.quiz?.deadline || (lang === 'bn' ? '৩০ এপ্রিল ২০২৬ · রাত ১১:৫৯' : 'April 30, 2026 · 11:59 PM')}
                </div>
                <div style={{ fontFamily: bodyFont, fontSize: 13, color: '#7A82A8' }}>
                  {featured.quiz ? (
                    lang === 'bn' ? `১,২৪৭ ${T('hero_participants')} · ${T('hero_total_prizes')}: ৳${featured.quiz.total_marks}` : `1,247 ${T('hero_participants')} · ${T('hero_total_prizes')}: ৳${featured.quiz.total_marks}`
                  ) : (
                    `১,২৪৭ ${T('hero_participants')} · ${T('hero_total_prizes')}: ৳৩৫,০০০`
                  )}
                </div>
              </div>
              <CountdownTimer targetDate={featured.quiz?.deadline || '2026-04-30'} lang={lang} />
            </div>
          </div>
        </div>
      </div>

      {/* Hall of Fame section */}
      <div style={{ background: 'rgba(15,17,32,0.4)', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <MiniLeaderboard navigate={navigate} lang={lang} T={T} leaderboard={leaderboard} />
      </div>
      
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}

export { CountdownTimer, MiniLeaderboard };
export default HomePage;