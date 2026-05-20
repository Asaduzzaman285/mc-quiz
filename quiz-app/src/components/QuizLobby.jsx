import React, { useState, useEffect } from 'react';

export default function QuizLobby({ navigate, isLoggedIn, hasPurchased, lang, T, quizzes, activeMagazine, activeQuiz }) {
  const currentQuiz = activeQuiz ?? quizzes?.[0] ?? null;
  const quizDeadline = currentQuiz?.deadline ?? '2027-12-31';
  const resultAnnounceDate = currentQuiz?.resultDate ?? currentQuiz?.resultdate ?? 'TBD';
  const questionsCount = currentQuiz?.questions_count ?? 0;
  const durationMins = currentQuiz?.duration_minutes ?? 3;
  const bodyFont = lang === 'bn' ? "'Anek Bangla', sans-serif" : 'Inter, sans-serif';
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = new Date(quizDeadline + 'T23:59:59') - new Date();
      if (diff <= 0) { setTimeLeft({ d: 0, h: 0, m: 0, s: 0 }); return; }
      setTimeLeft({ d: Math.floor(diff / 86400000), h: Math.floor((diff % 86400000) / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) });
    };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);

  const labels = lang === 'bn' ? ['দিন', 'ঘণ্টা', 'মিনিট', 'সেকেন্ড'] : ['Days', 'Hours', 'Mins', 'Secs'];
  const TimeBox = ({ v, label }) => (
    <div style={{ textAlign: 'center' }}>
      <div style={{ background: 'rgba(124,111,255,0.15)', border: '1px solid rgba(124,111,255,0.3)', borderRadius: 12, padding: '12px 16px', minWidth: 60, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 28, color: '#A78BFA', lineHeight: 1 }}>{String(v).padStart(2, '0')}</div>
      <div style={{ fontFamily: bodyFont, fontSize: 11, color: '#7A82A8', marginTop: 5 }}>{label}</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', paddingTop: 88, color: '#F0F2FF' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px' }}>

        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: bodyFont, fontSize: 13, color: '#7C6FFF', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>{T('ql_monthly')}</div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 40, color: '#F0F2FF', margin: '0 0 14px', letterSpacing: '-1.2px' }}>{T('ql_title')}</h1>
          <p style={{ fontFamily: bodyFont, fontSize: 16, color: '#7A82A8', margin: 0, lineHeight: 1.7, maxWidth: 560 }}>{T('ql_subtitle')}</p>
        </div>

        {/* Prize breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 36 }}>
          {[['🥇', T('first_prize'), '৳ ১৫,০০০', '#D4A843'], ['🥈', T('second_prize'), '৳ ৫,০০০', '#A8A8B3'], ['🥉', T('third_prize'), lang === 'bn' ? '৳ ১,০০০ করে' : '৳ 1,000 each', '#CD7F32']].map(([icon, pos, prize, color]) => (
            <div key={pos} style={{ background: `${color}0d`, border: `1px solid ${color}33`, borderRadius: 16, padding: '22px 20px', textAlign: 'center', backdropFilter: 'blur(8px)' }}>
              <div style={{ fontSize: 26, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 22, color, marginBottom: 4 }}>{prize}</div>
              <div style={{ fontFamily: bodyFont, fontSize: 13, color: '#7A82A8' }}>{pos}</div>
            </div>
          ))}
        </div>

        {/* Main quiz card */}
        <div style={{ background: 'rgba(28,32,64,0.65)', border: '1px solid rgba(124,111,255,0.25)', borderRadius: 24, padding: '34px 34px', marginBottom: 24, backdropFilter: 'blur(16px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 50, padding: '5px 14px' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 8px #22C55E' }} />
              <span style={{ fontFamily: bodyFont, fontSize: 12, fontWeight: 600, color: '#22C55E', letterSpacing: '0.03em' }}>{T('ql_open')}</span>
            </div>
            {hasPurchased && (
              <div style={{ background: 'rgba(124,111,255,0.12)', border: '1px solid rgba(124,111,255,0.3)', borderRadius: 50, padding: '5px 14px' }}>
                <span style={{ fontFamily: bodyFont, fontSize: 12, fontWeight: 600, color: '#A78BFA' }}>{T('ql_eligible')}</span>
              </div>
            )}
          </div>

          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 24, color: '#F0F2FF', margin: '0 0 8px', letterSpacing: '-0.6px' }}>
            {currentQuiz?.name ?? currentQuiz?.title ?? T('ql_quiz_name')}
            {activeMagazine && <span style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500, color: '#A78BFA', marginTop: 4 }}>📖 {activeMagazine.name}</span>}
          </h2>
          <p style={{ fontFamily: bodyFont, fontSize: 15, color: '#7A82A8', margin: '0 0 26px', lineHeight: 1.7 }}>{T('ql_quiz_desc')}</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
            {[
              [T('ql_deadline'), quizDeadline ? quizDeadline.toString().slice(0, 10) : '—'],
              [T('ql_quiz_time'), `${durationMins} ${lang === 'bn' ? 'মিনিট' : 'min'}`],
              [T('ql_questions'), questionsCount > 0 ? `${questionsCount} MCQ` : (lang === 'bn' ? 'লোড হচ্ছে…' : 'Loading…')],
              [T('ql_entry'), T('ql_entry_free')],
            ].map(([label, value]) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '13px 15px' }}>
                <div style={{ fontFamily: bodyFont, fontSize: 11, color: '#7A82A8', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, color: '#F0F2FF' }}>{value}</div>
              </div>
            ))}
          </div>
          <p style={{ fontFamily: bodyFont, fontSize: 12, color: '#555C7A', margin: '0 0 24px' }}>{T('ql_entry_note')}</p>

          {/* Countdown */}
          <div style={{ background: 'rgba(212,168,67,0.06)', border: '1px solid rgba(212,168,67,0.2)', borderRadius: 16, padding: '22px 26px', marginBottom: 26, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, boxShadow: '0 0 32px rgba(212,168,67,0.08)' }}>
            <div>
              <div style={{ fontFamily: bodyFont, fontSize: 12, color: '#D4A843', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{T('ql_closes_in')}</div>
              <div style={{ fontFamily: bodyFont, fontSize: 13, color: '#7A82A8' }}>{lang === 'bn' ? '৩০ এপ্রিল ২০২৬ রাত ১১:৫৯ · ফলাফল:' : 'April 30, 2026 at 11:59 PM · Results:'} {resultAnnounceDate}</div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              {[{ v: timeLeft.d, label: labels[0] }, { v: timeLeft.h, label: labels[1] }, { v: timeLeft.m, label: labels[2] }, { v: timeLeft.s, label: labels[3] }].map((box, i) => (
                <React.Fragment key={i}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      background: 'rgba(212,168,67,0.12)',
                      border: '1px solid rgba(212,168,67,0.35)',
                      borderRadius: 12, padding: '12px 16px', minWidth: 60,
                      fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 28, color: '#D4A843', lineHeight: 1,
                      boxShadow: '0 0 18px rgba(212,168,67,0.25), inset 0 0 12px rgba(212,168,67,0.05)',
                      textShadow: '0 0 12px rgba(212,168,67,0.6)',
                    }}>{String(box.v).padStart(2, '0')}</div>
                    <div style={{ fontFamily: bodyFont, fontSize: 11, color: '#7A82A8', marginTop: 5 }}>{box.label}</div>
                  </div>
                  {i < 3 && <div style={{ color: '#D4A843', fontSize: 24, fontWeight: 700, paddingTop: 12, opacity: 0.6 }}>:</div>}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex' }}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} style={{ width: 30, height: 30, borderRadius: '50%', marginLeft: i > 0 ? -9 : 0, background: `hsl(${220 + i * 28},65%,55%)`, border: '2px solid #0C0E1A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 11, color: '#fff' }}>{String.fromCharCode(65 + i)}</div>
                ))}
              </div>
              <span style={{ fontFamily: bodyFont, fontSize: 14, color: '#7A82A8' }}><strong style={{ color: '#F0F2FF' }}>১,২৪৭</strong> {T('ql_participants')}</span>
            </div>

            {hasPurchased ? (
              <button onClick={() => navigate('live-quiz')} style={{ background: 'linear-gradient(135deg, #7C6FFF, #A78BFA)', border: 'none', borderRadius: 12, padding: '12px 28px', color: '#fff', fontFamily: bodyFont, fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(124,111,255,0.4)' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >{T('ql_enter_now')}</button>
            ) : (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: bodyFont, fontSize: 13, color: '#7A82A8' }}>{T('ql_unlock_text')}</span>
                <button onClick={() => navigate('store')} style={{ background: 'linear-gradient(135deg, #7C6FFF, #A78BFA)', border: 'none', borderRadius: 11, padding: '11px 22px', color: '#fff', fontFamily: bodyFont, fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(124,111,255,0.35)' }}>{T('ql_buy_magazine')}</button>
              </div>
            )}
          </div>
        </div>

        {/* Result announcement — moved above How to participate */}
        <div style={{ background: 'linear-gradient(135deg, rgba(212,168,67,0.1), rgba(212,168,67,0.04))', border: '1px solid rgba(212,168,67,0.25)', borderRadius: 18, padding: '24px 28px', marginBottom: 20, backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(212,168,67,0.15)', border: '1px solid rgba(212,168,67,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D4A843" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: '#F0F2FF', marginBottom: 4 }}>
              {lang === 'bn' ? 'ফলাফল ঘোষণা' : 'Result Announcement'}
            </div>
            <div style={{ fontFamily: bodyFont, fontSize: 14, color: '#8B90B0', lineHeight: 1.6 }}>
              {lang === 'bn'
                ? `কুইজ শেষ হওয়ার পর ${resultAnnounceDate} তারিখে লিডারবোর্ডে ফলাফল প্রকাশিত হবে। বিজয়ীদের bKash/Nagad-এ পুরস্কার পাঠানো হবে।`
                : `Results will be published on the leaderboard on ${resultAnnounceDate}. Winners will be contacted via bKash/Nagad within 3 working days.`}
            </div>
          </div>
          <button onClick={() => navigate('leaderboard')} style={{ background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.3)', borderRadius: 10, padding: '10px 18px', color: '#D4A843', fontFamily: bodyFont, fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
            {T('lb_title')} →
          </button>
        </div>

        {/* How to participate */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, padding: '24px 28px', backdropFilter: 'blur(8px)' }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 17, color: '#F0F2FF', marginBottom: 18 }}>{T('ql_how_title')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
            {[
              [lang === 'bn' ? '০১' : '01', T('ql_step1_t'), T('ql_step1_d')],
              [lang === 'bn' ? '০২' : '02', T('ql_step2_t'), T('ql_step2_d')],
              [lang === 'bn' ? '০৩' : '03', T('ql_step3_t'), `${T('ql_step3_d')} ${resultAnnounceDate}.`],
            ].map(([n, title, desc]) => (
              <div key={n} style={{ display: 'flex', gap: 14 }}>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 26, color: 'rgba(124,111,255,0.2)', lineHeight: 1, flexShrink: 0, marginTop: 2 }}>{n}</div>
                <div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, color: '#F0F2FF', marginBottom: 5 }}>{title}</div>
                  <div style={{ fontFamily: bodyFont, fontSize: 13, color: '#7A82A8', lineHeight: 1.6 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
