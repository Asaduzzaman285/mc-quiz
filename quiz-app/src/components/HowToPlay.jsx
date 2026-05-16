import React, { useState } from 'react';
import { MCQUIZ_DATA } from './data';

export default function HowToPlay({ navigate, lang, T }) {
  const { resultAnnounceDate } = MCQUIZ_DATA;
  const bodyFont = lang === 'bn' ? "'Anek Bangla', sans-serif" : 'Inter, sans-serif';
  const [activeStep, setActiveStep] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);

  const steps = [
    { num: lang === 'bn' ? '০১' : '01', title: T('htp_s1_title'), desc: T('htp_s1_desc'), color: '#7C6FFF',
      points: lang === 'bn' ? ['ম্যাগাজিন স্টোর থেকে কিনুন', 'পেমেন্ট: bKash, Nagad, Rocket বা কার্ড', 'কেনার পরই কুইজ এন্ট্রি পাবেন', 'আলাদা কোনো নিবন্ধন ফি নেই'] : ['Purchase from the Magazine Store', 'Pay via bKash, Nagad, Rocket or Card', 'Quiz entry activated immediately after purchase', 'No separate registration fee'],
      action: { label: T('nav_magazine'), page: 'store' } },
    { num: lang === 'bn' ? '০২' : '02', title: T('htp_s2_title'), desc: T('htp_s2_desc'), color: '#4F9CF9',
      points: lang === 'bn' ? ['প্রতি সংখ্যায় ২০০টি MCQ মডেল প্রশ্ন', 'বিস্তারিত উত্তর ও ব্যাখ্যা', 'বাংলাদেশ, আন্তর্জাতিক ও BCS বিষয়াবলি', 'PDF ডাউনলোড করে অফলাইনে পড়ুন'] : ['200 MCQ model questions per issue', 'Detailed answers and explanations', 'Topics: Bangladesh, International, BCS', 'Download PDF and read offline'],
      action: { label: T('nav_magazine'), page: 'store' } },
    { num: lang === 'bn' ? '০৩' : '03', title: T('htp_s3_title'), desc: T('htp_s3_desc'), color: '#22C55E',
      points: lang === 'bn' ? ['কুইজ শুরুর আগে OTP যাচাই', 'নিবন্ধিত মোবাইলে OTP পাঠানো হবে', '৬ সংখ্যার OTP দিয়ে নিশ্চিত করুন', 'এটি নিশ্চিত করে প্রকৃত ক্রেতাই খেলছেন'] : ['OTP sent to your registered mobile', 'Enter the 6-digit code to proceed', 'Ensures only the real purchaser plays', 'One-time verification per quiz session'],
      action: { label: T('ql_enter_now'), page: 'quiz-lobby' } },
    { num: lang === 'bn' ? '০৪' : '04', title: T('htp_s4_title'), desc: T('htp_s4_desc'), color: '#D4A843',
      points: lang === 'bn' ? ['৩ মিনিটের টাইমার শুরু হবে', 'যত বেশি সঠিক উত্তর, তত বেশি স্কোর', 'MCQ — ৪টি অপশন থেকে একটি বেছে নিন', 'মাসের শেষ দিন পর্যন্ত কুইজ দেওয়া যাবে'] : ['3-minute countdown starts immediately', 'More correct answers = higher score', 'MCQ format — pick one from 4 options', 'Quiz open until last day of the month'],
      action: { label: lang === 'bn' ? 'Demo খেলুন' : 'Play Demo', page: 'live-quiz' } },
    { num: lang === 'bn' ? '০৫' : '05', title: T('htp_s5_title'), desc: T('htp_s5_desc'), color: '#EC4899',
      points: lang === 'bn' ? ['১ম পুরস্কার: ৳১৫,০০০', '২য় পুরস্কার: ৳৫,০০০', '৩য়–২২তম: ৳১,০০০ করে (মোট ২০ জন)', `ফলাফল: ${resultAnnounceDate}`] : ['1st Prize: ৳15,000', '2nd Prize: ৳5,000', '3rd–22nd: ৳1,000 each (20 winners)', `Results: ${resultAnnounceDate}`],
      action: { label: T('lb_title'), page: 'leaderboard' } },
  ];

  const faqs = lang === 'bn' ? [
    ['কুইজে কী ধরনের প্রশ্ন আসে?', 'সব প্রশ্ন MCQ ফরম্যাটে — ৪টি অপশন থেকে একটি বেছে নিতে হবে। বিষয়: বাংলাদেশ বিষয়াবলি, আন্তর্জাতিক ঘটনা, বিজ্ঞান, ইতিহাস, ভূগোল, কারেন্ট অ্যাফেয়ার্স।'],
    ['সাবস্ক্রিপশন ছাড়া কি কুইজে অংশ নেওয়া যাবে?', 'হ্যাঁ। শুধু সেই মাসের সংখ্যা কিনলেই কুইজ এন্ট্রি পাবেন। আলাদা কোনো সাবস্ক্রিপশন নেই।'],
    ['কুইজ মিস হলে কী হবে?', 'প্রতিটি কুইজ মাসিক লাইভ ইভেন্ট। মাসের শেষ দিন পর্যন্ত যেকোনো সময় অংশ নেওয়া যাবে। কিন্তু সময় শেষ হলে আর সুযোগ নেই।'],
    ['স্কোর কিভাবে গণনা করা হয়?', '৩ মিনিটে যতটি প্রশ্নের সঠিক উত্তর দেবেন, সেটিই আপনার স্কোর। কোনো নেগেটিভ মার্কিং নেই।'],
    ['পুরস্কার কিভাবে পাবেন?', 'ফলাফল যাচাইয়ের পর বিজয়ীদের নিবন্ধিত bKash/Nagad নম্বরে ৩ কার্যদিবসের মধ্যে পুরস্কার পাঠানো হবে।'],
    ['মোবাইলে খেলা যাবে?', 'অবশ্যই। MCQuiz সম্পূর্ণ মোবাইল-বান্ধব। লাইভ কুইজে ভালো ইন্টারনেট সংযোগ নিশ্চিত করুন।'],
  ] : [
    ['What types of questions are asked?', 'All MCQ format — pick one from 4 options. Topics: Bangladesh affairs, international events, science, history, geography, current affairs.'],
    ['Can I participate without a subscription?', 'Yes. Simply buy that month\'s issue for ৳50 — your quiz entry is included. No separate subscription needed.'],
    ['What if I miss the quiz?', 'The quiz is open all month until the last day. You can attempt it anytime before the deadline.'],
    ['How is the score calculated?', 'Your score equals the number of correct answers in 3 minutes. No negative marking.'],
    ['How do I receive my prize?', 'After results are verified, prizes are sent to your registered bKash/Nagad number within 3 working days.'],
    ['Can I play on mobile?', 'Absolutely. MCQuiz is fully mobile-responsive. Ensure a stable internet connection during the live quiz.'],
  ];

  return (
    <div style={{ minHeight: '100vh', paddingTop: 88, color: '#F0F2FF' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ fontFamily: bodyFont, fontSize: 13, color: '#7C6FFF', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>{T('htp_label')}</div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 42, color: '#F0F2FF', margin: '0 0 16px', letterSpacing: '-1.4px' }}>{T('htp_title')}</h1>
          <p style={{ fontFamily: bodyFont, fontSize: 17, color: '#7A82A8', margin: '0 auto', maxWidth: 500, lineHeight: 1.75 }}>{T('htp_subtitle')}</p>
        </div>

        {/* Step tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
          {steps.map((s, i) => (
            <button key={i} onClick={() => setActiveStep(i)} style={{ background: activeStep === i ? `${s.color}20` : 'rgba(255,255,255,0.04)', border: `1px solid ${activeStep === i ? s.color+'50' : 'rgba(255,255,255,0.08)'}`, borderRadius: 10, padding: '8px 16px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 13, color: activeStep === i ? s.color : '#7A82A8' }}>{s.num}</span>
              <span style={{ fontFamily: bodyFont, fontSize: 13, color: activeStep === i ? '#F0F2FF' : '#7A82A8', fontWeight: activeStep === i ? 600 : 400 }}>{s.title.split(' ').slice(0, 2).join(' ')}</span>
            </button>
          ))}
        </div>

        {/* Active step */}
        {(() => {
          const s = steps[activeStep];
          return (
            <div style={{ background: `linear-gradient(135deg, ${s.color}0d, rgba(28,32,64,0.5))`, border: `1px solid ${s.color}25`, borderRadius: 24, padding: '40px 40px', marginBottom: 48, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 44, backdropFilter: 'blur(12px)' }}>
              <div>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 64, color: `${s.color}25`, lineHeight: 1, marginBottom: 14 }}>{s.num}</div>
                <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 26, color: '#F0F2FF', margin: '0 0 14px', letterSpacing: '-0.6px' }}>{s.title}</h2>
                <p style={{ fontFamily: bodyFont, fontSize: 15, color: '#8B90B0', lineHeight: 1.75, margin: '0 0 24px' }}>{s.desc}</p>
                <button onClick={() => navigate(s.action.page)} style={{ background: `${s.color}20`, border: `1px solid ${s.color}50`, borderRadius: 11, padding: '10px 22px', color: s.color, fontFamily: bodyFont, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = `${s.color}30`}
                onMouseLeave={e => e.currentTarget.style.background = `${s.color}20`}
                >{s.action.label} →</button>
              </div>
              <div>
                <div style={{ fontFamily: bodyFont, fontSize: 12, color: '#7A82A8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>{lang === 'bn' ? 'মূল বিষয়সমূহ' : 'Key Points'}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {s.points.map((pt, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12 }}>
                      <div style={{ width: 22, height: 22, borderRadius: 7, background: `${s.color}18`, border: `1px solid ${s.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                        <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 10, color: s.color }}>✓</span>
                      </div>
                      <span style={{ fontFamily: bodyFont, fontSize: 14, color: '#C8CBE0', lineHeight: 1.55 }}>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* All steps compact */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 60 }}>
          {steps.map((s, i) => (
            <div key={i} onClick={() => setActiveStep(i)} style={{ background: activeStep === i ? `${s.color}15` : 'rgba(255,255,255,0.03)', border: `1px solid ${activeStep === i ? s.color+'40' : 'rgba(255,255,255,0.07)'}`, borderRadius: 14, padding: '16px 14px', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center', backdropFilter: 'blur(8px)' }}
            onMouseEnter={e => { e.currentTarget.style.background = `${s.color}12`; }}
            onMouseLeave={e => { if (activeStep !== i) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}>
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 20, color: s.color, marginBottom: 6 }}>{s.num}</div>
              <div style={{ fontFamily: bodyFont, fontSize: 12, color: activeStep === i ? '#F0F2FF' : '#7A82A8', lineHeight: 1.4, fontWeight: activeStep === i ? 600 : 400 }}>{s.title}</div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div style={{ marginBottom: 60 }}>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 28, color: '#F0F2FF', margin: '0 0 32px', letterSpacing: '-0.8px', textAlign: 'center' }}>{T('htp_faq_title')}</h2>
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            {faqs.map(([q, a], i) => (
              <div key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left', padding: '18px 0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 15, color: '#F0F2FF' }}>{q}</span>
                  <span style={{ color: '#A78BFA', fontSize: 20, transition: 'transform 0.2s', transform: openFaq === i ? 'rotate(45deg)' : 'none', flexShrink: 0 }}>+</span>
                </button>
                {openFaq === i && <p style={{ fontFamily: bodyFont, fontSize: 14, color: '#7A82A8', lineHeight: 1.7, margin: '0 0 18px', paddingRight: 32 }}>{a}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div style={{ textAlign: 'center', padding: '48px 24px', background: 'rgba(124,111,255,0.06)', border: '1px solid rgba(124,111,255,0.15)', borderRadius: 24, backdropFilter: 'blur(12px)' }}>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 28, color: '#F0F2FF', margin: '0 0 10px', letterSpacing: '-0.8px' }}>{T('htp_cta_h2')}</h2>
          <p style={{ fontFamily: bodyFont, fontSize: 15, color: '#7A82A8', margin: '0 0 28px', lineHeight: 1.65 }}>{T('htp_cta_desc')}</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('signup')} style={{ background: 'linear-gradient(135deg, #7C6FFF, #A78BFA)', border: 'none', borderRadius: 12, padding: '13px 28px', color: '#fff', fontFamily: bodyFont, fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(124,111,255,0.4)' }}>{T('htp_cta_btn1')}</button>
            <button onClick={() => navigate('store')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '13px 24px', color: '#F0F2FF', fontFamily: bodyFont, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>{T('htp_cta_btn2')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
