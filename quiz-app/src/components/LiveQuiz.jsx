import React, { useState, useEffect, useCallback, useRef } from 'react';
import MCQUIZ_API from './api';

const QUIZ_DURATION = 180;

export default function LiveQuiz({ navigate, lang, T, quizId }) {
  const bodyFont = lang === 'bn' ? "'Anek Bangla', sans-serif" : 'Inter, sans-serif';

  const [phase, setPhase] = useState('intro');
  const [quizData, setQuizData] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [otpDigits, setOtpDigits] = useState(['','','','','','']);
  const [otpError, setOtpError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(QUIZ_DURATION);
  const [showCorrect, setShowCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const data = await MCQUIZ_API.getQuiz(quizId);
        if (data) {
          setQuizData(data);
          setQuizQuestions(data.questions || []);
          setTimeLeft(data.duration_minutes * 60 || QUIZ_DURATION);
        }
      } catch (err) {
        console.error("Failed to fetch quiz", err);
      } finally {
        setLoading(false);
      }
    };
    if (quizId) fetchQuiz();
  }, [quizId]);

  useEffect(() => {
    if (phase !== 'quiz') return;
    const id = setInterval(() => setTimeLeft(t => { 
        if (t <= 1) { 
            finishQuiz();
            return 0; 
        } 
        return t - 1; 
    }), 1000);
    return () => clearInterval(id);
  }, [phase]);

  const finishQuiz = async () => {
    setPhase('results');
    setSubmitting(true);
    try {
        await MCQUIZ_API.submitQuiz(quizId, {
            score: score,
            time_taken: (quizData.duration_minutes * 60) - timeLeft,
            answers: answers
        });
    } catch (err) {
        console.error("Failed to submit quiz", err);
    } finally {
        setSubmitting(false);
    }
  };

  const formatTime = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const timePct = quizData ? (timeLeft / (quizData.duration_minutes * 60)) * 100 : 0;
  const timerColor = timePct > 50 ? '#22C55E' : timePct > 25 ? '#D4A843' : '#EF4444';

  const handleSendOtp = () => { setOtpLoading(true); setTimeout(() => { setOtpLoading(false); setOtpSent(true); setOtpError(''); }, 1200); };
  const handleOtpDigit = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otpDigits]; next[i] = val; setOtpDigits(next); setOtpError('');
    if (val && i < 5) otpRefs[i+1].current?.focus();
    if (!val && i > 0) otpRefs[i-1].current?.focus();
  };
  const handleOtpVerify = () => {
    if (otpDigits.join('').length < 6) { setOtpError(lang === 'bn' ? '৬ সংখ্যার OTP দিন' : 'Enter the 6-digit OTP'); return; }
    setPhase('quiz');
  };

  const handleSelect = useCallback((idx) => {
    if (selected !== null || showCorrect) return;
    const q = quizQuestions[current];
    setSelected(idx); setShowCorrect(true);
    if (idx === q.correct) setScore(s => s + 1);
    setAnswers(a => ({ ...a, [current]: { selected: idx, correct: idx === q.correct } }));
    setTimeout(() => {
      setSelected(null); setShowCorrect(false);
      if (current + 1 >= quizQuestions.length) finishQuiz();
      else setCurrent(c => c + 1);
    }, 700);
  }, [current, selected, showCorrect, quizQuestions, quizData, timeLeft, score, answers]);

  const correctCount = Object.values(answers).filter(a => a.correct).length;

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 40, height: 40, border: '3px solid rgba(124,111,255,0.1)', borderTopColor: '#7C6FFF', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  );

  // ── INTRO ──
  if (phase === 'intro') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'rgba(28,32,64,0.7)', border: '1px solid rgba(124,111,255,0.2)', borderRadius: 24, padding: '48px 48px', maxWidth: 560, width: '100%', textAlign: 'center', backdropFilter: 'blur(16px)' }}>
        <div style={{ width: 70, height: 70, borderRadius: 20, background: 'linear-gradient(135deg, #7C6FFF, #A78BFA)', margin: '0 auto 22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, boxShadow: '0 8px 28px rgba(124,111,255,0.4)' }}>⚡</div>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 28, color: '#F0F2FF', margin: '0 0 10px', letterSpacing: '-0.8px' }}>{T('quiz_title')}</h2>
        <p style={{ fontFamily: bodyFont, fontSize: 15, color: '#7A82A8', lineHeight: 1.7, margin: '0 0 28px' }}>
          {T('quiz_intro_desc')} <strong style={{ color: '#D4A843' }}>3 {T('quiz_min')}</strong>
          <br />{lang === 'bn' ? 'যত বেশি সঠিক উত্তর, তত বেশি স্কোর!' : 'Answer as many as you can. Highest scorer wins!'}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          {[['200', lang === 'bn' ? 'প্রশ্ন' : 'Questions'], ['3 min', lang === 'bn' ? 'সময়সীমা' : 'Time Limit'], ['৳15,000', lang === 'bn' ? '১ম পুরস্কার' : '1st Prize']].map(([v,l]) => (
            <div key={l} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '14px 10px' }}>
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 20, color: '#A78BFA' }}>{v}</div>
              <div style={{ fontFamily: bodyFont, fontSize: 12, color: '#7A82A8', marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ background: 'rgba(212,168,67,0.08)', border: '1px solid rgba(212,168,67,0.2)', borderRadius: 12, padding: '14px 18px', marginBottom: 24, textAlign: 'left' }}>
          <div style={{ fontFamily: bodyFont, fontSize: 13, color: '#D4A843', fontWeight: 600, marginBottom: 8 }}>{lang === 'bn' ? 'পুরস্কার' : 'Prize Breakdown'}</div>
          {[['1st', '৳ 15,000'], ['2nd', '৳ 5,000'], [lang === 'bn' ? '৩য়–২২তম' : '3rd–22nd', lang === 'bn' ? '৳ 1,000 করে (×20)' : '৳ 1,000 each (×20)']].map(([r,p]) => (
            <div key={r} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontFamily: bodyFont, fontSize: 13, color: '#8B90B0' }}>{r}</span>
              <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 13, color: '#D4A843' }}>{p}</span>
            </div>
          ))}
        </div>
        <div style={{ background: 'rgba(124,111,255,0.08)', border: '1px solid rgba(124,111,255,0.2)', borderRadius: 12, padding: '12px 16px', marginBottom: 24, textAlign: 'left' }}>
          <div style={{ fontFamily: bodyFont, fontSize: 13, color: '#A78BFA', fontWeight: 600, marginBottom: 6 }}>{T('quiz_rules')}</div>
          {(lang === 'bn' ? [`${quizData.duration_minutes} মিনিটের টাইমার শুরু হবে সাথে সাথে`, '৪টি অপশন থেকে একটি বেছে নিন', 'কোনো নেগেটিভ মার্কিং নেই', `ফলাফল: ${quizData.resultDate}`] : [`${quizData.duration_minutes}-minute countdown starts immediately`, 'Pick one answer from 4 options', 'No negative marking', `Results announced: ${quizData.resultDate}`]).map(r => (
            <div key={r} style={{ display: 'flex', gap: 8, marginBottom: 5 }}>
              <span style={{ color: '#A78BFA', fontSize: 11, marginTop: 2, flexShrink: 0 }}>›</span>
              <span style={{ fontFamily: bodyFont, fontSize: 13, color: '#8B90B0' }}>{r}</span>
            </div>
          ))}
        </div>
        <button onClick={() => setPhase('otp')} style={{ width: '100%', background: 'linear-gradient(135deg, #7C6FFF, #A78BFA)', border: 'none', borderRadius: 12, padding: '14px', color: '#fff', fontFamily: bodyFont, fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 6px 24px rgba(124,111,255,0.4)' }}>
          {lang === 'bn' ? 'যাচাই করুন ও শুরু করুন' : 'Verify & Start Quiz'}
        </button>
        <button onClick={() => navigate('quiz-lobby')} style={{ background: 'none', border: 'none', color: '#7A82A8', fontFamily: bodyFont, fontSize: 13, cursor: 'pointer', marginTop: 12 }}>{T('quiz_back_lobby')}</button>
      </div>
    </div>
  );

  // ── OTP ──
  if (phase === 'otp') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'rgba(28,32,64,0.7)', border: '1px solid rgba(124,111,255,0.2)', borderRadius: 24, padding: '48px 44px', maxWidth: 440, width: '100%', textAlign: 'center', backdropFilter: 'blur(16px)' }}>
        <div style={{ width: 60, height: 60, borderRadius: 16, background: 'rgba(124,111,255,0.15)', border: '1px solid rgba(124,111,255,0.3)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>📱</div>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 24, color: '#F0F2FF', margin: '0 0 10px' }}>{T('otp_title')}</h2>
        <p style={{ fontFamily: bodyFont, fontSize: 14, color: '#7A82A8', margin: '0 0 26px', lineHeight: 1.65 }}>{T('otp_desc')}</p>
        {!otpSent ? (
          <>
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px', marginBottom: 20, textAlign: 'left' }}>
              <div style={{ fontFamily: bodyFont, fontSize: 12, color: '#7A82A8', marginBottom: 3 }}>{T('otp_registered')}</div>
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 16, color: '#F0F2FF' }}>+880 1712-XXXXX</div>
            </div>
            <button onClick={handleSendOtp} disabled={otpLoading} style={{ width: '100%', background: 'linear-gradient(135deg, #7C6FFF, #A78BFA)', border: 'none', borderRadius: 12, padding: '13px', color: '#fff', fontFamily: bodyFont, fontSize: 15, fontWeight: 700, cursor: otpLoading ? 'not-allowed' : 'pointer', opacity: otpLoading ? 0.7 : 1 }}>
              {otpLoading ? (lang === 'bn' ? 'পাঠানো হচ্ছে…' : 'Sending…') : T('otp_send')}
            </button>
          </>
        ) : (
          <>
            <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 22 }}>
              <span style={{ fontFamily: bodyFont, fontSize: 13, color: '#22C55E' }}>{T('otp_sent')}</span>
            </div>
            <div style={{ display: 'flex', gap: 9, justifyContent: 'center', marginBottom: 22 }}>
              {otpDigits.map((d, i) => (
                <input key={i} ref={otpRefs[i]} type="text" inputMode="numeric" maxLength={1} value={d}
                  onChange={e => handleOtpDigit(i, e.target.value)}
                  onKeyDown={e => { if (e.key === 'Backspace' && !otpDigits[i] && i > 0) otpRefs[i-1].current?.focus(); }}
                  style={{ width: 46, height: 54, borderRadius: 12, textAlign: 'center', background: 'rgba(255,255,255,0.06)', border: `2px solid ${d ? 'rgba(124,111,255,0.6)' : 'rgba(255,255,255,0.1)'}`, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 22, color: '#F0F2FF', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(124,111,255,0.7)'}
                  onBlur={e => { if (!otpDigits[i]) e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }} />
              ))}
            </div>
            {otpError && <div style={{ fontFamily: bodyFont, fontSize: 13, color: '#EF4444', marginBottom: 14 }}>{otpError}</div>}
            <button onClick={handleOtpVerify} style={{ width: '100%', background: 'linear-gradient(135deg, #7C6FFF, #A78BFA)', border: 'none', borderRadius: 12, padding: '13px', color: '#fff', fontFamily: bodyFont, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 12 }}>{T('otp_verify')}</button>
            <button onClick={() => { setOtpSent(false); setOtpDigits(['','','','','','']); }} style={{ background: 'none', border: 'none', color: '#7A82A8', fontFamily: bodyFont, fontSize: 13, cursor: 'pointer' }}>{T('otp_resend')}</button>
          </>
        )}
        <div style={{ marginTop: 16, background: 'rgba(212,168,67,0.08)', border: '1px solid rgba(212,168,67,0.2)', borderRadius: 10, padding: '9px 14px' }}>
          <span style={{ fontFamily: bodyFont, fontSize: 12, color: '#D4A843' }}>{T('otp_demo')}</span>
        </div>
        <button onClick={() => setPhase('intro')} style={{ display: 'block', background: 'none', border: 'none', color: '#555C7A', fontFamily: bodyFont, fontSize: 13, cursor: 'pointer', marginTop: 14, width: '100%' }}>{T('otp_back')}</button>
      </div>
    </div>
  );

  // ── RESULTS ──
  if (phase === 'results') {
    const pct = Math.round((correctCount / quizQuestions.length) * 100);
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: 'rgba(28,32,64,0.7)', border: '1px solid rgba(124,111,255,0.2)', borderRadius: 24, padding: '48px 44px', maxWidth: 520, width: '100%', textAlign: 'center', backdropFilter: 'blur(16px)' }}>
          <div style={{ fontSize: 50, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 28, color: '#F0F2FF', margin: '0 0 8px', letterSpacing: '-0.8px' }}>{T('quiz_complete')}</h2>
          <p style={{ fontFamily: bodyFont, fontSize: 14, color: '#7A82A8', margin: '0 0 26px' }}>{T('quiz_great')}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
            {[[lang === 'bn' ? 'স্কোর' : 'Score', `${correctCount}`, '#A78BFA'], [T('quiz_accuracy'), `${pct}%`, '#22C55E'], [T('quiz_time_left'), formatTime(timeLeft), '#D4A843']].map(([l,v,c]) => (
              <div key={l} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '16px 10px' }}>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 24, color: c }}>{v}</div>
                <div style={{ fontFamily: bodyFont, fontSize: 12, color: '#7A82A8', marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ background: 'linear-gradient(135deg, rgba(41,182,246,0.1), rgba(41,182,246,0.05))', border: '1px solid rgba(41,182,246,0.25)', borderRadius: 16, padding: '18px 20px', marginBottom: 18, textAlign: 'left' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(41,182,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>✈️</div>
              <div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, color: '#F0F2FF', marginBottom: 4 }}>{T('quiz_telegram_title')}</div>
                <div style={{ fontFamily: bodyFont, fontSize: 13, color: '#7A82A8', lineHeight: 1.6, marginBottom: 10 }}>{T('quiz_telegram_desc')}</div>
                <a href={telegramLink} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: 'rgba(41,182,246,0.15)', border: '1px solid rgba(41,182,246,0.35)', borderRadius: 8, padding: '7px 14px', textDecoration: 'none', fontFamily: bodyFont, fontSize: 13, fontWeight: 700, color: '#29B6F6' }}>t.me/MCQuizBD →</a>
              </div>
            </div>
          </div>
          <div style={{ background: 'rgba(212,168,67,0.08)', border: '1px solid rgba(212,168,67,0.2)', borderRadius: 14, padding: '16px 18px', marginBottom: 24, textAlign: 'left' }}>
            <div style={{ fontFamily: bodyFont, fontSize: 12, color: '#D4A843', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{T('quiz_result_title')}</div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: '#F0F2FF', marginBottom: 4 }}>{quizData.resultDate}</div>
            <div style={{ fontFamily: bodyFont, fontSize: 13, color: '#7A82A8', lineHeight: 1.65 }}>{T('quiz_result_note')}</div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => navigate('leaderboard')} style={{ flex: 1, background: 'linear-gradient(135deg, #7C6FFF, #A78BFA)', border: 'none', borderRadius: 11, padding: '13px', color: '#fff', fontFamily: bodyFont, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{T('quiz_view_lb')}</button>
            <button onClick={() => navigate('home')} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 11, padding: '13px', color: '#F0F2FF', fontFamily: bodyFont, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{T('quiz_go_home')}</button>
          </div>
        </div>
      </div>
    );
  }

  // ── QUIZ ──
  const q = quizQuestions[current];
  const progress = (current / quizQuestions.length) * 100;
  const answeredCount = Object.keys(answers).length;
  const wrongCount = Object.values(answers).filter(a => !a.correct).length;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0C0E1A' }}>
      {/* Top bar */}
      <div style={{ background: 'rgba(13,15,28,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 28px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#7C6FFF,#A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk,sans-serif', fontWeight: 800, fontSize: 12, color: '#fff' }}>MC</div>
          <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 15, color: '#F0F2FF' }}>{T('quiz_title')}</span>
        </div>
        {/* Score chips */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { icon: '✓', label: lang === 'bn' ? 'সঠিক' : 'Correct', val: score, color: '#22C55E' },
            { icon: '✗', label: lang === 'bn' ? 'ভুল' : 'Wrong', val: wrongCount, color: '#EF4444' },
            { icon: '→', label: lang === 'bn' ? 'বাকি' : 'Left', val: quizQuestions.length - answeredCount, color: '#A78BFA' },
          ].map(chip => (
            <div key={chip.label} style={{ display: 'flex', alignItems: 'center', gap: 6, background: `${chip.color}14`, border: `1px solid ${chip.color}35`, borderRadius: 8, padding: '5px 12px' }}>
              <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 13, color: chip.color }}>{chip.icon} {chip.val}</span>
              <span style={{ fontFamily: bodyFont, fontSize: 11, color: '#7A82A8' }}>{chip.label}</span>
            </div>
          ))}
        </div>
        <button onClick={() => navigate('quiz-lobby')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 14px', color: '#7A82A8', fontFamily: bodyFont, fontSize: 13, cursor: 'pointer' }}>✕</button>
      </div>

      {/* Overall progress bar */}
      <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#7C6FFF,#A78BFA)', transition: 'width 0.3s ease' }} />
      </div>

      {/* Main two-column quiz card */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'stretch', justifyContent: 'center', padding: '28px 28px 0' }}>
        <div style={{ width: '100%', maxWidth: 1100, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'stretch' }}>

          {/* ── LEFT: Question + Stats ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Question number + category */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ background: 'rgba(124,111,255,0.12)', border: '1px solid rgba(124,111,255,0.25)', borderRadius: 7, padding: '4px 13px', fontFamily: bodyFont, fontSize: 12, fontWeight: 600, color: '#A78BFA', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{q.category}</span>
              <span style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: 14, color: '#7A82A8' }}>
                {lang === 'bn' ? 'প্রশ্ন' : 'Q'} {current + 1} / {quizQuestions.length}
              </span>
            </div>

            {/* Question card */}
            <div style={{ flex: 1, background: 'rgba(28,32,64,0.7)', border: '1px solid rgba(124,111,255,0.18)', borderRadius: 20, padding: '32px 30px', backdropFilter: 'blur(14px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontFamily: bodyFont, fontSize: 12, color: '#7A82A8', marginBottom: 16, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{lang === 'bn' ? 'প্রশ্নটি পড়ুন' : 'Read carefully'}</div>
              <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 21, color: '#F0F2FF', margin: 0, lineHeight: 1.55 }}>{q.question}</p>
            </div>

            {/* Stats row: answered / correct / wrong */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { label: lang === 'bn' ? 'উত্তর দেওয়া' : 'Answered', val: answeredCount, color: '#A78BFA', bg: 'rgba(124,111,255,0.1)', border: 'rgba(124,111,255,0.25)',
                  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                },
                { label: lang === 'bn' ? 'সঠিক' : 'Correct', val: score, color: '#22C55E', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.25)',
                  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                },
                { label: lang === 'bn' ? 'ভুল' : 'Wrong', val: wrongCount, color: '#EF4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)',
                  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.icon}</div>
                  <div>
                    <div style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 800, fontSize: 20, color: s.color, lineHeight: 1 }}>{s.val}</div>
                    <div style={{ fontFamily: bodyFont, fontSize: 11, color: '#7A82A8', marginTop: 3 }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Options ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontFamily: bodyFont, fontSize: 12, color: '#7A82A8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{lang === 'bn' ? 'সঠিক উত্তর বেছে নিন' : 'Select the correct answer'}</div>
            {q.options.map((opt, i) => {
              let bg = 'rgba(28,32,64,0.6)', border = 'rgba(255,255,255,0.08)', color = '#F0F2FF', labelBg = 'rgba(124,111,255,0.12)', labelColor = '#A78BFA';
              if (showCorrect) {
                if (i === q.correct) { bg = 'rgba(34,197,94,0.12)'; border = 'rgba(34,197,94,0.45)'; color = '#22C55E'; labelBg = 'rgba(34,197,94,0.2)'; labelColor = '#22C55E'; }
                else if (i === selected) { bg = 'rgba(239,68,68,0.12)'; border = 'rgba(239,68,68,0.45)'; color = '#EF4444'; labelBg = 'rgba(239,68,68,0.2)'; labelColor = '#EF4444'; }
              }
              return (
                <button key={i} onClick={() => handleSelect(i)} style={{ background: bg, border: `2px solid ${border}`, borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: selected !== null ? 'default' : 'pointer', transition: 'all 0.18s', textAlign: 'left', width: '100%', backdropFilter: 'blur(8px)', flex: 1 }}
                onMouseEnter={e => { if (selected === null) { e.currentTarget.style.borderColor='rgba(124,111,255,0.45)'; e.currentTarget.style.background='rgba(124,111,255,0.08)'; }}}
                onMouseLeave={e => { if (selected === null && !showCorrect) { e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'; e.currentTarget.style.background='rgba(28,32,64,0.6)'; }}}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: labelBg, border: `1px solid ${labelColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk,sans-serif', fontWeight: 800, fontSize: 14, color: labelColor }}>
                    {['A','B','C','D'][i]}
                  </div>
                  <span style={{ fontFamily: bodyFont, fontSize: 15, fontWeight: 500, color, lineHeight: 1.45 }}>{opt}</span>
                  {showCorrect && i === q.correct && (
                    <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  )}
                  {showCorrect && i === selected && i !== q.correct && (
                    <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Bottom Timer Bar ── */}
      <div style={{ padding: '20px 28px 24px', flexShrink: 0 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ background: 'rgba(28,32,64,0.7)', border: `1px solid ${timerColor}33`, borderRadius: 16, padding: '16px 28px', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', gap: 20 }}>
            {/* Clock icon */}
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${timerColor}15`, border: `1px solid ${timerColor}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={timerColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            {/* Timer display */}
            <div>
              <div style={{ fontFamily: bodyFont, fontSize: 11, color: '#7A82A8', marginBottom: 2 }}>{lang === 'bn' ? 'বাকি সময়' : 'Time Remaining'}</div>
              <div style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 800, fontSize: 26, color: timerColor, lineHeight: 1, letterSpacing: '-0.5px' }}>{formatTime(timeLeft)}</div>
            </div>
            {/* Progress bar */}
            <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${timePct}%`, background: `linear-gradient(90deg, ${timerColor}, ${timerColor}aa)`, borderRadius: 4, transition: 'width 1s linear, background 0.3s' }} />
            </div>
            {/* Question progress */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: bodyFont, fontSize: 11, color: '#7A82A8', marginBottom: 2 }}>{lang === 'bn' ? 'অগ্রগতি' : 'Progress'}</div>
              <div style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: 16, color: '#F0F2FF' }}>{answeredCount}<span style={{ color: '#7A82A8', fontSize: 13, fontWeight: 400 }}>/{quizQuestions.length}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
