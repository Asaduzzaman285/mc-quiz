import React, { useState } from 'react';
import { MCQUIZ_DATA } from './data';

export default function Leaderboard({ navigate, lang, T, leaderboard }) {
  const list = leaderboard || [];
  const bodyFont = lang === 'bn' ? "'Anek Bangla', sans-serif" : 'Inter, sans-serif';
  const medals = { 1: '#D4A843', 2: '#A8A8B3', 3: '#CD7F32' };
  const VISIBLE = 7;
  const rowH = 56;
  const maxScroll = Math.max(0, (list.length - VISIBLE) * rowH);
  const [scrollTop, setScrollTop] = useState(0);

  return (
    <div style={{ minHeight: '100vh', paddingTop: 88, color: '#F0F2FF' }}>
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '40px 24px' }}>

        <div style={{ marginBottom: 44 }}>
          <div style={{ fontFamily: bodyFont, fontSize: 13, color: '#D4A843', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>{T('lb_hall')}</div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 40, color: '#F0F2FF', margin: '0 0 14px', letterSpacing: '-1.2px' }}>{T('lb_title')}</h1>
          <p style={{ fontFamily: bodyFont, fontSize: 15, color: '#7A82A8', margin: 0, lineHeight: 1.7 }}>
            {lang === 'bn' ? 'মার্চ ২০২৬ — মাসিক MCQ চ্যালেঞ্জের চূড়ান্ত ফলাফল' : 'March 2026 — Final results of the monthly MCQ challenge'}
          </p>
        </div>

        {/* Prize podium */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 44 }}>
          {[list[1], list[0], list[2]].map((p, i) => {
            if (!p) return <div key={i} />;
            const realRank = i === 0 ? 2 : i === 1 ? 1 : 3;
            const m = medals[realRank];
            const heights = ['160px', '200px', '140px'];
            return (
              <div key={p.rank} style={{ background: `linear-gradient(145deg, ${m}12, ${m}06)`, border: `1px solid ${m}33`, borderRadius: 20, padding: '24px 18px', textAlign: 'center', alignSelf: 'end', minHeight: heights[i], display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(12px)' }}>
                <div style={{ fontSize: 26, marginBottom: 10 }}>{['🥈','🥇','🥉'][i]}</div>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: `${m}20`, border: `2px solid ${m}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 16, color: m, marginBottom: 10 }}>{p.avatar || p.name[0]}</div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: '#F0F2FF', marginBottom: 2 }}>{p.name}</div>
                <div style={{ fontFamily: bodyFont, fontSize: 12, color: '#7A82A8', marginBottom: 8 }}>{p.district}</div>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 18, color: m }}>{p.prize}</div>
                <div style={{ fontFamily: bodyFont, fontSize: 12, color: '#7A82A8', marginTop: 3 }}>{p.score} {lang === 'bn' ? 'পয়েন্ট' : 'pts'} · {p.correct}/200</div>
              </div>
            );
          })}
        </div>

        {/* Scrollable full table */}
        <div style={{ background: 'rgba(28,32,64,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, overflow: 'hidden', backdropFilter: 'blur(12px)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr 80px 100px 110px', padding: '13px 24px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {[T('lb_rank'), T('lb_participant'), T('lb_score'), T('lb_district'), T('lb_prize')].map(h => (
              <div key={h} style={{ fontFamily: bodyFont, fontSize: 12, color: '#7A82A8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</div>
            ))}
          </div>

          <div style={{ height: VISIBLE * rowH, overflow: 'hidden' }}
            onWheel={e => { e.preventDefault(); setScrollTop(t => Math.min(maxScroll, Math.max(0, t + e.deltaY))); }}>
            <div style={{ transform: `translateY(-${scrollTop}px)`, transition: 'transform 0.15s ease' }}>
              {list.map((p, i) => {
                const mc = medals[p.rank];
                const isPrize = p.prize && p.prize !== '—';
                return (
                  <div key={p.rank} style={{ display: 'grid', gridTemplateColumns: '56px 1fr 80px 100px 110px', padding: '0 24px', height: rowH, alignItems: 'center', borderBottom: i < list.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', background: p.rank <= 3 ? `${mc}08` : 'transparent', transition: 'background 0.2s' }}
                  onMouseEnter={e => { if (p.rank > 3) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                  onMouseLeave={e => { if (p.rank > 3) e.currentTarget.style.background = 'transparent'; }}>
                    <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 14, color: mc || '#7A82A8' }}>
                      {p.rank <= 3 ? ['🥇','🥈','🥉'][p.rank-1] : `#${p.rank}`}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: mc ? `${mc}20` : 'rgba(124,111,255,0.1)', border: `1px solid ${mc ? mc+'40' : 'rgba(124,111,255,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 11, color: mc || '#A78BFA' }}>{p.avatar || p.name[0]}</div>
                      <div>
                        <div style={{ fontFamily: bodyFont, fontWeight: 600, fontSize: 14, color: '#F0F2FF' }}>{p.name}</div>
                      </div>
                    </div>
                    <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 15, color: '#A78BFA' }}>{p.score}</div>
                    <div style={{ fontFamily: bodyFont, fontSize: 13, color: '#7A82A8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.district}</div>
                    <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 13, color: isPrize ? '#D4A843' : '#555C7A' }}>{p.prize || '—'}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ padding: '10px 24px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: bodyFont, fontSize: 12, color: '#555C7A' }}>{T('lb_scroll')}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setScrollTop(t => Math.max(0, t - rowH * 3))} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, width: 28, height: 28, color: '#7A82A8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>↑</button>
              <button onClick={() => setScrollTop(t => Math.min(maxScroll, t + rowH * 3))} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, width: 28, height: 28, color: '#7A82A8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>↓</button>
            </div>
          </div>
        </div>

        <p style={{ fontFamily: bodyFont, fontSize: 13, color: '#7A82A8', textAlign: 'center', marginTop: 24, lineHeight: 1.7 }}>{T('lb_note')}</p>
      </div>
    </div>
  );
}
