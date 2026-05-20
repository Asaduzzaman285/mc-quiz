import React, { useState, useEffect, useCallback, useRef } from 'react';
import MCQUIZ_API from './api';

const QUIZ_DURATION = 180;
const telegramLink = 'https://t.me/MCQuizBD';

export default function LiveQuiz({ navigate, lang, T, quizId }) {
  const bodyFont = lang === 'bn' ? "'Anek Bangla', sans-serif" : 'Inter, sans-serif';

  // Phase: intro | otp | loading | quiz | results | error
  const [phase, setPhase] = useState('intro');
  const [quizData, setQuizData] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loadingQuiz, setLoadingQuiz] = useState(true);
  const [startError, setStartError] = useState('');
  const [submitResult, setSubmitResult] = useState(null);

  // OTP state (simulated — no real SMS yet)
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  // Quiz state
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(QUIZ_DURATION);
  const [showCorrect, setShowCorrect] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const answersRef = useRef([]);
  const timeRef = useRef(QUIZ_DURATION);
  const phaseRef = useRef('intro'); // tracks phase without stale closure issues
  const submittedRef = useRef(false);  // prevents double-submit

  // Keep phaseRef in sync
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const data = quizId
          ? await MCQUIZ_API.getQuiz(quizId)
          : await MCQUIZ_API.getActiveQuiz();
        if (data) setQuizData(data);
      } catch (err) {
        console.error('Failed to fetch quiz', err);
      } finally {
        setLoadingQuiz(false);
      }
    };
    fetchQuiz();
  }, [quizId]);

  // Timer — only runs during quiz phase
  useEffect(() => {
    if (phase !== 'quiz') return;
    const id = setInterval(() => {
      setTimeLeft(t => {
        timeRef.current = t - 1;
        if (t <= 1) { finishQuiz(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  // Start quiz — calls API to get session + shuffled questions
  const handleStartQuiz = async () => {
    if (!quizData) return;
    setPhase('loading');
    setStartError('');
    try {
      const res = await MCQUIZ_API.startQuiz(quizData.id);
      setSessionId(res.session_id);
      setQuestions(res.questions || []);
      setTimeLeft(res.time_remaining || QUIZ_DURATION);
      timeRef.current = res.time_remaining || QUIZ_DURATION;
      setPhase('quiz');
    } catch (err) {
      setStartError(err.message || 'Failed to start quiz');
      setPhase('intro');
    }
  };

  // Submit answers to API — uses refs to avoid stale closure issues
  const finishQuiz = useCallback(async () => {
    if (phaseRef.current === 'results' || submittedRef.current) return;
    submittedRef.current = true;
    setPhase('results');
    setSubmitting(true);
    try {
      const payload = answersRef.current.map(a => ({
        question_id: a.question_id,
        selected_option: a.selected_option,
      }));
      const result = await MCQUIZ_API.submitQuiz(sessionId, payload);
      setSubmitResult(result);
    } catch (err) {
      console.error('Submit failed', err);
      // Still show results screen even if submit fails
      setSubmitResult({ correct_count: 0, total_answered: answersRef.current.length, accuracy_percentage: 0, winning_probability: 0 });
    } finally {
      setSubmitting(false);
    }
  }, [sessionId]);

  const handleSelect = useCallback((idx) => {
    if (selected !== null || showCorrect) return;
    const q = questions[current];
    setSelected(idx);
    setShowCorrect(true);
    // We don't know correct_option (stripped by backend for fairness)
    // Just record the answer and advance after brief highlight
    const newAnswer = { question_id: q.id, selected_option: idx };
    answersRef.current = [...answersRef.current, newAnswer];
    setAnswers(prev => [...prev, newAnswer]);
    setTimeout(() => {
      setSelected(null);
      setShowCorrect(false);
      if (current + 1 >= questions.length) { finishQuiz(); }
      else { setCurrent(c => c + 1); }
    }, 500);
  }, [current, selected, showCorrect, questions, finishQuiz]);

  // OTP handlers (simulated)
  const handleSendOtp = () => {
    setOtpLoading(true);
    setTimeout(() => { setOtpLoading(false); setOtpSent(true); setOtpError(''); }, 1200);
  };
  const handleOtpDigit = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otpDigits]; next[i] = val; setOtpDigits(next); setOtpError('');
    if (val && i < 5) otpRefs[i + 1].current?.focus();
    if (!val && i > 0) otpRefs[i - 1].current?.focus();
  };
  const handleOtpVerify = () => {
    if (otpDigits.join('').length < 6) {
      setOtpError(lang === 'bn' ? '৬ সংখ্যার OTP দিন' : 'Enter the 6-digit OTP');
      return;
    }
    handleStartQuiz();
  };

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const timePct = (timeLeft / QUIZ_DURATION) * 100;
  const timerColor = timePct > 50 ? '#22C55E' : timePct > 25 ? '#D4A843' : '#EF4444';

  // ── Loading state ──
  if (loadingQuiz) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 40, height: 40, border: '3px solid rgba(124,111,255,0.1)', borderTopColor: '#7C6FFF', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ── API loading (starting quiz) ──
  if (phase === 'loading') return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      <div style={{ width: 56, height: 56, border: '4px solid rgba(124,111,255,0.15)', borderTopColor: '#7C6FFF', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 18, color: '#F0F2FF' }}>
        {lang === 'bn' ? 'কুইজ শুরু হচ্ছে…' : 'Starting quiz…'}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ── INTRO ──
  if (phase === 'intro') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'rgba(28,32,64,0.7)', border: '1px solid rgba(124,111,255,0.2)', borderRadius: 24, padding: '48px 48px', maxWidth: 560, width: '100%', textAlign: 'center', backdropFilter: 'blur(16px)' }}>
        <div style={{ width: 70, height: 70, borderRadius: 20, background: 'linear-gradient(135deg,#7C6FFF,#A78BFA)', margin: '0 auto 22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, boxShadow: '0 8px 28px rgba(124,111,255,0.4)' }}>⚡</div>
        <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 28, color: '#F0F2FF', margin: '0 0 10px', letterSpacing: '-0.8px' }}>{T('quiz_title')}</h2>
        <p style={{ fontFamily: bodyFont, fontSize: 15, color: '#7A82A8', lineHeight: 1.7, margin: '0 0 28px' }}>
          {T('quiz_intro_desc')} <strong style={{ color: '#D4A843' }}>3 {T('quiz_min')}</strong>
          <br />{lang === 'bn' ? 'যত বেশি সঠিক উত্তর, তত বেশি স্কোর!' : 'Answer as many as you can. Highest scorer wins!'}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
          {[['200', lang === 'bn' ? 'প্রশ্ন' : 'Questions'], ['3 min', lang === 'bn' ? 'সময়সীমা' : 'Time Limit'], ['৳15,000', lang === 'bn' ? '১ম পুরস্কার' : '1st Prize']].map(([v, l]) => (
            <div key={l} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '14px 10px' }}>
              <div style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 800, fontSize: 20, color: '#A78BFA' }}>{v}</div>
              <div style={{ fontFamily: bodyFont, fontSize: 12, color: '#7A82A8', marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>
        {startError && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px', marginBottom: 16, color: '#EF4444', fontFamily: bodyFont, fontSize: 13 }}>{startError}</div>
        )}
        <button onClick={() => setPhase('otp')} style={{ width: '100%', background: 'linear-gradient(135deg,#7C6FFF,#A78BFA)', border: 'none', borderRadius: 12, padding: '14px', color: '#fff', fontFamily: bodyFont, fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 6px 24px rgba(124,111,255,0.4)' }}>
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
        <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 24, color: '#F0F2FF', margin: '0 0 10px' }}>{T('otp_title')}</h2>
        <p style={{ fontFamily: bodyFont, fontSize: 14, color: '#7A82A8', margin: '0 0 26px', lineHeight: 1.65 }}>{T('otp_desc')}</p>
        {!otpSent ? (
          <>
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px', marginBottom: 20, textAlign: 'left' }}>
              <div style={{ fontFamily: bodyFont, fontSize: 12, color: '#7A82A8', marginBottom: 3 }}>{T('otp_registered')}</div>
              <div style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: 16, color: '#F0F2FF' }}>+880 1712-XXXXX</div>
            </div>
            <button onClick={handleSendOtp} disabled={otpLoading} style={{ width: '100%', background: 'linear-gradient(135deg,#7C6FFF,#A78BFA)', border: 'none', borderRadius: 12, padding: '13px', color: '#fff', fontFamily: bodyFont, fontSize: 15, fontWeight: 700, cursor: otpLoading ? 'not-allowed' : 'pointer', opacity: otpLoading ? 0.7 : 1 }}>
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
                  onKeyDown={e => { if (e.key === 'Backspace' && !otpDigits[i] && i > 0) otpRefs[i - 1].current?.focus(); }}
                  style={{ width: 46, height: 54, borderRadius: 12, textAlign: 'center', background: 'rgba(255,255,255,0.06)', border: `2px solid ${d ? 'rgba(124,111,255,0.6)' : 'rgba(255,255,255,0.1)'}`, fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: 22, color: '#F0F2FF', outline: 'none' }} />
              ))}
            </div>
            {otpError && <div style={{ fontFamily: bodyFont, fontSize: 13, color: '#EF4444', marginBottom: 14 }}>{otpError}</div>}
            <button onClick={handleOtpVerify} style={{ width: '100%', background: 'linear-gradient(135deg,#7C6FFF,#A78BFA)', border: 'none', borderRadius: 12, padding: '13px', color: '#fff', fontFamily: bodyFont, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 12 }}>{T('otp_verify')}</button>
            <button onClick={() => { setOtpSent(false); setOtpDigits(['', '', '', '', '', '']); }} style={{ background: 'none', border: 'none', color: '#7A82A8', fontFamily: bodyFont, fontSize: 13, cursor: 'pointer' }}>{T('otp_resend')}</button>
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
    const finalScore = submitResult?.correct_count ?? 0;
    const finalTotal = submitResult?.total_answered ?? questions.length;
    const pct = submitResult?.accuracy_percentage ?? 0;
    const timeTaken = Math.abs(submitResult?.time_taken_seconds ?? 0);
    const wp = submitResult?.winning_probability ?? null;
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: 'rgba(28,32,64,0.7)', border: '1px solid rgba(124,111,255,0.2)', borderRadius: 24, padding: '48px 44px', maxWidth: 520, width: '100%', textAlign: 'center', backdropFilter: 'blur(16px)' }}>
          <div style={{ fontSize: 50, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 28, color: '#F0F2FF', margin: '0 0 8px', letterSpacing: '-0.8px' }}>{T('quiz_complete')}</h2>
          <p style={{ fontFamily: bodyFont, fontSize: 14, color: '#7A82A8', margin: '0 0 26px' }}>{T('quiz_great')}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
            {[[lang === 'bn' ? 'স্কোর' : 'Score', `${finalScore}/${finalTotal}`, '#A78BFA'], [T('quiz_accuracy'), `${pct}%`, '#22C55E'], [lang === 'bn' ? 'সময়' : 'Time', formatTime(timeTaken), '#D4A843']].map(([l, v, c]) => (
              <div key={l} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '16px 10px' }}>
                <div style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 800, fontSize: 22, color: c }}>{v}</div>
                <div style={{ fontFamily: bodyFont, fontSize: 12, color: '#7A82A8', marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
          {wp !== null && (
            <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 14, padding: '14px 18px', marginBottom: 18 }}>
              <div style={{ fontFamily: bodyFont, fontSize: 12, color: '#22C55E', fontWeight: 600, marginBottom: 4 }}>{lang === 'bn' ? 'জয়ের সম্ভাবনা' : 'Winning Probability'}</div>
              <div style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 800, fontSize: 28, color: '#22C55E' }}>{wp}%</div>
              <div style={{ fontFamily: bodyFont, fontSize: 12, color: '#7A82A8', marginTop: 4 }}>{lang === 'bn' ? 'আপনি এই কুইজে অংশগ্রহণকারীদের চেয়ে ভালো করেছেন' : 'You scored better than this % of participants'}</div>
            </div>
          )}
          {submitting && <div style={{ fontFamily: bodyFont, fontSize: 13, color: '#A78BFA', marginBottom: 16 }}>{lang === 'bn' ? 'ফলাফল সংরক্ষণ হচ্ছে…' : 'Saving results…'}</div>}
          <div style={{ background: 'rgba(212,168,67,0.08)', border: '1px solid rgba(212,168,67,0.2)', borderRadius: 14, padding: '16px 18px', marginBottom: 24, textAlign: 'left' }}>
            <div style={{ fontFamily: bodyFont, fontSize: 12, color: '#D4A843', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{T('quiz_result_title')}</div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 16, color: '#F0F2FF', marginBottom: 4 }}>{submitResult?.result_publish_date ?? quizData?.resultDate ?? '—'}</div>
            <div style={{ fontFamily: bodyFont, fontSize: 13, color: '#7A82A8', lineHeight: 1.65 }}>{T('quiz_result_note')}</div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => navigate('leaderboard')} style={{ flex: 1, background: 'linear-gradient(135deg,#7C6FFF,#A78BFA)', border: 'none', borderRadius: 11, padding: '13px', color: '#fff', fontFamily: bodyFont, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{T('quiz_view_lb')}</button>
            <button onClick={() => navigate('home')} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 11, padding: '13px', color: '#F0F2FF', fontFamily: bodyFont, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{T('quiz_go_home')}</button>
          </div>
        </div>
      </div>
    );
  }

  // ── QUIZ ──
  if (!questions.length) return null;
  const q = questions[current];
  const progress = (current / questions.length) * 100;
  const answeredCount = answers.length;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0C0E1A' }}>
      {/* Top bar */}
      <div style={{ background: 'rgba(13,15,28,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 28px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#7C6FFF,#A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk,sans-serif', fontWeight: 800, fontSize: 12, color: '#fff' }}>MC</div>
          <span style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: 15, color: '#F0F2FF' }}>{T('quiz_title')}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { label: lang === 'bn' ? 'উত্তর দেওয়া' : 'Answered', val: answeredCount, color: '#A78BFA' },
            { label: lang === 'bn' ? 'বাকি' : 'Remaining', val: questions.length - answeredCount, color: '#7A82A8' },
          ].map(chip => (
            <div key={chip.label} style={{ display: 'flex', alignItems: 'center', gap: 6, background: `${chip.color}14`, border: `1px solid ${chip.color}35`, borderRadius: 8, padding: '5px 12px' }}>
              <span style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: 13, color: chip.color }}>{chip.val}</span>
              <span style={{ fontFamily: bodyFont, fontSize: 11, color: '#7A82A8' }}>{chip.label}</span>
            </div>
          ))}
        </div>
        <button onClick={() => navigate('quiz-lobby')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 14px', color: '#7A82A8', fontFamily: bodyFont, fontSize: 13, cursor: 'pointer' }}>✕</button>
      </div>
      <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#7C6FFF,#A78BFA)', transition: 'width 0.3s ease' }} />
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'stretch', justifyContent: 'center', padding: '28px 28px 0' }}>
        <div style={{ width: '100%', maxWidth: 1100, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'stretch' }}>
          {/* Left: Question */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ background: 'rgba(124,111,255,0.12)', border: '1px solid rgba(124,111,255,0.25)', borderRadius: 7, padding: '4px 13px', fontFamily: bodyFont, fontSize: 12, fontWeight: 600, color: '#A78BFA', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{q.category || 'General'}</span>
              <span style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: 14, color: '#7A82A8' }}>{lang === 'bn' ? 'প্রশ্ন' : 'Q'} {current + 1} / {questions.length}</span>
            </div>
            <div style={{ flex: 1, background: 'rgba(28,32,64,0.7)', border: '1px solid rgba(124,111,255,0.18)', borderRadius: 20, padding: '32px 30px', backdropFilter: 'blur(14px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 21, color: '#F0F2FF', margin: 0, lineHeight: 1.55 }}>{q.question_text}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
              {[
                { label: lang === 'bn' ? 'উত্তর দেওয়া' : 'Answered', val: answeredCount, color: '#A78BFA' },
                { label: lang === 'bn' ? 'বাকি' : 'Remaining', val: questions.length - answeredCount, color: '#7A82A8' },
              ].map(s => (
                <div key={s.label} style={{ background: `${s.color}10`, border: `1px solid ${s.color}25`, borderRadius: 12, padding: '13px 14px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 800, fontSize: 20, color: s.color }}>{s.val}</div>
                  <div style={{ fontFamily: bodyFont, fontSize: 11, color: '#7A82A8', marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Right: Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontFamily: bodyFont, fontSize: 12, color: '#7A82A8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{lang === 'bn' ? 'সঠিক উত্তর বেছে নিন' : 'Select the correct answer'}</div>
            {(q.options || []).map((opt, i) => {
              // No correct_option on frontend — just highlight selected
              const isSelected = showCorrect && i === selected;
              const bg = isSelected ? 'rgba(124,111,255,0.18)' : 'rgba(28,32,64,0.6)';
              const border = isSelected ? 'rgba(124,111,255,0.7)' : 'rgba(255,255,255,0.08)';
              const color = '#F0F2FF';
              const labelBg = isSelected ? 'rgba(124,111,255,0.3)' : 'rgba(124,111,255,0.12)';
              const labelColor = '#A78BFA';
              return (
                <button key={i} onClick={() => handleSelect(i)} style={{ background: bg, border: `2px solid ${border}`, borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: selected !== null ? 'default' : 'pointer', transition: 'all 0.18s', textAlign: 'left', width: '100%', backdropFilter: 'blur(8px)', flex: 1 }}
                  onMouseEnter={e => { if (selected === null) { e.currentTarget.style.borderColor = 'rgba(124,111,255,0.45)'; e.currentTarget.style.background = 'rgba(124,111,255,0.08)'; } }}
                  onMouseLeave={e => { if (selected === null) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(28,32,64,0.6)'; } }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: labelBg, border: `1px solid ${labelColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk,sans-serif', fontWeight: 800, fontSize: 14, color: labelColor }}>
                    {['A', 'B', 'C', 'D'][i]}
                  </div>
                  <span style={{ fontFamily: bodyFont, fontSize: 15, fontWeight: 500, color, lineHeight: 1.45 }}>{opt}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      {/* Timer bar */}
      <div style={{ padding: '20px 28px 24px', flexShrink: 0 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', background: 'rgba(28,32,64,0.7)', border: `1px solid ${timerColor}33`, borderRadius: 16, padding: '16px 28px', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 800, fontSize: 26, color: timerColor, lineHeight: 1 }}>{formatTime(timeLeft)}</div>
          <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${timePct}%`, background: `linear-gradient(90deg,${timerColor},${timerColor}aa)`, borderRadius: 4, transition: 'width 1s linear' }} />
          </div>
          <div style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: 16, color: '#F0F2FF' }}>{answeredCount}<span style={{ color: '#7A82A8', fontSize: 13, fontWeight: 400 }}>/{questions.length}</span></div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
