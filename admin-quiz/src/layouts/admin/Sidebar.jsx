import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Shield,
  Users,
  Eye,
  BookOpen,
  ListTodo
} from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName');

  // Get permissions from localStorage (stored during login)
  const permissionsString = localStorage.getItem('permissions');
  const permissions = permissionsString ? JSON.parse(permissionsString) : [];

  // Get roles
  const rolesString = localStorage.getItem('userRoles');
  const roles = rolesString ? JSON.parse(rolesString) : [];
  const hasAdminRole = roles.includes('admin');

  // Check for specific permissions
  const hasUserList = permissions.includes('user list') || hasAdminRole;
  const hasRoleList = permissions.includes('role list') || hasAdminRole;
  const hasPermissionList = permissions.includes('permission list') || hasAdminRole;

  // Show Access Control menu only if user has at least one of the required permissions
  const showAccessControl = hasUserList || hasRoleList || hasPermissionList;

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userName');
    localStorage.removeItem('permissions'); // Also remove permissions on logout
    localStorage.removeItem('userRoles');
    navigate('/login');
  };

  return (
    <nav className="sb-sidenav accordion sb-sidenav-light" id="sidenavAccordion">
      <div className="sb-sidenav-menu">
        <div className="nav text-dark">
          <NavLink className="nav-link" to="/admin/profile" activeClassName="active">
            <div className="sb-nav-link-icon">
              <Users size={20} />
            </div>
            Profile
          </NavLink>

          {/* Access Control Menu - Conditionally Rendered */}
          {showAccessControl && (
            <>
              <div
                className="nav-link d-flex justify-content-between align-items-center"
                data-bs-toggle="collapse"
                data-bs-target="#accessControlMenu"
                aria-expanded="false"
                aria-controls="accessControlMenu"
                style={{ cursor: 'pointer' }}
              >
                <div className="d-flex align-items-center">
                  <div className="sb-nav-link-icon">
                    <Shield size={20} />
                  </div>
                  Access Control
                </div>
                <i className="fas fa-chevron-down"></i>
              </div>
              <div className="collapse" id="accessControlMenu">
                {/* User Menu Item - Only show if user has "user list" permission */}
                {hasUserList && (
                  <NavLink className="nav-link ms-4" to="/admin/user" style={{ fontSize: '13px' }}>
                    <Users size={16} className="me-2" />
                    Students
                  </NavLink>
                )}

                {/* Role Menu Item - Only show if user has "role list" permission */}
                {hasRoleList && (
                  <NavLink className="nav-link ms-4" to="/admin/role" style={{ fontSize: '13px' }}>
                    <Eye size={16} className="me-2" />
                    Role
                  </NavLink>
                )}
              </div>
            </>
          )}

          <div className="sb-sidenav-menu-heading">Quiz System</div>
          <NavLink className="nav-link" to="/admin/magazines">
            <div className="sb-nav-link-icon"><BookOpen size={18} /></div>
            Magazines
          </NavLink>
          <NavLink className="nav-link" to="/admin/quizzes">
            <div className="sb-nav-link-icon"><ListTodo size={18} /></div>
            Quizzes
          </NavLink>

        </div>
      </div>
    </nav>
  );
};

export default Sidebar;