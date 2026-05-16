import React, { useState } from 'react';

export default function Pricing({ navigate }) {
  const [billing, setBilling] = useState('monthly');

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      monthlyPrice: 50,
      yearlyPrice: 500,
      color: '#4F9CF9',
      description: 'Perfect for casual learners',
      features: [
        'One monthly eBook issue',
        'Quiz entry (1 per month)',
        'PDF download',
        'Basic leaderboard access',
      ],
      notIncluded: ['Priority quiz registration', 'Bonus study materials', 'Certificate of participation'],
      cta: 'Get Basic',
    },
    {
      id: 'pro',
      name: 'Pro',
      monthlyPrice: 150,
      yearlyPrice: 1499,
      color: '#7C6FFF',
      description: 'For serious exam aspirants',
      popular: true,
      features: [
        'All monthly eBook issues',
        'Unlimited quiz entries',
        'PDF + offline download',
        'Full leaderboard + analytics',
        'Priority quiz registration',
        'Bonus study materials',
        'Certificate of participation',
      ],
      notIncluded: [],
      cta: 'Get Pro',
    },
    {
      id: 'annual',
      name: 'Annual',
      monthlyPrice: 120,
      yearlyPrice: 1199,
      color: '#D4A843',
      description: 'Best value for committed learners',
      features: [
        'Everything in Pro',
        '12 months all-access',
        'Save ৳601 vs monthly Pro',
        'Exclusive annual badge',
        'Early access to new issues',
        'Priority support',
      ],
      notIncluded: [],
      cta: 'Get Annual',
      billingNote: 'Billed yearly',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0C0E1A', paddingTop: 88 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#7C6FFF', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>PRICING</div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 44, color: '#F0F2FF', margin: '0 0 16px', letterSpacing: '-1.5px' }}>Simple, transparent pricing</h1>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 17, color: '#7A82A8', margin: '0 auto 32px', maxWidth: 480, lineHeight: 1.6 }}>
            Buy individual issues or subscribe for full access to every quiz and magazine.
          </p>
          <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 4 }}>
            {['monthly', 'yearly'].map(b => (
              <button key={b} onClick={() => setBilling(b)} style={{
                background: billing === b ? 'rgba(124,111,255,0.2)' : 'transparent',
                border: `1px solid ${billing === b ? 'rgba(124,111,255,0.4)' : 'transparent'}`,
                borderRadius: 9, padding: '8px 22px',
                color: billing === b ? '#A78BFA' : '#7A82A8',
                fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: billing === b ? 600 : 400,
                cursor: 'pointer', transition: 'all 0.2s', textTransform: 'capitalize',
              }}>
                {b === 'yearly' ? 'Yearly (save 17%)' : 'Monthly'}
              </button>
            ))}
          </div>
        </div>

        {/* Plans */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 56 }}>
          {plans.map(plan => {
            const price = billing === 'monthly' ? plan.monthlyPrice : Math.round(plan.yearlyPrice / 12);
            return (
              <div key={plan.id} style={{
                background: plan.popular ? 'linear-gradient(145deg, rgba(124,111,255,0.12), rgba(167,139,250,0.06))' : 'rgba(28,32,64,0.4)',
                border: `1px solid ${plan.popular ? 'rgba(124,111,255,0.4)' : `${plan.color}25`}`,
                borderRadius: 24, padding: '32px 28px', position: 'relative',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
              >
                {plan.popular && (
                  <div style={{
                    position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #7C6FFF, #A78BFA)',
                    borderRadius: 20, padding: '5px 18px',
                    fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 700, color: '#fff',
                    whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(124,111,255,0.4)',
                  }}>Most Popular</div>
                )}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 20, color: plan.color, marginBottom: 6 }}>{plan.name}</div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#7A82A8', marginBottom: 20 }}>{plan.description}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 42, color: '#F0F2FF', letterSpacing: '-1px' }}>৳{price}</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#7A82A8' }}>/month</span>
                  </div>
                  {billing === 'yearly' && (
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: plan.color, marginTop: 4 }}>৳{plan.yearlyPrice} billed annually</div>
                  )}
                </div>

                <button onClick={() => navigate('signup')} style={{
                  background: plan.popular ? 'linear-gradient(135deg, #7C6FFF, #A78BFA)' : `${plan.color}20`,
                  border: plan.popular ? 'none' : `1px solid ${plan.color}40`,
                  borderRadius: 11, padding: '13px', color: plan.popular ? '#fff' : plan.color,
                  fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  width: '100%', marginBottom: 28,
                  boxShadow: plan.popular ? '0 4px 20px rgba(124,111,255,0.4)' : 'none',
                  transition: 'all 0.2s',
                }}>{plan.cta}</button>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 24 }}>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#7A82A8', fontWeight: 600, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>What's included</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {plan.features.map(f => (
                      <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: `${plan.color}20`, border: `1px solid ${plan.color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                          <span style={{ color: plan.color, fontSize: 10, fontWeight: 700 }}>✓</span>
                        </div>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#C8CBE0', lineHeight: 1.4 }}>{f}</span>
                      </div>
                    ))}
                    {plan.notIncluded.map(f => (
                      <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', opacity: 0.4 }}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                          <span style={{ color: '#7A82A8', fontSize: 10 }}>—</span>
                        </div>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#7A82A8', lineHeight: 1.4 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ */}
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 26, color: '#F0F2FF', margin: '0 0 28px', textAlign: 'center', letterSpacing: '-0.5px' }}>Common questions</h2>
          {[
            ['Do I need to subscribe to join a quiz?', 'You need at least the Basic plan or a purchased issue to enter a monthly quiz.'],
            ['How are prizes paid?', 'Cash prizes are sent via bKash or Nagad within 3 working days after the quiz results are verified.'],
            ['Can I cancel my subscription?', 'Yes, you can cancel anytime from your dashboard. Access continues until the end of your billing period.'],
            ['Is the quiz live or self-paced?', 'Quizzes run on a fixed monthly schedule — everyone joins at the same time on the announced date and time.'],
          ].map(([q, a], i) => (
            <FaqItem key={i} q={q} a={a} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 0, marginBottom: 0,
    }}>
      <button onClick={() => setOpen(o => !o)} style={{
        background: 'transparent', border: 'none', width: '100%', textAlign: 'left',
        padding: '20px 0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
      }}>
        <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 16, color: '#F0F2FF' }}>{q}</span>
        <span style={{ color: '#A78BFA', fontSize: 20, transition: 'transform 0.2s', transform: open ? 'rotate(45deg)' : 'none', flexShrink: 0 }}>+</span>
      </button>
      {open && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#7A82A8', lineHeight: 1.7, margin: '0 0 20px', paddingRight: 32 }}>{a}</p>}
    </div>
  );
}

export { FaqItem };
export default Pricing;
