import React, { useState } from 'react';
import MCQUIZ_API from './api';

export default function PaymentGateway({ magazine, navigate, onSuccess, lang, T }) {
  const [method, setMethod] = useState(null);
  const [step, setStep] = useState('select');
  const [num, setNum] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const bodyFont = lang === 'bn' ? "'Anek Bangla', sans-serif" : 'Inter, sans-serif';

  const methods = [
    { id: 'bkash', label: 'bKash', color: '#E2136E' },
    { id: 'nagad', label: 'Nagad', color: '#F7941D' },
    { id: 'rocket', label: 'Rocket', color: '#8B1FA9' },
    { id: 'card', label: 'Card / Net Banking', color: '#3B82F6' },
  ];
  const selected = methods.find(m => m.id === method);

  const handleProceed = () => {
    if (!method) { setError(lang === 'bn' ? 'পেমেন্ট পদ্ধতি বেছে নিন' : 'Please select a payment method'); return; }
    setError(''); setStep('details');
  };

  const handlePay = async () => {
    if (method !== 'card' && !num.match(/^01[3-9]\d{8}$/)) { setError(lang === 'bn' ? 'সঠিক মোবাইল নম্বর দিন' : 'Enter valid mobile number'); return; }
    if (!pin || pin.length < 4) { setError(lang === 'bn' ? 'PIN দিন' : 'Enter your PIN'); return; }
    setError(''); 
    setStep('processing');
    
    try {
        // Simulate gateway latency
        await new Promise(r => setTimeout(r, 2000));
        
        // Real backend recording
        await MCQUIZ_API.purchaseMagazine(magazine.id);
        
        setStep('success');
        onSuccess && onSuccess(magazine.id);
    } catch (err) {
        setStep('details');
        setError(err.message || 'Payment failed');
    }
  };

  if (step === 'processing') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', border: '4px solid rgba(124,111,255,0.2)', borderTop: '4px solid #7C6FFF', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: '#F0F2FF' }}>{T('pay_processing')}</div>
      <div style={{ fontFamily: bodyFont, fontSize: 14, color: '#7A82A8' }}>{T('pay_wait')}</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
    </div>
  );

  if (step === 'success') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'rgba(28,32,64,0.7)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 24, padding: '52px 44px', maxWidth: 480, width: '100%', textAlign: 'center', backdropFilter: 'blur(16px)' }}>
        <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.4)', margin: '0 auto 22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>✓</div>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 26, color: '#F0F2FF', margin: '0 0 10px', letterSpacing: '-0.8px' }}>{T('pay_success_title')}</h2>
        <p style={{ fontFamily: bodyFont, fontSize: 15, color: '#7A82A8', margin: '0 0 6px', lineHeight: 1.6 }}>
          {T('pay_success_desc')} <strong style={{ color: '#F0F2FF' }}>{magazine.name}</strong>
        </p>
        <p style={{ fontFamily: bodyFont, fontSize: 14, color: '#7A82A8', margin: '0 0 28px', lineHeight: 1.6 }}>
          {T('pay_success_note')} <strong style={{ color: '#D4A843' }}>April 2026 {T('pay_success_note2')}</strong> — {lang === 'bn' ? '৩০ এপ্রিল ২০২৬ পর্যন্ত বৈধ' : 'valid until April 30, 2026'}.
        </p>
        <div style={{ background: 'rgba(212,168,67,0.08)', border: '1px solid rgba(212,168,67,0.2)', borderRadius: 12, padding: '16px 18px', marginBottom: 24, textAlign: 'left' }}>
          <div style={{ fontFamily: bodyFont, fontSize: 13, color: '#D4A843', fontWeight: 600, marginBottom: 8 }}>{T('pay_what_next')}</div>
          {[T('pay_n1'), T('pay_n2'), T('pay_n3')].map(t => (
            <div key={t} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <span style={{ color: '#D4A843', fontSize: 12, marginTop: 2 }}>›</span>
              <span style={{ fontFamily: bodyFont, fontSize: 13, color: '#8B90B0', lineHeight: 1.5 }}>{t}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => navigate('home')} style={{ flex: 1, background: 'linear-gradient(135deg, #7C6FFF, #A78BFA)', border: 'none', borderRadius: 11, padding: '13px', color: '#fff', fontFamily: bodyFont, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{T('pay_go_home')}</button>
          <button onClick={() => navigate('quiz-lobby')} style={{ flex: 1, background: 'rgba(212,168,67,0.12)', border: '1px solid rgba(212,168,67,0.3)', borderRadius: 11, padding: '13px', color: '#D4A843', fontFamily: bodyFont, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{T('pay_enter_quiz')}</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', paddingTop: 88, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '100px 24px 60px' }}>
      <div style={{ width: '100%', maxWidth: 500 }}>
        <button onClick={() => step === 'details' ? setStep('select') : navigate('store')} style={{ background: 'none', border: 'none', color: '#7A82A8', fontFamily: bodyFont, fontSize: 14, cursor: 'pointer', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 6 }}>{T('pay_back')}</button>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 26, color: '#F0F2FF', margin: '0 0 6px', letterSpacing: '-0.8px' }}>{T('pay_title')}</h1>
        <p style={{ fontFamily: bodyFont, fontSize: 14, color: '#7A82A8', margin: '0 0 24px' }}>{T('pay_sub')}</p>

        {/* Order summary */}
        <div style={{ background: 'rgba(28,32,64,0.5)', border: `1px solid ${magazine.color}30`, borderRadius: 16, padding: '18px 20px', marginBottom: 20, display: 'flex', gap: 16, alignItems: 'center', backdropFilter: 'blur(12px)' }}>
          <div style={{ width: 50, height: 64, borderRadius: 8, background: `linear-gradient(145deg, ${magazine.color}30, ${magazine.color}10)`, border: `1px solid ${magazine.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 13, color: magazine.color }}>MC</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, color: '#F0F2FF', marginBottom: 4 }}>{magazine.name}</div>
            <div style={{ fontFamily: bodyFont, fontSize: 12, color: '#7A82A8', marginBottom: 6 }}>{magazine.pages} {T('pay_pages')} · PDF · {T('pay_quiz_entry')}</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {magazine.topics.slice(0,3).map(t => <span key={t} style={{ background: `${magazine.color}15`, border: `1px solid ${magazine.color}30`, borderRadius: 5, padding: '2px 7px', fontFamily: bodyFont, fontSize: 11, color: magazine.color }}>{t}</span>)}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 20, color: '#F0F2FF' }}>৳৫০</div>
            <div style={{ fontFamily: bodyFont, fontSize: 11, color: '#7A82A8' }}>{lang === 'bn' ? 'একবারের জন্য' : 'one-time'}</div>
          </div>
        </div>

        {step === 'select' && (
          <div style={{ background: 'rgba(28,32,64,0.6)', border: '1px solid rgba(124,111,255,0.15)', borderRadius: 20, padding: '26px 26px', backdropFilter: 'blur(12px)' }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: '#F0F2FF', marginBottom: 16 }}>{T('pay_method')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 22 }}>
              {methods.map(m => (
                <button key={m.id} onClick={() => { setMethod(m.id); setError(''); }} style={{ background: method === m.id ? `${m.color}18` : 'rgba(255,255,255,0.04)', border: `2px solid ${method === m.id ? m.color : 'rgba(255,255,255,0.08)'}`, borderRadius: 12, padding: '14px 12px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: m.color, boxShadow: `0 0 8px ${m.color}88`, flexShrink: 0 }} />
                  <span style={{ fontFamily: bodyFont, fontWeight: method === m.id ? 700 : 500, fontSize: 14, color: method === m.id ? '#F0F2FF' : '#8B90B0' }}>{m.label}</span>
                </button>
              ))}
            </div>
            {error && <div style={{ fontFamily: bodyFont, fontSize: 13, color: '#EF4444', marginBottom: 12 }}>{error}</div>}
            <button onClick={handleProceed} style={{ width: '100%', background: 'linear-gradient(135deg, #7C6FFF, #A78BFA)', border: 'none', borderRadius: 12, padding: '14px', color: '#fff', fontFamily: bodyFont, fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(124,111,255,0.4)' }}>{T('pay_proceed')}</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 14, justifyContent: 'center' }}>
              <span style={{ color: '#22C55E', fontSize: 13 }}>🔒</span>
              <span style={{ fontFamily: bodyFont, fontSize: 12, color: '#555C7A' }}>{T('pay_ssl')}</span>
            </div>
          </div>
        )}

        {step === 'details' && selected && (
          <div style={{ background: 'rgba(28,32,64,0.6)', border: '1px solid rgba(124,111,255,0.15)', borderRadius: 20, padding: '26px 26px', backdropFilter: 'blur(12px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: selected.color }} />
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: '#F0F2FF' }}>{selected.label}</span>
            </div>
            {method !== 'card' ? (
              <>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontFamily: bodyFont, fontSize: 13, fontWeight: 600, color: '#8B90B0', marginBottom: 8 }}>{selected.label} {T('pay_mobile_label')}</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontFamily: bodyFont, fontSize: 14, color: '#7A82A8' }}>🇧🇩 +88</span>
                    <input type="tel" value={num} onChange={e => { setNum(e.target.value); setError(''); }} placeholder="01XXXXXXXXX" style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 11, padding: '13px 16px 13px 72px', fontFamily: bodyFont, fontSize: 15, color: '#F0F2FF', outline: 'none' }} onFocus={e => e.target.style.borderColor = selected.color} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                  </div>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontFamily: bodyFont, fontSize: 13, fontWeight: 600, color: '#8B90B0', marginBottom: 8 }}>{selected.label} {T('pay_pin')}</label>
                  <input type="password" value={pin} onChange={e => { setPin(e.target.value); setError(''); }} placeholder="Enter PIN" style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 11, padding: '13px 16px', fontFamily: bodyFont, fontSize: 15, color: '#F0F2FF', outline: 'none' }} onFocus={e => e.target.style.borderColor = selected.color} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                </div>
              </>
            ) : (
              <>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontFamily: bodyFont, fontSize: 13, fontWeight: 600, color: '#8B90B0', marginBottom: 8 }}>Card Number</label>
                  <input type="text" value={num} onChange={e => setNum(e.target.value)} placeholder="XXXX XXXX XXXX XXXX" style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 11, padding: '13px 16px', fontFamily: bodyFont, fontSize: 15, color: '#F0F2FF', outline: 'none' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontFamily: bodyFont, fontSize: 13, fontWeight: 600, color: '#8B90B0', marginBottom: 8 }}>Expiry</label>
                    <input type="text" placeholder="MM / YY" style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 11, padding: '13px 16px', fontFamily: bodyFont, fontSize: 15, color: '#F0F2FF', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontFamily: bodyFont, fontSize: 13, fontWeight: 600, color: '#8B90B0', marginBottom: 8 }}>CVV</label>
                    <input type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="•••" style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 11, padding: '13px 16px', fontFamily: bodyFont, fontSize: 15, color: '#F0F2FF', outline: 'none' }} />
                  </div>
                </div>
              </>
            )}
            {error && <div style={{ fontFamily: bodyFont, fontSize: 13, color: '#EF4444', marginBottom: 12 }}>{error}</div>}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '13px 16px', marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: bodyFont, fontSize: 14, color: '#8B90B0' }}>{T('pay_total')}</span>
              <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 20, color: '#F0F2FF' }}>৳ ৫০.০০</span>
            </div>
            <button onClick={handlePay} style={{ width: '100%', background: `linear-gradient(135deg, ${selected.color}, ${selected.color}cc)`, border: 'none', borderRadius: 12, padding: '14px', color: '#fff', fontFamily: bodyFont, fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 20px ${selected.color}44` }}>{T('pay_confirm')}</button>
          </div>
        )}
      </div>
    </div>
  );
}
