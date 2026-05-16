import React, { useState } from 'react';
import { BD_DIVISIONS } from './data';
import MCQUIZ_API from './api';

export default function Auth({ mode, navigate, onLogin, lang, T }) {
  const [tab, setTab] = useState(mode || 'login');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '', division: '', district: '', nid: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const divisions = Object.keys(BD_DIVISIONS || {});
  const districts = form.division ? (BD_DIVISIONS[form.division] || []) : [];
  const bodyFont = lang === 'bn' ? "'Anek Bangla', sans-serif" : 'Inter, sans-serif';

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v, ...(k === 'division' ? { district: '' } : {}) })); setErrors(e => ({ ...e, [k]: undefined })); };

  const validate = () => {
    const e = {};
    if (tab === 'signup') {
      if (!form.name.trim()) e.name = lang === 'bn' ? 'পূর্ণ নাম আবশ্যক' : 'Full name is required';
      if (!form.phone.match(/^01[3-9]\d{8}$/)) e.phone = lang === 'bn' ? 'সঠিক মোবাইল নম্বর দিন (যেমন: 01712345678)' : 'Enter valid BD mobile number';
      if (!form.division) e.division = lang === 'bn' ? 'বিভাগ বেছে নিন' : 'Select your division';
      if (!form.district) e.district = lang === 'bn' ? 'জেলা বেছে নিন' : 'Select your district';
      if (form.password !== form.confirm) e.confirm = lang === 'bn' ? 'পাসওয়ার্ড মিলছে না' : 'Passwords do not match';
    }
    if (!form.email.includes('@')) e.email = lang === 'bn' ? 'সঠিক ইমেইল দিন' : 'Enter a valid email';
    if (form.password.length < 6) e.password = lang === 'bn' ? 'কমপক্ষে ৬ অক্ষর' : 'Minimum 6 characters';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    
    setLoading(true);
    try {
        if (tab === 'login') {
            await MCQUIZ_API.login(form.email, form.password);
        } else {
            await MCQUIZ_API.signup({
                name: form.name,
                email: form.email,
                phone: form.phone,
                password: form.password,
                division: form.division,
                district: form.district,
                nid: form.nid
            });
        }
        onLogin();
    } catch (err) {
        setErrors({ general: err.message });
    } finally {
        setLoading(false);
    }
  };

  const inputStyle = (hasErr) => ({ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: `1px solid ${hasErr ? '#EF4444' : 'rgba(255,255,255,0.1)'}`, borderRadius: 11, padding: '13px 16px', fontFamily: bodyFont, fontSize: 15, color: '#F0F2FF', outline: 'none', transition: 'border 0.2s' });
  const selectStyle = (hasErr) => ({ ...inputStyle(hasErr), appearance: 'none', cursor: 'pointer' });
  const Label = ({ children }) => <label style={{ display: 'block', fontFamily: bodyFont, fontSize: 13, fontWeight: 600, color: '#8B90B0', marginBottom: 8 }}>{children}</label>;
  const Err = ({ msg }) => msg ? <div style={{ fontFamily: bodyFont, fontSize: 12, color: '#EF4444', marginTop: 6 }}>{msg}</div> : null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 24px 60px' }}>
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 500 }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg, #7C6FFF, #A78BFA)', margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 20, color: '#fff', boxShadow: '0 6px 24px rgba(124,111,255,0.4)' }}>MC</div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 26, color: '#F0F2FF', margin: '0 0 6px', letterSpacing: '-0.8px' }}>{tab === 'login' ? T('auth_welcome') : T('auth_create')}</h1>
          <p style={{ fontFamily: bodyFont, fontSize: 14, color: '#7A82A8', margin: 0 }}>{tab === 'login' ? T('auth_signin_sub') : T('auth_join_sub')}</p>
        </div>

        <div style={{ background: 'rgba(28,32,64,0.65)', backdropFilter: 'blur(20px)', border: '1px solid rgba(124,111,255,0.15)', borderRadius: 24, padding: '30px 30px' }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 11, padding: 4, marginBottom: 22 }}>
            {['login', 'signup'].map(t => (
              <button key={t} onClick={() => { setTab(t); setErrors({}); setForm({ name:'', email:'', phone:'', password:'', confirm:'', division:'', district:'', nid:'' }); }} style={{ flex: 1, background: tab === t ? 'rgba(124,111,255,0.2)' : 'transparent', border: `1px solid ${tab === t ? 'rgba(124,111,255,0.35)' : 'transparent'}`, borderRadius: 8, padding: '9px', color: tab === t ? '#A78BFA' : '#7A82A8', fontFamily: bodyFont, fontSize: 14, fontWeight: tab === t ? 600 : 400, cursor: 'pointer', transition: 'all 0.2s' }}>
                {t === 'login' ? T('auth_login_tab') : T('auth_signup_tab')}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {errors.general && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 11, padding: '12px', marginBottom: 20, textAlign: 'center', color: '#EF4444', fontSize: 13, fontFamily: bodyFont }}>
                    {errors.general}
                </div>
            )}
            {tab === 'signup' && (
              <div style={{ marginBottom: 16 }}>
                <Label>{T('auth_fullname')}</Label>
                <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Arif Hossain" style={inputStyle(errors.name)}
                  onFocus={e => { if (!errors.name) e.target.style.borderColor='rgba(124,111,255,0.5)'; }}
                  onBlur={e => { if (!errors.name) e.target.style.borderColor='rgba(255,255,255,0.1)'; }} />
                <Err msg={errors.name} />
              </div>
            )}
            <div style={{ marginBottom: 16 }}>
              <Label>{T('auth_email')}</Label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" style={inputStyle(errors.email)}
                onFocus={e => { if (!errors.email) e.target.style.borderColor='rgba(124,111,255,0.5)'; }}
                onBlur={e => { if (!errors.email) e.target.style.borderColor='rgba(255,255,255,0.1)'; }} />
              <Err msg={errors.email} />
            </div>
            {tab === 'signup' && (
              <>
                <div style={{ marginBottom: 16 }}>
                  <Label>{T('auth_phone')}</Label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontFamily: bodyFont, fontSize: 14, color: '#7A82A8', pointerEvents: 'none' }}>🇧🇩 +88</span>
                    <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="01XXXXXXXXX" style={{ ...inputStyle(errors.phone), paddingLeft: 72 }}
                      onFocus={e => { if (!errors.phone) e.target.style.borderColor='rgba(124,111,255,0.5)'; }}
                      onBlur={e => { if (!errors.phone) e.target.style.borderColor='rgba(255,255,255,0.1)'; }} />
                  </div>
                  <div style={{ fontFamily: bodyFont, fontSize: 11, color: '#555C7A', marginTop: 5 }}>{T('auth_phone_note')}</div>
                  <Err msg={errors.phone} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div>
                    <Label>{T('auth_division')}</Label>
                    <div style={{ position: 'relative' }}>
                      <select value={form.division} onChange={e => set('division', e.target.value)} style={selectStyle(errors.division)}>
                        <option value="">{T('auth_select_division')}</option>
                        {divisions.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#7A82A8', pointerEvents: 'none', fontSize: 12 }}>▼</span>
                    </div>
                    <Err msg={errors.division} />
                  </div>
                  <div>
                    <Label>{T('auth_district')}</Label>
                    <div style={{ position: 'relative' }}>
                      <select value={form.district} onChange={e => set('district', e.target.value)} disabled={!form.division} style={{ ...selectStyle(errors.district), opacity: form.division ? 1 : 0.5 }}>
                        <option value="">{T('auth_select_district')}</option>
                        {districts.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#7A82A8', pointerEvents: 'none', fontSize: 12 }}>▼</span>
                    </div>
                    <Err msg={errors.district} />
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <Label>{T('auth_nid')} <span style={{ fontWeight: 400, color: '#555C7A' }}>{T('auth_nid_optional')}</span></Label>
                  <input type="text" value={form.nid} onChange={e => set('nid', e.target.value)} placeholder="NID or Student ID" style={inputStyle(false)}
                    onFocus={e => e.target.style.borderColor='rgba(124,111,255,0.5)'}
                    onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'} />
                </div>
              </>
            )}
            <div style={{ marginBottom: 16 }}>
              <Label>{T('auth_password')}</Label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" style={inputStyle(errors.password)}
                onFocus={e => { if (!errors.password) e.target.style.borderColor='rgba(124,111,255,0.5)'; }}
                onBlur={e => { if (!errors.password) e.target.style.borderColor='rgba(255,255,255,0.1)'; }} />
              <Err msg={errors.password} />
            </div>
            {tab === 'signup' && (
              <div style={{ marginBottom: 16 }}>
                <Label>{T('auth_confirm_password')}</Label>
                <input type="password" value={form.confirm} onChange={e => set('confirm', e.target.value)} placeholder="••••••••" style={inputStyle(errors.confirm)}
                  onFocus={e => { if (!errors.confirm) e.target.style.borderColor='rgba(124,111,255,0.5)'; }}
                  onBlur={e => { if (!errors.confirm) e.target.style.borderColor='rgba(255,255,255,0.1)'; }} />
                <Err msg={errors.confirm} />
              </div>
            )}
            {tab === 'login' && (
              <div style={{ textAlign: 'right', marginBottom: 16, marginTop: -6 }}>
                <button type="button" style={{ background: 'none', border: 'none', color: '#A78BFA', fontFamily: bodyFont, fontSize: 13, cursor: 'pointer' }}>{T('auth_forgot')}</button>
              </div>
            )}
            <button type="submit" disabled={loading} style={{ width: '100%', background: 'linear-gradient(135deg, #7C6FFF, #A78BFA)', border: 'none', borderRadius: 12, padding: '14px', color: '#fff', fontFamily: bodyFont, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 4px 20px rgba(124,111,255,0.4)', transition: 'all 0.2s' }}>
              {loading ? (lang === 'bn' ? 'অপেক্ষা করুন…' : 'Please wait…') : tab === 'login' ? T('auth_login_btn') : T('auth_signup_btn')}
            </button>
            {tab === 'signup' && (
              <p style={{ fontFamily: bodyFont, fontSize: 12, color: '#7A82A8', textAlign: 'center', marginTop: 14, lineHeight: 1.6, marginBottom: 0 }}>
                {T('auth_terms')} <span style={{ color: '#A78BFA', cursor: 'pointer' }}>{T('auth_terms2')}</span> {T('auth_terms3')} <span style={{ color: '#A78BFA', cursor: 'pointer' }}>{T('auth_privacy')}</span>{T('auth_terms4')}
              </p>
            )}
          </form>
        </div>
        <p style={{ textAlign: 'center', fontFamily: bodyFont, fontSize: 14, color: '#7A82A8', marginTop: 20 }}>
          {tab === 'login' ? T('auth_no_account') : T('auth_have_account')}{' '}
          <span onClick={() => { setTab(tab === 'login' ? 'signup' : 'login'); setErrors({}); }} style={{ color: '#A78BFA', cursor: 'pointer', fontWeight: 600 }}>
            {tab === 'login' ? T('auth_free_signup') : T('auth_login_tab')}
          </span>
        </p>
      </div>
    </div>
  );
}
