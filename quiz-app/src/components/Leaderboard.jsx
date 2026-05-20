import React, { useState, useEffect } from 'react';
import MCQUIZ_API from './api';

export default function Leaderboard({ navigate, lang, T, leaderboard: initialLeaderboard }) {
  const bodyFont = lang === 'bn' ? "'Anek Bangla', sans-serif" : 'Inter, sans-serif';
  const medals = { 1: '#D4A843', 2: '#A8A8B3', 3: '#CD7F32' };
  const VISIBLE = 7;
  const rowH = 56;

  // Always fetch fresh data on mount — don't trust stale App.tsx state
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const normalise = (data) => (data || []).map((p, i) => ({
      rank: p.rank ?? i + 1,
      name: p.display_name ?? p.name ?? 'Unknown',
      avatar: p.avatar ?? (p.display_name ?? p.name ?? '?')[0].toUpperCase(),
      score: p.correct_count ?? p.score ?? 0,
      correct: p.correct_count ?? p.score ?? 0,
      district: p.district ?? '—',
      prize: p.prize ?? '—',
    }));

    const fetchFresh = async () => {
      try {
        const data = await MCQUIZ_API.getLeaderboard();
        if (!cancelled) setList(normalise(data));
      } catch (err) {
        console.error('Leaderboard fetch failed', err);
        if (!cancelled && initialLeaderboard?.length) setList(normalise(initialLeaderboard));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    // Fetch immediately on mount
    fetchFresh();

    // Auto-refresh every 30 seconds while page is open — keeps rankings live
    const interval = setInterval(fetchFresh, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const maxScroll = Math.max(0, (list.length - VISIBLE) * rowH);

  if (loading) return (
    <div style={{ minHeight: '100vh', paddingTop: 88, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(212,168,67,0.15)', borderTopColor: '#D4A843', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
        <div style={{ fontFamily: bodyFont, fontSize: 14, color: '#7A82A8' }}>
          {lang === 'bn' ? 'লিডারবোর্ড লোড হচ্ছে…' : 'Loading leaderboard…'}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', paddingTop: 88, color: '#F0F2FF' }}>
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '40px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 44 }}>
          <div style={{ fontFamily: bodyFont, fontSize: 13, color: '#D4A843', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>{T('lb_hall')}</div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 40, color: '#F0F2FF', margin: '0 0 14px', letterSpacing: '-1.2px' }}>{T('lb_title')}</h1>
          <p style={{ fontFamily: bodyFont, fontSize: 15, color: '#7A82A8', margin: 0, lineHeight: 1.7 }}>
            {lang === 'bn'
              ? `${list.length} জন অংশগ্রহণকারীর ফলাফল — সর্বোচ্চ স্কোর ও দ্রুততার ভিত্তিতে র‍্যাংকিং`
              : `${list.length} participant${list.length !== 1 ? 's' : ''} — ranked by highest score then fastest time`}
          </p>
        </div>

        {list.length === 0 ? (
          <div style={{ background: 'rgba(28,32,64,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '60px', textAlign: 'center', backdropFilter: 'blur(12px)' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🏆</div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, color: '#F0F2FF', marginBottom: 8 }}>
              {lang === 'bn' ? 'এখনো কোনো ফলাফল নেই' : 'No results yet'}
            </div>
            <div style={{ fontFamily: bodyFont, fontSize: 14, color: '#7A82A8' }}>
              {lang === 'bn' ? 'কুইজে অংশ নিন এবং প্রথম হন!' : 'Be the first to complete the quiz!'}
            </div>
            <button onClick={() => navigate('quiz-lobby')} style={{ marginTop: 20, background: 'linear-gradient(135deg,#7C6FFF,#A78BFA)', border: 'none', borderRadius: 12, padding: '12px 28px', color: '#fff', fontFamily: bodyFont, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              {lang === 'bn' ? 'কুইজে যান' : 'Go to Quiz'}
            </button>
          </div>
        ) : (
          <>
            {/* Prize podium — top 3 */}
            {list.length >= 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 44 }}>
                {[list[1], list[0], list[2]].map((p, i) => {
                  if (!p) return <div key={i} />;
                  const realRank = i === 0 ? 2 : i === 1 ? 1 : 3;
                  const m = medals[realRank];
                  const heights = ['160px', '200px', '140px'];
                  return (
                    <div key={realRank} style={{ background: `linear-gradient(145deg, ${m}12, ${m}06)`, border: `1px solid ${m}33`, borderRadius: 20, padding: '24px 18px', textAlign: 'center', alignSelf: 'end', minHeight: heights[i], display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(12px)' }}>
                      <div style={{ fontSize: 26, marginBottom: 10 }}>{['🥈', '🥇', '🥉'][i]}</div>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: `${m}20`, border: `2px solid ${m}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 16, color: m, marginBottom: 10 }}>
                        {p.avatar}
                      </div>
                      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: '#F0F2FF', marginBottom: 2 }}>{p.name}</div>
                      <div style={{ fontFamily: bodyFont, fontSize: 12, color: '#7A82A8', marginBottom: 8 }}>{p.district}</div>
                      <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 18, color: m }}>{p.prize}</div>
                      <div style={{ fontFamily: bodyFont, fontSize: 12, color: '#7A82A8', marginTop: 3 }}>
                        {p.score} {lang === 'bn' ? 'পয়েন্ট' : 'pts'}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Full scrollable table */}
            <div style={{ background: 'rgba(28,32,64,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, overflow: 'hidden', backdropFilter: 'blur(12px)' }}>
              {/* Header row */}
              <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr 80px 100px 110px', padding: '13px 24px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {[T('lb_rank'), T('lb_participant'), T('lb_score'), T('lb_district'), T('lb_prize')].map(h => (
                  <div key={h} style={{ fontFamily: bodyFont, fontSize: 12, color: '#7A82A8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</div>
                ))}
              </div>

              {/* Scrollable rows */}
              <div style={{ height: Math.min(list.length, VISIBLE) * rowH, overflow: 'hidden' }}
                onWheel={e => { e.preventDefault(); setScrollTop(t => Math.min(maxScroll, Math.max(0, t + e.deltaY))); }}>
                <div style={{ transform: `translateY(-${scrollTop}px)`, transition: 'transform 0.15s ease' }}>
                  {list.map((p, i) => {
                    const mc = medals[p.rank];
                    const isPrize = p.prize && p.prize !== '—';
                    return (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '56px 1fr 80px 100px 110px', padding: '0 24px', height: rowH, alignItems: 'center', borderBottom: i < list.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', background: p.rank <= 3 ? `${mc}08` : 'transparent', transition: 'background 0.2s' }}
                        onMouseEnter={e => { if (p.rank > 3) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                        onMouseLeave={e => { if (p.rank > 3) e.currentTarget.style.background = 'transparent'; }}>
                        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 14, color: mc || '#7A82A8' }}>
                          {p.rank <= 3 ? ['🥇', '🥈', '🥉'][p.rank - 1] : `#${p.rank}`}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: mc ? `${mc}20` : 'rgba(124,111,255,0.1)', border: `1px solid ${mc ? mc + '40' : 'rgba(124,111,255,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 11, color: mc || '#A78BFA' }}>
                            {p.avatar}
                          </div>
                          <div style={{ fontFamily: bodyFont, fontWeight: 600, fontSize: 14, color: '#F0F2FF' }}>{p.name}</div>
                        </div>
                        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 15, color: '#A78BFA' }}>{p.score}</div>
                        <div style={{ fontFamily: bodyFont, fontSize: 13, color: '#7A82A8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.district}</div>
                        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 13, color: isPrize ? '#D4A843' : '#555C7A' }}>{p.prize || '—'}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div style={{ padding: '10px 24px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: bodyFont, fontSize: 12, color: '#555C7A' }}>
                  {list.length > VISIBLE ? T('lb_scroll') : `${list.length} ${lang === 'bn' ? 'জন অংশগ্রহণকারী' : 'participant(s)'}`}
                </span>
                {list.length > VISIBLE && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setScrollTop(t => Math.max(0, t - rowH * 3))} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, width: 28, height: 28, color: '#7A82A8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>↑</button>
                    <button onClick={() => setScrollTop(t => Math.min(maxScroll, t + rowH * 3))} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, width: 28, height: 28, color: '#7A82A8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>↓</button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <p style={{ fontFamily: bodyFont, fontSize: 13, color: '#7A82A8', textAlign: 'center', marginTop: 24, lineHeight: 1.7 }}>{T('lb_note')}</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
