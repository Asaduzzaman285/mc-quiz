import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Users, Briefcase, Package, Tag, FileText } from 'lucide-react';

const cardDefinitions = [
  {
    title: 'Students',
    description: 'View and manage registered students, their subscriptions and details.',
    to: '/admin/user',
    category: 'Access Control',
    icon: Users,
    color: '#10B981',
    bgColor: '#ECFDF5'
  },
  {
    title: 'Magazines',
    description: 'Manage monthly eBooks, upload PDFs and cover images.',
    to: '/admin/magazines',
    category: 'Quiz System',
    icon: Globe,
    color: '#7C6FFF',
    bgColor: '#F5F3FF'
  },
  {
    title: 'Quizzes',
    description: 'Manage monthly quizzes and upload question CSVs.',
    to: '/admin/quizzes',
    category: 'Quiz System',
    icon: FileText,
    color: '#D4A843',
    bgColor: '#FFFBEB'
  }
];

const Homepage = () => {
  const availableCards = cardDefinitions;

  return (
    <div style={{ padding: '24px', backgroundColor: '#F8FAFC', overflowX: 'hidden', minHeight: '100vh' }}>
      <div className="mt-5" style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Portal Home
          </p>
          <h1 style={{ margin: '8px 0 0', fontSize: '36px', fontWeight: 800, color: '#1e293b' }}>
            Welcome back
          </h1>
          <p style={{ margin: '12px 0 0', fontSize: '16px', color: '#64748b', maxWidth: '800px' }}>
            Manage the quiz system content with the cards below. Each section allows you to manage students, monthly magazines, and quizzes.
          </p>
        </div>

        {availableCards.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
            {availableCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.to}
                  to={card.to}
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  <div
                    style={{
                      padding: '28px',
                      borderRadius: '20px',
                      backgroundColor: card.bgColor,
                      border: `1px solid ${card.color}33`, // Subtle border with theme color
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '24px',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      minHeight: '140px'
                    }}
                    className="homepage-card-v3"
                  >
                    <div
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#ffffff', // White icon container for contrast
                        color: card.color,
                        boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                        flexShrink: 0
                      }}
                    >
                      <Icon size={32} />
                    </div>

                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, color: card.color, fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {card.category}
                      </p>
                      <h2 style={{ margin: '4px 0 4px', fontSize: '22px', fontWeight: 700, color: '#1e293b' }}>
                        {card.title}
                      </h2>
                      <p style={{ margin: 0, color: '#475569', fontSize: '14px', lineHeight: '1.5' }}>
                        {card.description}
                      </p>
                      <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: card.color, fontSize: '14px', fontWeight: 700 }}>
                        Go to {card.title}
                        <span className="arrow" style={{ transition: 'transform 0.2s' }}>→</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: '40px', borderRadius: '20px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>No sections found</h2>
          </div>
        )}
      </div>
      <style>{`
        .homepage-card-v3:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 25px -5px rgba(0, 0, 0, 0.1);
          background-color: #ffffff !important;
          border-color: currentColor;
        }
        .homepage-card-v3:hover .arrow {
          transform: translateX(5px);
        }
      `}</style>
    </div>
  );
};

export default Homepage;
