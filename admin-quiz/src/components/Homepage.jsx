import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, BookOpen, FileText, Trophy, CreditCard, TrendingUp } from 'lucide-react';
import axios from 'axios';

const cardDefinitions = [
  { title: 'Magazines', description: 'Manage monthly eBooks, upload PDFs and cover images.', to: '/admin/magazines', category: 'Quiz System', icon: BookOpen, color: '#7C6FFF', bgColor: '#F5F3FF' },
  { title: 'Quizzes', description: 'Schedule monthly quizzes and upload question CSVs.', to: '/admin/quizzes', category: 'Quiz System', icon: FileText, color: '#D4A843', bgColor: '#FFFBEB' },
  { title: 'Leaderboard', description: 'View live rankings and top performers per quiz.', to: '/admin/leaderboard', category: 'Quiz System', icon: Trophy, color: '#F59E0B', bgColor: '#FFFBEB' },
  { title: 'Purchases', description: 'Track all magazine purchases and payment transactions.', to: '/admin/purchases', category: 'Quiz System', icon: CreditCard, color: '#10B981', bgColor: '#ECFDF5' },
  { title: 'Students', description: 'View and manage registered students and their details.', to: '/admin/user', category: 'Access Control', icon: Users, color: '#3B82F6', bgColor: '#EFF6FF' },
];

const Homepage = () => {
  const [stats, setStats] = useState(null);
  const API_URL = import.meta.env.VITE_APP_API_BASE_URL + '/api/v1';
  const token = localStorage.getItem('authToken');

  useEffect(() => {
    axios.get(`${API_URL}/supportdata`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setStats(r.data.data?.stats))
      .catch(() => { });
  }, []);

  const statCards = stats ? [
    { label: 'Total Students', value: stats.total_users, color: '#3B82F6' },
    { label: 'Total Purchases', value: stats.total_purchases, color: '#10B981' },
    { label: 'Revenue (৳)', value: `৳${stats.total_revenue}`, color: '#D4A843' },
    { label: 'Quiz Submissions', value: stats.total_quiz_submissions, color: '#7C6FFF' },
  ] : [];

  return (
    <div style={{ padding: '24px', backgroundColor: '#F8FAFC', overflowX: 'hidden', minHeight: '100vh' }}>
      <div className="mt-5" style={{ maxWidth: '1400px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Portal Home</p>
          <h1 style={{ margin: '8px 0 0', fontSize: '36px', fontWeight: 800, color: '#1e293b' }}>Welcome back</h1>
          <p style={{ margin: '12px 0 0', fontSize: '16px', color: '#64748b', maxWidth: '800px' }}>
            Manage the MCQuiz platform — magazines, quizzes, leaderboards, and student data.
          </p>
        </div>

        {/* Stats row */}
        {statCards.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            {statCards.map(s => (
              <div key={s.label} style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px 22px', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Nav cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px' }}>
          {cardDefinitions.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.to} to={card.to} style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{ padding: '24px', borderRadius: '18px', backgroundColor: card.bgColor, border: `1px solid ${card.color}33`, boxShadow: '0 2px 6px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '20px', transition: 'all 0.25s', minHeight: '120px' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.08)'; e.currentTarget.style.backgroundColor = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.04)'; e.currentTarget.style.backgroundColor = card.bgColor; }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', color: card.color, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', flexShrink: 0 }}>
                    <Icon size={28} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, color: card.color, fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.category}</p>
                    <h2 style={{ margin: '3px 0 4px', fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>{card.title}</h2>
                    <p style={{ margin: 0, color: '#475569', fontSize: '13px', lineHeight: '1.5' }}>{card.description}</p>
                  </div>
                  <span style={{ color: card.color, fontSize: '20px', fontWeight: 700, flexShrink: 0 }}>→</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Homepage;
