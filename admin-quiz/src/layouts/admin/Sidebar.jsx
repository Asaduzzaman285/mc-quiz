import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Shield, Users, Eye, BookOpen, ListTodo, Trophy, CreditCard, LayoutDashboard } from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName');

  const rolesString = localStorage.getItem('userRoles');
  const roles = rolesString ? JSON.parse(rolesString) : [];
  const hasAdminRole = roles.includes('admin');

  const permissionsString = localStorage.getItem('permissions');
  const permissions = permissionsString ? JSON.parse(permissionsString) : [];

  const hasUserList = permissions.includes('manage-users') || hasAdminRole;
  const hasRoleList = hasAdminRole;

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const linkStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 16px',
    borderRadius: '10px',
    margin: '2px 8px',
    textDecoration: 'none',
    fontWeight: isActive ? 700 : 500,
    fontSize: '14px',
    color: isActive ? '#7C6FFF' : '#475569',
    background: isActive ? 'rgba(124,111,255,0.1)' : 'transparent',
    transition: 'all 0.2s',
  });

  return (
    <nav className="sb-sidenav accordion sb-sidenav-light" id="sidenavAccordion">
      <div className="sb-sidenav-menu">
        <div className="nav" style={{ paddingTop: 8 }}>

          {/* Dashboard */}
          <NavLink to="/admin/home" style={linkStyle}>
            <LayoutDashboard size={18} /> Dashboard
          </NavLink>

          {/* Quiz System */}
          <div style={{ padding: '8px 16px 4px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 8 }}>
            Quiz System
          </div>

          <NavLink to="/admin/magazines" style={linkStyle}>
            <BookOpen size={18} /> Magazines
          </NavLink>

          <NavLink to="/admin/quizzes" style={linkStyle}>
            <ListTodo size={18} /> Quizzes
          </NavLink>

          <NavLink to="/admin/leaderboard" style={linkStyle}>
            <Trophy size={18} /> Leaderboard
          </NavLink>

          <NavLink to="/admin/purchases" style={linkStyle}>
            <CreditCard size={18} /> Purchases
          </NavLink>

          {/* Access Control */}
          {(hasUserList || hasRoleList) && (
            <>
              <div style={{ padding: '8px 16px 4px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 8 }}>
                Access Control
              </div>

              {hasUserList && (
                <NavLink to="/admin/user" style={linkStyle}>
                  <Users size={18} /> Students
                </NavLink>
              )}

              {hasRoleList && (
                <NavLink to="/admin/role" style={linkStyle}>
                  <Shield size={18} /> Roles
                </NavLink>
              )}
            </>
          )}

          {/* Profile */}
          <div style={{ padding: '8px 16px 4px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 8 }}>
            Account
          </div>

          <NavLink to="/admin/profile" style={linkStyle}>
            <Eye size={18} /> Profile
          </NavLink>

          {/* Logout */}
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', borderRadius: '10px', margin: '2px 8px', border: 'none', background: 'transparent', fontWeight: 500, fontSize: '14px', color: '#EF4444', cursor: 'pointer', width: 'calc(100% - 16px)', textAlign: 'left', transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            Logout
          </button>

        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
