import React, { useState } from 'react';
import { MCQUIZ_DATA } from './data';

// Uniform buy button color
const BUY_COLOR = '#7C6FFF';

export default function MagazineStore({ navigate, isLoggedIn, hasPurchased, purchasedMags, lang, T, magazines, openPdf }) {
  const purchased = purchasedMags || [];
  const bodyFont = lang === 'bn' ? "'Anek Bangla', sans-serif" : 'Inter, sans-serif';
  const featured = magazines?.[0] || { name: '...', month: '...', topics: [], id: 0 };

  const whyPoints = lang === 'bn' ? [
    'BCS, Bank Job ও প্রতিযোগিতামূলক পরীক্ষার জন্য উপযুক্ত',
    'ক্রয়ের সাথেই মাসিক কুইজের এন্ট্রি পাবেন',
    'PDF ডাউনলোড করে যেকোনো ডিভাইসে পড়ুন',
    'প্রতি মাসে আপডেটেড কারেন্ট অ্যাফেয়ার্স',
  ] : [
    'Ideal for BCS, Bank Jobs & competitive exams',
    'Quiz entry included with every purchase',
    'Download PDF and read on any device',
    'Updated current affairs every month',
  ];

  return (
    <div style={{ minHeight: '100vh', paddingTop: 88, color: '#F0F2FF' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '40px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: bodyFont, fontSize: 13, color: '#7C6FFF', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>MONTHLY EBOOK</div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 40, color: '#F0F2FF', margin: '0 0 14px', letterSpacing: '-1.2px' }}>{T('mag_title')}</h1>
          <p style={{ fontFamily: bodyFont, fontSize: 16, color: '#7A82A8', margin: 0, lineHeight: 1.7, maxWidth: 600 }}>{T('mag_subtitle')}</p>
        </div>

        {/* ── THIS MONTH'S ISSUE — What's Inside ── */}
        <div style={{ background: 'linear-gradient(135deg, rgba(124,111,255,0.12), rgba(124,111,255,0.04))', border: '1px solid rgba(124,111,255,0.25)', borderRadius: 24, padding: '32px 36px', marginBottom: 44, backdropFilter: 'blur(14px)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(124,111,255,0.15)', border: '1px solid rgba(124,111,255,0.3)', borderRadius: 50, padding: '4px 14px', marginBottom: 22 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 8px #22C55E' }} />
            <span style={{ fontFamily: bodyFont, fontSize: 12, fontWeight: 600, color: '#A78BFA', letterSpacing: '0.04em' }}>{lang === 'bn' ? 'এই মাসের সংখ্যা' : "THIS MONTH'S ISSUE"}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 36, alignItems: 'start' }}>
            {/* ── LEFT: Thumbnail placeholder ── */}
            <div>
              <div style={{
                width: '100%', aspectRatio: '3/4', borderRadius: 16,
                background: 'linear-gradient(145deg, rgba(124,111,255,0.18), rgba(124,111,255,0.06))',
                border: '2px dashed rgba(124,111,255,0.35)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 10, cursor: 'pointer', transition: 'all 0.2s', overflow: 'hidden',
                position: 'relative',
              }}
                title="Click to upload cover image"
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,111,255,0.7)'; e.currentTarget.style.background = 'rgba(124,111,255,0.14)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(124,111,255,0.35)'; e.currentTarget.style.background = 'linear-gradient(145deg, rgba(124,111,255,0.18), rgba(124,111,255,0.06))'; }}>
                {/* MC watermark */}
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 40, color: 'rgba(124,111,255,0.25)', lineHeight: 1 }}>MC</div>
                <div style={{ fontFamily: bodyFont, fontSize: 11, color: 'rgba(124,111,255,0.5)', textAlign: 'center', lineHeight: 1.5, padding: '0 12px' }}>
                  {lang === 'bn' ? 'কভার ছবি\nএখানে দিন' : 'Magazine\nCover Image'}
                </div>
                {/* Upload icon */}
                <div style={{ position: 'absolute', bottom: 12, right: 12, width: 28, height: 28, borderRadius: 8, background: 'rgba(124,111,255,0.2)', border: '1px solid rgba(124,111,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#A78BFA', fontSize: 14 }}>↑</span>
                </div>
                {/* Month badge */}
                <div style={{ position: 'absolute', top: 12, left: 12, background: 'linear-gradient(135deg, #7C6FFF, #A78BFA)', borderRadius: 8, padding: '4px 10px' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: '0.06em' }}>{featured.month.toUpperCase()}</span>
                </div>
              </div>
              <div style={{ fontFamily: bodyFont, fontSize: 11, color: '#555C7A', textAlign: 'center', marginTop: 8, lineHeight: 1.5 }}>
                {lang === 'bn' ? 'কভার ইমেজ আপলোড করুন' : 'Upload cover image here'}
              </div>
            </div>

            {/* ── RIGHT: What's Inside details ── */}
            <div>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 26, color: '#F0F2FF', margin: '0 0 6px', letterSpacing: '-0.6px' }}>{featured.name}</h2>
              <div style={{ fontFamily: bodyFont, fontSize: 14, color: '#7A82A8', marginBottom: 20 }}>
                {featured.month} · {featured.pages} {T('mag_pages')} · PDF
              </div>

              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: '#F0F2FF', marginBottom: 12 }}>{T('mag_what_inside')}</div>
              <p style={{ fontFamily: bodyFont, fontSize: 14, color: '#8B90B0', lineHeight: 1.75, margin: '0 0 18px' }}>{T('mag_inside_desc')}</p>

              {/* Stats row */}
              <div style={{ display: 'flex', gap: 18, marginBottom: 20, flexWrap: 'wrap' }}>
                {[['২০০', T('mag_questions')], ['১', lang === 'bn' ? 'কুইজ এন্ট্রি' : 'Quiz Entry'], ['PDF', lang === 'bn' ? 'ডাউনলোড' : 'Download']].map(([v, l]) => (
                  <div key={l} style={{ background: 'rgba(124,111,255,0.1)', border: '1px solid rgba(124,111,255,0.2)', borderRadius: 10, padding: '10px 16px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 18, color: '#A78BFA' }}>{v}</div>
                    <div style={{ fontFamily: bodyFont, fontSize: 11, color: '#7A82A8', marginTop: 3 }}>{l}</div>
                  </div>
                ))}
              </div>

              {/* Topics */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 22 }}>
                {featured.topics.map(t => (
                  <span key={t} style={{ background: 'rgba(124,111,255,0.1)', border: '1px solid rgba(124,111,255,0.25)', borderRadius: 7, padding: '4px 12px', fontFamily: bodyFont, fontSize: 12, color: '#A78BFA' }}>{t}</span>
                ))}
              </div>

              {/* Why points */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 26 }}>
                {whyPoints.map((p, i) => (
                  <div key={i} style={{ display: 'flex', gap: 9 }}>
                    <div style={{ width: 17, height: 17, borderRadius: '50%', background: 'rgba(124,111,255,0.18)', border: '1px solid rgba(124,111,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                      <span style={{ color: '#A78BFA', fontSize: 9, fontWeight: 700 }}>✓</span>
                    </div>
                    <span style={{ fontFamily: bodyFont, fontSize: 13, color: '#C8CBE0', lineHeight: 1.5 }}>{p}</span>
                  </div>
                ))}
              </div>

              {/* CTA row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 28, color: '#F0F2FF' }}>৳৫০</span>
                  <span style={{ fontFamily: bodyFont, fontSize: 13, color: '#7A82A8', marginLeft: 8 }}>{T('mag_quiz_included')}</span>
                </div>
                {purchased.includes(featured.id) ? (
                  <button onClick={() => openPdf(featured.pdf_path, featured.id, featured.name)} style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.35)', borderRadius: 11, padding: '12px 24px', color: '#22C55E', fontFamily: bodyFont, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{T('mag_read')}</button>
                ) : (
                  <button onClick={() => navigate('buy-magazine', featured)} style={{ background: 'linear-gradient(135deg, #7C6FFF, #A78BFA)', border: 'none', borderRadius: 11, padding: '12px 28px', color: '#fff', fontFamily: bodyFont, fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 18px rgba(124,111,255,0.4)', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 26px rgba(124,111,255,0.55)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(124,111,255,0.4)'; }}
                  >{T('mag_buy')} — ৳৫০</button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Prize reminder */}
        <div style={{ background: 'rgba(212,168,67,0.06)', border: '1px solid rgba(212,168,67,0.18)', borderRadius: 16, padding: '16px 26px', marginBottom: 36, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, backdropFilter: 'blur(8px)' }}>
          <div>
            <div style={{ fontFamily: bodyFont, fontSize: 12, color: '#D4A843', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>{lang === 'bn' ? 'প্রতি মাসের পুরস্কার তহবিল' : 'Monthly Prize Pool'}</div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {[['🥇 ৳১৫,০০০', T('first_prize')], ['🥈 ৳৫,০০০', T('second_prize')], ['🥉 ৳১,০০০×২০', T('third_prize')]].map(([v, l]) => (
                <div key={l} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 15, color: '#D4A843' }}>{v}</span>
                  <span style={{ fontFamily: bodyFont, fontSize: 12, color: '#7A82A8' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => navigate('quiz-lobby')} style={{ background: 'rgba(212,168,67,0.12)', border: '1px solid rgba(212,168,67,0.3)', borderRadius: 10, padding: '10px 18px', color: '#D4A843', fontFamily: bodyFont, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            {T('nav_quiz')} →
          </button>
        </div>

        {/* Section title */}
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22, color: '#F0F2FF', marginBottom: 22, letterSpacing: '-0.4px' }}>
          {lang === 'bn' ? 'সব সংখ্যা' : 'All Issues'}
        </div>

        {/* ── Magazine grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 22 }}>
          {magazines.map(mag => {
            const owned = purchased.includes(mag.id);
            return <MagCard key={mag.id} mag={mag} owned={owned} onBuy={() => navigate('buy-magazine', mag)} onRead={() => openPdf && openPdf(mag.pdf_path, mag.id, mag.name)} onQuiz={() => navigate('enter-quiz', mag)} lang={lang} T={T} bodyFont={bodyFont} />;
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: 36, padding: '22px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14 }}>
          <p style={{ fontFamily: bodyFont, fontSize: 14, color: '#7A82A8', margin: 0, lineHeight: 1.7 }}>
            {lang === 'bn' ? 'প্রতিটি সংখ্যা কেনার সাথে সেই মাসের কুইজে অংশগ্রহণের সুযোগ পাবেন। আলাদা কোনো নিবন্ধন বা ফি নেই।' : "Every issue purchase includes your entry to that month's quiz. No separate registration or fee required."}
          </p>
        </div>
      </div>
    </div>
  );
}

function MagCard({ mag, owned, onBuy, onRead, onQuiz, lang, T, bodyFont }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{
      background: hovered ? 'rgba(28,32,64,0.85)' : 'rgba(28,32,64,0.5)',
      border: `1px solid ${hovered ? 'rgba(124,111,255,0.35)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 18, overflow: 'hidden', backdropFilter: 'blur(12px)',
      transition: 'all 0.3s', transform: hovered ? 'translateY(-4px)' : 'none',
      boxShadow: hovered ? '0 16px 40px rgba(124,111,255,0.15)' : 'none',
    }}>
      {/* Cover area */}
      <div style={{ height: 180, background: `linear-gradient(145deg, ${mag.color}22, ${mag.color}08)`, borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 110, height: 110, borderRadius: '50%', background: `${mag.color}15` }} />
        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 28, color: mag.color, letterSpacing: '-1px', position: 'relative' }}>MC</div>
        <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 11, color: mag.color + 'aa', letterSpacing: '0.15em', marginTop: 4, textTransform: 'uppercase', position: 'relative' }}>{mag.month}</div>
        {mag.featured && (
          <div style={{ position: 'absolute', top: 12, left: 12, background: 'linear-gradient(135deg, #7C6FFF, #A78BFA)', borderRadius: 6, padding: '3px 9px' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 700, color: '#fff' }}>{T('mag_latest')}</span>
          </div>
        )}
        {owned && (
          <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.4)', borderRadius: 6, padding: '3px 9px' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 700, color: '#22C55E' }}>{T('mag_owned')}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '18px 20px' }}>
        <div style={{ fontFamily: bodyFont, fontSize: 12, color: '#7A82A8', marginBottom: 5 }}>{mag.month} · {mag.pages} {T('mag_pages')}</div>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, color: '#F0F2FF', lineHeight: 1.4, marginBottom: 10, minHeight: 36 }}>{mag.name}</div>

        {/* Quiz entry badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'rgba(124,111,255,0.2)', border: '1px solid rgba(124,111,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#A78BFA', fontSize: 8, fontWeight: 700 }}>✓</span>
          </div>
          <span style={{ fontFamily: bodyFont, fontSize: 11, color: '#A78BFA' }}>{T('mag_quiz_included')}</span>
        </div>

        {/* Topics */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 16 }}>
          {mag.topics.slice(0, 3).map(t => (
            <span key={t} style={{ background: 'rgba(124,111,255,0.08)', border: '1px solid rgba(124,111,255,0.2)', borderRadius: 5, padding: '2px 8px', fontFamily: bodyFont, fontSize: 11, color: '#8B8FBF' }}>{t}</span>
          ))}
        </div>

        {/* Price + CTA */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 20, color: '#F0F2FF' }}>৳৫০</span>
          {owned ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={onRead}
                style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, padding: '7px 12px', color: '#22C55E', fontFamily: bodyFont, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                📄 {T('mag_read')}
              </button>
              {mag.quiz && (
                <button onClick={onQuiz}
                  style={{ background: 'linear-gradient(135deg, #7C6FFF, #A78BFA)', border: 'none', borderRadius: 8, padding: '7px 12px', color: '#fff', fontFamily: bodyFont, fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 3px 10px rgba(124,111,255,0.4)' }}>
                  ⚡ Quiz
                </button>
              )}
            </div>
          ) : (
            <button onClick={onBuy}
              style={{ background: 'linear-gradient(135deg, #7C6FFF, #A78BFA)', border: 'none', borderRadius: 8, padding: '8px 18px', color: '#fff', fontFamily: bodyFont, fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 14px rgba(124,111,255,0.35)', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(124,111,255,0.55)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(124,111,255,0.35)'; e.currentTarget.style.transform = 'none'; }}
            >{T('mag_buy')}</button>
          )}
        </div>
      </div>
    </div>
  );
}

export { MagCard };
