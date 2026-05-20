import React, { useState } from 'react';

export default function Dashboard({ navigate, user: propUser, magazines: propMagazines, purchasedMags, lang, T, openPdf }) {
  const user = propUser || { name: '…', avatar: '?', totalQuizzes: 0, totalCorrect: 0, accuracy: 0, rank: '-', quizHistory: [] };
  const magazines = propMagazines || [];
  const bodyFont = lang === 'bn' ? "'Anek Bangla', sans-serif" : 'Inter, sans-serif';
  const [activeTab, setActiveTab] = useState('overview');
  const tabs = ['overview', 'magazines', 'history'];
  const tabLabels = { overview: T('dash_overview'), magazines: T('dash_magazines'), history: T('dash_history') };
  const owned = purchasedMags || [];

  // Normalise quizHistory — API returns { month, score, rank, correct, total, timeSec }
  const history = (user.quizHistory || []).map(h => ({
    month: h.month || '—',
    score: h.score ?? h.correct_answers ?? 0,
    correct: h.correct ?? h.correct_answers ?? 0,
    total: h.total ?? h.total_questions ?? 1,
    rank: h.rank ?? '—',
  }));

  const StatBox = ({ value, label, color }) => (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '20px 16px', textAlign: 'center', backdropFilter: 'blur(8px)' }}>
      <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 28, color: color || '#A78BFA', lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: bodyFont, fontSize: 12, color: '#7A82A8', marginTop: 6 }}>{label}</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', paddingTop: 88, color: '#F0F2FF' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>

        {/* Profile header */}
        <div style={{ background: 'linear-gradient(135deg, rgba(124,111,255,0.12), rgba(212,168,67,0.06))', border: '1px solid rgba(124,111,255,0.2)', borderRadius: 24, padding: '28px 32px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap', backdropFilter: 'blur(16px)' }}>
          <div style={{ width: 68, height: 68, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #7C6FFF, #A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 24, color: '#fff', boxShadow: '0 6px 24px rgba(124,111,255,0.4)' }}>
            {user.avatar || (user.name || '?')[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 24, color: '#F0F2FF', margin: '0 0 5px', letterSpacing: '-0.5px' }}>{user.name}</h2>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: bodyFont, fontSize: 13, color: '#7A82A8' }}>
                {user.division ? `${user.division}${user.district ? ', ' + user.district : ''}` : (lang === 'bn' ? 'বাংলাদেশ' : 'Bangladesh')}
              </span>
              {user.rank && user.rank !== '-' && (
                <span style={{ fontFamily: bodyFont, fontSize: 13, color: '#7A82A8' }}>
                  {T('dash_your_rank')} <strong style={{ color: '#A78BFA' }}>#{user.rank}</strong>
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ background: owned.length > 0 ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${owned.length > 0 ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 10, padding: '10px 16px' }}>
              <div style={{ fontFamily: bodyFont, fontSize: 11, color: owned.length > 0 ? '#22C55E' : '#7A82A8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{T('dash_subscription')}</div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, color: '#F0F2FF' }}>
                {owned.length > 0 ? T('dash_active') : (lang === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive')}
              </div>
              <div style={{ fontFamily: bodyFont, fontSize: 11, color: '#7A82A8' }}>
                {owned.length > 0 ? `${owned.length} ${lang === 'bn' ? 'টি ম্যাগাজিন' : 'magazine(s)'}` : (lang === 'bn' ? 'কোনো ক্রয় নেই' : 'No purchases')}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4, width: 'fit-content' }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ background: activeTab === t ? 'rgba(124,111,255,0.2)' : 'transparent', border: `1px solid ${activeTab === t ? 'rgba(124,111,255,0.3)' : 'transparent'}`, borderRadius: 9, padding: '8px 18px', color: activeTab === t ? '#A78BFA' : '#7A82A8', fontFamily: bodyFont, fontSize: 14, fontWeight: activeTab === t ? 600 : 400, cursor: 'pointer', transition: 'all 0.2s' }}>{tabLabels[t]}</button>
          ))}
        </div>

        {/* ── Overview ── */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
              <StatBox value={user.totalQuizzes ?? 0} label={T('dash_quizzes_taken')} />
              <StatBox value={user.totalCorrect ?? 0} label={T('dash_correct')} color="#22C55E" />
              <StatBox value={`${user.accuracy ?? 0}%`} label={T('dash_accuracy')} color="#D4A843" />
              <StatBox value={user.rank ? `#${user.rank}` : '—'} label={T('dash_rank')} color="#A78BFA" />
            </div>

            {/* Performance chart */}
            {history.length > 0 && (
              <div style={{ background: 'rgba(28,32,64,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '26px', marginBottom: 22, backdropFilter: 'blur(8px)' }}>
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 17, color: '#F0F2FF', margin: '0 0 20px' }}>{T('dash_performance')}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {history.map((h, i) => {
                    const pct = h.total > 0 ? Math.round((h.correct / h.total) * 100) : 0;
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ fontFamily: bodyFont, fontSize: 13, color: '#7A82A8', width: 120, flexShrink: 0 }}>{h.month}</div>
                        <div style={{ flex: 1, height: 7, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #7C6FFF, #A78BFA)', borderRadius: 4 }} />
                        </div>
                        <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 14, color: '#A78BFA', width: 44 }}>{pct}%</span>
                        <span style={{ fontFamily: bodyFont, fontSize: 13, color: '#7A82A8', width: 52 }}>#{h.rank}</span>
                        <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 14, color: '#F0F2FF', width: 36 }}>{h.score}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick actions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {[
                { label: T('dash_join_quiz'), sub: lang === 'bn' ? 'কুইজ লবিতে যান' : 'Go to Quiz Lobby', action: () => navigate('quiz-lobby'), color: '#7C6FFF' },
                { label: T('dash_get_mag'), sub: lang === 'bn' ? '৳৫০ · ২০০ প্রশ্ন' : '৳50 · 200 questions', action: () => navigate('store'), color: '#D4A843' },
                { label: T('dash_view_lb'), sub: lang === 'bn' ? 'লাইভ র‍্যাংকিং' : 'Live rankings', action: () => navigate('leaderboard'), color: '#22C55E' },
              ].map(item => (
                <button key={item.label} onClick={item.action} style={{ background: `${item.color}0f`, border: `1px solid ${item.color}30`, borderRadius: 16, padding: '18px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${item.color}1a`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = `${item.color}0f`; e.currentTarget.style.transform = 'none'; }}>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, color: '#F0F2FF', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontFamily: bodyFont, fontSize: 12, color: '#7A82A8' }}>{item.sub}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Magazines ── */}
        {activeTab === 'magazines' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 18 }}>
            {magazines.filter(m => owned.includes(m.id)).map(mag => (
              <div key={mag.id} style={{ background: 'rgba(28,32,64,0.5)', border: `1px solid ${mag.color || '#7C6FFF'}30`, borderRadius: 16, overflow: 'hidden', backdropFilter: 'blur(8px)' }}>
                <div style={{ height: 110, background: `linear-gradient(145deg, ${mag.color || '#7C6FFF'}20, ${mag.color || '#7C6FFF'}08)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 26, color: mag.color || '#7C6FFF' }}>MC</div>
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ fontFamily: bodyFont, fontSize: 11, color: '#7A82A8', marginBottom: 4 }}>{mag.month}</div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13, color: '#F0F2FF', lineHeight: 1.4, marginBottom: 12 }}>{mag.name}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => openPdf && openPdf(mag.pdf_path, mag.id, mag.name)}
                      style={{ flex: 1, background: `${mag.color || '#7C6FFF'}20`, border: `1px solid ${mag.color || '#7C6FFF'}40`, borderRadius: 8, padding: '7px 10px', color: mag.color || '#7C6FFF', fontFamily: bodyFont, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                      📄 {T('dash_read_pdf')}
                    </button>
                    {mag.quiz && (
                      <button onClick={() => navigate('enter-quiz', mag)}
                        style={{ flex: 1, background: 'linear-gradient(135deg,#7C6FFF,#A78BFA)', border: 'none', borderRadius: 8, padding: '7px 10px', color: '#fff', fontFamily: bodyFont, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                        ⚡ Quiz
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {owned.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#7A82A8', fontFamily: bodyFont, fontSize: 14 }}>
                {lang === 'bn' ? 'কোনো ম্যাগাজিন কেনা হয়নি।' : 'No magazines purchased yet.'}
                <br />
                <button onClick={() => navigate('store')} style={{ marginTop: 12, background: 'linear-gradient(135deg,#7C6FFF,#A78BFA)', border: 'none', borderRadius: 10, padding: '10px 22px', color: '#fff', fontFamily: bodyFont, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  {lang === 'bn' ? 'ম্যাগাজিন দেখুন' : 'Browse Magazines'}
                </button>
              </div>
            )}
            <div onClick={() => navigate('store')} style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', cursor: 'pointer', minHeight: 180, transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,111,255,0.4)'; e.currentTarget.style.background = 'rgba(124,111,255,0.05)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(124,111,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <span style={{ color: '#A78BFA', fontSize: 20 }}>+</span>
              </div>
              <div style={{ fontFamily: bodyFont, fontSize: 13, color: '#7A82A8' }}>{T('dash_browse_more')}</div>
            </div>
          </div>
        )}

        {/* ── History ── */}
        {activeTab === 'history' && (
          history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#7A82A8', fontFamily: bodyFont, fontSize: 14 }}>
              {lang === 'bn' ? 'এখনো কোনো কুইজে অংশ নেননি।' : 'No quiz history yet.'}
            </div>
          ) : (
            <div style={{ background: 'rgba(28,32,64,0.4)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, overflow: 'hidden', backdropFilter: 'blur(8px)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px 70px 80px', padding: '13px 22px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {[lang === 'bn' ? 'কুইজ' : 'Quiz', lang === 'bn' ? 'স্কোর' : 'Score', lang === 'bn' ? 'সঠিক' : 'Correct', lang === 'bn' ? 'র‍্যাংক' : 'Rank', '%'].map(h => (
                  <div key={h} style={{ fontFamily: bodyFont, fontSize: 12, color: '#7A82A8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</div>
                ))}
              </div>
              {history.map((h, i) => {
                const pct = h.total > 0 ? Math.round((h.correct / h.total) * 100) : 0;
                return (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px 70px 80px', padding: '16px 22px', borderBottom: i < history.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <div style={{ fontFamily: bodyFont, fontWeight: 500, fontSize: 14, color: '#F0F2FF', display: 'flex', alignItems: 'center' }}>{h.month}</div>
                    <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 15, color: '#A78BFA', display: 'flex', alignItems: 'center' }}>{h.score}</div>
                    <div style={{ fontFamily: bodyFont, fontSize: 14, color: '#F0F2FF', display: 'flex', alignItems: 'center' }}>{h.correct}<span style={{ color: '#7A82A8', marginLeft: 2 }}>/{h.total}</span></div>
                    <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 14, color: '#F0F2FF', display: 'flex', alignItems: 'center' }}>#{h.rank}</div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ background: pct >= 80 ? 'rgba(34,197,94,0.15)' : 'rgba(212,168,67,0.15)', border: `1px solid ${pct >= 80 ? 'rgba(34,197,94,0.4)' : 'rgba(212,168,67,0.4)'}`, borderRadius: 6, padding: '3px 9px', fontFamily: bodyFont, fontSize: 12, fontWeight: 600, color: pct >= 80 ? '#22C55E' : '#D4A843' }}>{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}
