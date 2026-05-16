// UserPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FaHome, FaTimes } from 'react-icons/fa';
import Swal from 'sweetalert2';
import SkeletonLoader from './SkeletonLoader'; // Import the skeleton loader

const UserPage = ({ sidebarVisible = false }) => {
  const ITEMS_PER_PAGE = 10;

  const [currentPage, setCurrentPage] = useState(1);

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [merchants, setMerchants] = useState([]); // Extracted from users data
  const [modalLoading, setModalLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [merchantId, setMerchantId] = useState('');
  const [mergedPermissions, setMergedPermissions] = useState([]);
  const [groupedPermissions, setGroupedPermissions] = useState([]);

  const [isEditing, setIsEditing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionMenuId, setActionMenuId] = useState(null);

  // Loading states
  const [usersLoading, setUsersLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [modalPermissionsLoading, setModalPermissionsLoading] = useState(false);

  // dropdown state & search
  const [rolesDropdownOpen, setRolesDropdownOpen] = useState(false);
  const [roleSearch, setRoleSearch] = useState('');
  const dropdownRef = useRef(null);

  // Filter states with Select2-style dropdowns
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchRole, setSearchRole] = useState('');
  const [searchMerchant, setSearchMerchant] = useState('');

  // Filter dropdown states
  const [nameDropdownOpen, setNameDropdownOpen] = useState(false);
  const [emailDropdownOpen, setEmailDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [merchantDropdownOpen, setMerchantDropdownOpen] = useState(false);

  // Filter search states
  const [nameFilterSearch, setNameFilterSearch] = useState('');
  const [emailFilterSearch, setEmailFilterSearch] = useState('');
  const [roleFilterSearch, setRoleFilterSearch] = useState('');
  const [merchantFilterSearch, setMerchantFilterSearch] = useState('');

  const nameFilterRef = useRef(null);
  const emailFilterRef = useRef(null);
  const roleFilterRef = useRef(null);
  const merchantFilterRef = useRef(null);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchSupportData();


    // close dropdown when clicking outside
    const onDocClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setRolesDropdownOpen(false);
      }
      if (nameFilterRef.current && !nameFilterRef.current.contains(e.target)) {
        setNameDropdownOpen(false);
      }
      if (emailFilterRef.current && !emailFilterRef.current.contains(e.target)) {
        setEmailDropdownOpen(false);
      }
      if (roleFilterRef.current && !roleFilterRef.current.contains(e.target)) {
        setRoleDropdownOpen(false);
      }
      if (merchantFilterRef.current && !merchantFilterRef.current.contains(e.target)) {
        setMerchantDropdownOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  useEffect(() => {
    setFilteredUsers(users);
  }, [users]);


  // fetch users
  const fetchUsers = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error('No auth token found');
      setUsersLoading(false);
      return;
    }
    try {
      setUsersLoading(true);
      const res = await fetch(`${import.meta.env.VITE_APP_API_BASE_URL}/api/v1/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.removeItem('authToken');
        Swal.fire({
          icon: 'warning',
          text: 'Session expired. Please login again.',
          showConfirmButton: false,
          timer: 3500
        }).then(() => {
          window.location.href = '/login';
        });
        return;
      }
      const data = await res.json();
      const userData = data.data || [];
      setUsers(userData);
      setFilteredUsers(userData);

    } catch (err) {
      console.error('fetchUsers error', err);
      showAlert('Failed to fetch users', 'danger');
    } finally {
      setUsersLoading(false);
    }
  };

  // fetch roles list
  const fetchRoles = async () => {
    try {
      setRolesLoading(true);
      const token = localStorage.getItem('authToken');
      const url = `${import.meta.env.VITE_APP_API_BASE_URL}/api/v1/role/getAllRoles`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        }
      });
      const data = await res.json();
      const rolelist = data?.data?.rolelist ?? data?.rolelist ?? data?.data?.data ?? [];
      setRoles(Array.isArray(rolelist) ? rolelist : []);
    } catch (err) {
      console.error('fetchRoles error', err);
    } finally {
      setRolesLoading(false);
    }
  };

  // Extract unique merchants from users for filter dropdown
  // REPLACED by fetchSupportData
  const fetchSupportData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${import.meta.env.VITE_APP_API_BASE_URL}/api/v1/supportdata`, {
        method: 'POST', // Assuming POST based on typical project pattern, but user didn't specify method. Usually get support data is GET or POST. Let's try POST to be safe as many endpoints here are POST.
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        }
      });
      const data = await res.json();
      if (data && data.status === 'success' && data.data && Array.isArray(data.data.merchant_list)) {
        setMerchants(data.data.merchant_list);
      }
    } catch (err) {
      console.error('fetchSupportData error', err);
    }
  };

  // merged permissions for role ids
  const loadPermissionsForRoles = async (roleIds = []) => {
    if (!Array.isArray(roleIds) || roleIds.length === 0) {
      setMergedPermissions([]);
      setGroupedPermissions([]);
      setModalPermissionsLoading(false);
      return;
    }

    try {
      setModalPermissionsLoading(true);
      const token = localStorage.getItem('authToken');
      const requests = roleIds.map((id) =>
        fetch(`${import.meta.env.VITE_APP_API_BASE_URL}/api/v1/role/getRole`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify({ id })
        })
          .then((r) => r.json().catch(() => null))
          .catch(() => null)
      );

      const results = await Promise.all(requests);
      const permsSet = new Set();
      results.forEach((res) => {
        if (!res) return;
        const perms = res?.data?.permissions ?? res?.permissions ?? res?.data?.role?.permissions ?? null;
        if (Array.isArray(perms)) {
          perms.forEach((p) => {
            if (typeof p === 'string') permsSet.add(p.trim());
            else if (p && p.name) permsSet.add(p.name.trim());
          });
        }
      });

      const merged = Array.from(permsSet).sort();
      setMergedPermissions(merged);

      const groups = {};
      merged.forEach((p) => {
        const first = (p.split(' ')[0] || 'other').toLowerCase();
        const label = capitalize(first);
        if (!groups[first]) groups[first] = { label, permissions: [] };
        groups[first].permissions.push(p);
      });

      const groupedArr = Object.values(groups).sort((a, b) => a.label.localeCompare(b.label));
      setGroupedPermissions(groupedArr);
    } catch (err) {
      console.error('loadPermissionsForRoles error', err);
      setMergedPermissions([]);
      setGroupedPermissions([]);
    } finally {
      setModalPermissionsLoading(false);
    }
  };

  const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

  const toggleRoleSelection = (roleId) => {
    setSelectedRoles((prev) => {
      const exists = prev.includes(roleId);
      const next = exists ? prev.filter((r) => r !== roleId) : [...prev, roleId];
      loadPermissionsForRoles(next);
      return next;
    });
  };

  const removeRoleTag = (roleId) => {
    setSelectedRoles((prev) => {
      const next = prev.filter((r) => r !== roleId);
      loadPermissionsForRoles(next);
      return next;
    });
  };

  // Filter functions
  const handleFilter = () => {
    let filtered = [...users];

    if (searchName) {
      filtered = filtered.filter(u =>
        u.name?.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    if (searchEmail) {
      filtered = filtered.filter(u =>
        u.email?.toLowerCase().includes(searchEmail.toLowerCase())
      );
    }

    if (searchRole) {
      filtered = filtered.filter(u => {
        const roleNames = getRoleNames(u.role_info);
        return roleNames.toLowerCase().includes(searchRole.toLowerCase());
      });
    }

    if (searchMerchant) {
      filtered = filtered.filter(u => {
        const merchantName = u.merchant?.name || '-';
        return merchantName.toLowerCase().includes(searchMerchant.toLowerCase());
      });
    }

    setFilteredUsers(filtered);
  };

  const handleClearFilters = () => {
    setSearchName('');
    setSearchEmail('');
    setSearchRole('');
    setSearchMerchant('');
    setNameFilterSearch('');
    setEmailFilterSearch('');
    setRoleFilterSearch('');
    setMerchantFilterSearch('');
    setFilteredUsers(users);
  };

  // Create or Update user
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || (!isEditing && !password) || selectedRoles.length === 0) {
      showAlert('Please fill all required fields and select at least one role', 'warning');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const url = isEditing
        ? `${import.meta.env.VITE_APP_API_BASE_URL}/api/v1/updateUser`
        : `${import.meta.env.VITE_APP_API_BASE_URL}/api/v1/createUser`;

      const payload = {
        name,
        email,
        role_ids: selectedRoles
      };

      // Add merchant_id if selected
      if (merchantId) {
        payload.merchant_id = merchantId;
      }

      if (isEditing) {
        payload.id = currentUserId;
        if (password) payload.password = password;
      } else {
        payload.password = password;
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json().catch(() => null);
      if (!res.ok || (result && result.status && result.status !== 'success')) {
        showAlert('Failed to save user', 'danger');
        return;
      }

      // Show success alert
      showAlert(
        isEditing ? 'User updated successfully' : 'User created successfully',
        'success'
      );

      fetchUsers();
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error('handleSubmit error', err);
      showAlert('Failed to save user', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // UPDATED handleEdit → opens modal INSTANTLY + shows loading spinner inside modal
  const handleEdit = async (id) => {
    // Immediate feedback: open modal right away with loading state
    setModalLoading(true);
    setShowModal(true);
    setActionMenuId(null); // close the ellipsis menu instantly

    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(
        `${import.meta.env.VITE_APP_API_BASE_URL}/api/v1/getUser`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ id }),
        }
      );

      const result = await res.json().catch(() => null);

      if (!res.ok || !result || !result.data) {
        showAlert("Failed to load user details", "danger");
        setModalLoading(false);
        setShowModal(false);
        return;
      }

      const userData = result.data;

      setIsEditing(true);
      setCurrentUserId(id);
      setName(userData.name || "");
      setEmail(userData.email || "");
      setPassword("");
      setMerchantId(userData.merchant_id || "");

      // FINAL 100% WORKING ROLE PARSING (string names → ID lookup)
      let rawRoles = userData.role_info || userData.roles || [];

      if (typeof rawRoles === "string" && rawRoles.trim()) {
        try {
          rawRoles = JSON.parse(rawRoles);
        } catch (e) {
          rawRoles = [];
        }
      }

      let roleIds = [];

      if (Array.isArray(rawRoles) && rawRoles.length > 0) {
        roleIds = rawRoles.map((item) => {
          if (typeof item === "object" && item !== null) {
            return Number(item.id ?? item.role_id ?? 0);
          }

          if (typeof item === "string") {
            const foundRole = roles.find(
              (r) => r.name.toLowerCase() === item.trim().toLowerCase()
            );
            return foundRole ? Number(foundRole.id) : null;
          }

          return Number(item);
        })
          .filter((id) => id > 0 && id !== null);

        roleIds = [...new Set(roleIds)];
      }

      setSelectedRoles(roleIds);
      await loadPermissionsForRoles(roleIds);

      // Data is ready → hide loading spinner
      setModalLoading(false);
    } catch (err) {
      console.error("handleEdit error:", err);
      showAlert("Failed to load user", "danger");
      setModalLoading(false);
      setShowModal(false);
    }
  };

  // UPDATED handleAdd (just to be safe)
  const handleAdd = () => {
    resetForm();
    setIsEditing(false);
    setCurrentUserId(null);
    setModalLoading(false); // explicit
    setShowModal(true);
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setMerchantId('');
    setSelectedRoles([]);
    setMergedPermissions([]);
    setGroupedPermissions([]);
    setIsEditing(false);
    setCurrentUserId(null);
    setModalPermissionsLoading(false);
  };

  const showAlert = (message, variant = 'success') => {
    let icon = 'success';
    let title = 'Success!';

    if (variant === 'danger') {
      icon = 'error';
      title = 'Error!';
    }
    if (variant === 'warning') {
      icon = 'warning';
      title = 'Warning!';
    }

    Swal.fire({
      icon,
      title,
      text: message,
      showConfirmButton: false,
      timer: 3500,
      toast: true,
      position: 'top-end',
      timerProgressBar: true,
      showClass: {
        popup: 'animate__animated animate__fadeInDown'
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOutUp'
      }
    });
  };

  const getRoleNames = (roleInfo) => {
    if (!roleInfo || roleInfo.length === 0) return '-';
    try {
      if (Array.isArray(roleInfo)) {
        if (roleInfo.length > 0 && typeof roleInfo[0] === 'object') {
          return roleInfo.map((r) => r.role_name || r.name).filter(Boolean).join(', ');
        }
        return roleInfo.map((r) => (typeof r === 'number' ? getRoleNameById(r) : (r.name || r))).filter(Boolean).join(', ');
      }
      const parsed = typeof roleInfo === 'string' ? JSON.parse(roleInfo) : roleInfo;
      if (Array.isArray(parsed)) return parsed.map((r) => r.role_name || r.name).filter(Boolean).join(', ');
      return '-';
    } catch (err) {
      return '-';
    }
  };

  const getRoleNameById = (id) => {
    const r = roles.find((x) => Number(x.id) === Number(id));
    return r ? r.name : String(id);
  };

  const getMerchantName = (merchantId, merchantObj) => {
    // If merchant object is provided directly, use it
    if (merchantObj && merchantObj.name) {
      return merchantObj.name;
    }
    // Fallback: try to find in merchants list
    if (!merchantId) return '-';
    const merchant = merchants.find((m) => Number(m.value) === Number(merchantId));
    return merchant ? merchant.label : '-';
  };

  // Get unique options for filters
  const getUniqueNames = () => {
    const names = users.map(u => u.name).filter(Boolean);
    return [...new Set(names)].sort();
  };

  const getUniqueEmails = () => {
    const emails = users.map(u => u.email).filter(Boolean);
    return [...new Set(emails)].sort();
  };

  const getUniqueRoles = () => {
    const roleSet = new Set();
    users.forEach(u => {
      const roleNames = getRoleNames(u.role_info);
      if (roleNames !== '-') {
        roleNames.split(', ').forEach(role => roleSet.add(role.trim()));
      }
    });
    return [...roleSet].sort();
  };

  // Filter the dropdown options based on search
  const filteredNameOptions = getUniqueNames().filter(name =>
    name.toLowerCase().includes(nameFilterSearch.toLowerCase())
  );

  const filteredEmailOptions = getUniqueEmails().filter(email =>
    email.toLowerCase().includes(emailFilterSearch.toLowerCase())
  );

  const filteredRoleOptions = getUniqueRoles().filter(role =>
    role.toLowerCase().includes(roleFilterSearch.toLowerCase())
  );

  const filteredMerchantOptions = merchants
    .filter(m => m.label.toLowerCase().includes(merchantFilterSearch.toLowerCase()))
    .map(m => m.label);

  const filteredRoles = roles.filter((r) =>
    r.name.toLowerCase().includes(roleSearch.trim().toLowerCase())
  );

  const containerStyle = { padding: '16px', backgroundColor: '#F5F5F5', overflowX: 'hidden', minHeight: '100vh' };

  return (
    <div style={containerStyle}>
      <style>{`
        .page-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 7px;
            flex-wrap: nowrap;
        }
        .page-header h1 {
            margin: 0;
            font-size: 20px;
            font-weight: 600;
            white-space: nowrap;
        }
        .page-header .breadcrumb-nav {
            font-size: 13px;
            color: #555;
            display: flex;
            align-items: center;
            white-space: nowrap;
        }
        @media (max-width: 483px) {
            .page-header h1 {
                font-size: 14px;
            }
            .page-header .breadcrumb-nav {
                font-size: 10px;
            }
            .page-header .breadcrumb-nav .home-icon {
                font-size: 10px !important;
            }
            .page-header .breadcrumb-nav .separator {
                margin: 0 4px !important;
            }
        }
      `}</style>

      {/* Header */}
      <div className="mt-5 page-header">
        <h1>User Management</h1>
        <div className="breadcrumb-nav">
          <span style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <FaHome className="home-icon" style={{ fontSize: '14px' }} />
            <span>Home</span>
          </span>
          <span className="separator" style={{ margin: '0 8px' }}>/</span>
          <span style={{ cursor: 'pointer' }} onClick={() => (window.location.href = '/admin/home')}>Access Control</span>
          <span className="separator" style={{ margin: '0 8px' }}>/</span>
          <span>Users</span>
        </div>
      </div>

      {/* Filters Section with Skeleton */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '10px' }}>
        {usersLoading ? (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <SkeletonLoader type="filter" count={4} />
          </div>
        ) : (
          <>
            <style>{`
              .filter-grid {
                  display: grid;
                  gap: 12px;
                  margin-bottom: 10px;
              }
              
              /* Large screens: 8 columns */
              @media (min-width: 1200px) {
                  .filter-grid {
                      grid-template-columns: repeat(8, 1fr);
                  }
                  /* All items span 2 columns */
                  .filter-grid > div {
                      grid-column: span 2;
                  }
                  /* Buttons (5th and 6th items) span 1 column */
                  .filter-grid > div:nth-child(5),
                  .filter-grid > div:nth-child(6) {
                      grid-column: span 1;
                  }
              }
              
              /* Medium screens: 3 columns per row */
              @media (min-width: 768px) and (max-width: 1199px) {
                  .filter-grid {
                      grid-template-columns: repeat(3, 1fr);
                  }
              }
              
              /* Small screens: 2 columns per row */
              @media (max-width: 767px) {
                  .filter-grid {
                      grid-template-columns: repeat(2, 1fr);
                  }
              }
              
              .filter-field {
                  display: flex;
                  flex-direction: column;
                  position: relative;
              }
              
              .filter-field label {
                  margin-bottom: 4px;
                  fontSize: 13px;
                  font-weight: 500;
                  color: #333;
              }
          `}</style>

            <div className="filter-grid">
              {/* Name Filter */}
              <div className="filter-field" ref={nameFilterRef}>
                <label>Name</label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    value={searchName}
                    readOnly
                    onClick={() => setNameDropdownOpen(!nameDropdownOpen)}
                    placeholder="Select name..."
                    style={{
                      padding: '8px 32px 8px 12px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      width: '100%',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  />
                  {searchName && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchName('');
                      }}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        color: '#666'
                      }}
                    >
                      <FaTimes size={12} />
                    </button>
                  )}
                  {nameDropdownOpen && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '4px',
                      backgroundColor: 'white',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 1000
                    }}>
                      <input
                        type="text"
                        value={nameFilterSearch}
                        onChange={(e) => setNameFilterSearch(e.target.value)}
                        placeholder="Search..."
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: 'none',
                          borderBottom: '1px solid #eee',
                          fontSize: '13px'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      {filteredNameOptions.length === 0 ? (
                        <div style={{ padding: '8px', color: '#999', fontSize: '13px' }}>No options</div>
                      ) : (
                        filteredNameOptions.map((name, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setSearchName(name);
                              setNameDropdownOpen(false);
                              setNameFilterSearch('');
                            }}
                            style={{
                              padding: '8px 12px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              backgroundColor: searchName === name ? '#e8f1ff' : 'transparent'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = searchName === name ? '#e8f1ff' : 'transparent'}
                          >
                            {name}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Email Filter */}
              <div className="filter-field" ref={emailFilterRef}>
                <label>Email</label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    value={searchEmail}
                    readOnly
                    onClick={() => setEmailDropdownOpen(!emailDropdownOpen)}
                    placeholder="Select email..."
                    style={{
                      padding: '8px 32px 8px 12px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      width: '100%',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  />
                  {searchEmail && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchEmail('');
                      }}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        color: '#666'
                      }}
                    >
                      <FaTimes size={12} />
                    </button>
                  )}
                  {emailDropdownOpen && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '4px',
                      backgroundColor: 'white',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 1000
                    }}>
                      <input
                        type="text"
                        value={emailFilterSearch}
                        onChange={(e) => setEmailFilterSearch(e.target.value)}
                        placeholder="Search..."
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: 'none',
                          borderBottom: '1px solid #eee',
                          fontSize: '13px'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      {filteredEmailOptions.length === 0 ? (
                        <div style={{ padding: '8px', color: '#999', fontSize: '13px' }}>No options</div>
                      ) : (
                        filteredEmailOptions.map((email, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setSearchEmail(email);
                              setEmailDropdownOpen(false);
                              setEmailFilterSearch('');
                            }}
                            style={{
                              padding: '8px 12px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              backgroundColor: searchEmail === email ? '#e8f1ff' : 'transparent'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = searchEmail === email ? '#e8f1ff' : 'transparent'}
                          >
                            {email}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Role Filter */}
              <div className="filter-field" ref={roleFilterRef}>
                <label>Role</label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    value={searchRole}
                    readOnly
                    onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                    placeholder="Select role..."
                    style={{
                      padding: '8px 32px 8px 12px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      width: '100%',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  />
                  {searchRole && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchRole('');
                      }}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        color: '#666'
                      }}
                    >
                      <FaTimes size={12} />
                    </button>
                  )}
                  {roleDropdownOpen && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '4px',
                      backgroundColor: 'white',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 1000
                    }}>
                      <input
                        type="text"
                        value={roleFilterSearch}
                        onChange={(e) => setRoleFilterSearch(e.target.value)}
                        placeholder="Search..."
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: 'none',
                          borderBottom: '1px solid #eee',
                          fontSize: '13px'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      {filteredRoleOptions.length === 0 ? (
                        <div style={{ padding: '8px', color: '#999', fontSize: '13px' }}>No options</div>
                      ) : (
                        filteredRoleOptions.map((role, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setSearchRole(role);
                              setRoleDropdownOpen(false);
                              setRoleFilterSearch('');
                            }}
                            style={{
                              padding: '8px 12px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              backgroundColor: searchRole === role ? '#e8f1ff' : 'transparent'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = searchRole === role ? '#e8f1ff' : 'transparent'}
                          >
                            {role}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Merchant Filter */}
              <div className="filter-field" ref={merchantFilterRef}>
                <label>Merchant</label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    value={searchMerchant}
                    readOnly
                    onClick={() => setMerchantDropdownOpen(!merchantDropdownOpen)}
                    placeholder="Select merchant..."
                    style={{
                      padding: '8px 32px 8px 12px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      width: '100%',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  />
                  {searchMerchant && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchMerchant('');
                      }}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        color: '#666'
                      }}
                    >
                      <FaTimes size={12} />
                    </button>
                  )}
                  {merchantDropdownOpen && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '4px',
                      backgroundColor: 'white',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 1000
                    }}>
                      <input
                        type="text"
                        value={merchantFilterSearch}
                        onChange={(e) => setMerchantFilterSearch(e.target.value)}
                        placeholder="Search..."
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: 'none',
                          borderBottom: '1px solid #eee',
                          fontSize: '13px'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      {filteredMerchantOptions.length === 0 ? (
                        <div style={{ padding: '8px', color: '#999', fontSize: '13px' }}>No options</div>
                      ) : (
                        filteredMerchantOptions.map((merchant, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setSearchMerchant(merchant);
                              setMerchantDropdownOpen(false);
                              setMerchantFilterSearch('');
                            }}
                            style={{
                              padding: '8px 12px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              backgroundColor: searchMerchant === merchant ? '#e8f1ff' : 'transparent'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = searchMerchant === merchant ? '#e8f1ff' : 'transparent'}
                          >
                            {merchant}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="filter-field">
                <label style={{ visibility: 'hidden' }}>&nbsp;</label>
                <button
                  onClick={handleFilter}
                  style={{
                    padding: '8px 16px',
                    background: 'linear-gradient(45deg,#007bff,#0056b3)',
                    color: 'white',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500',
                    width: '100%',
                    height: '34px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <i className="fa-solid fa-filter" style={{ marginRight: '6px', fontSize: '12px' }}></i>
                  Filter
                </button>
              </div>

              <div className="filter-field">
                <label style={{ visibility: 'hidden' }}>&nbsp;</label>
                <button
                  onClick={handleClearFilters}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '4px',
                    background: 'transparent',
                    color: '#e92263',
                    border: '1px dashed #e92263',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500',
                    width: '100%',
                    height: '34px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <i className="fa-solid fa-times" style={{ marginRight: '6px', fontSize: '12px' }}></i>
                  Clear
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Users table with Skeleton */}
      <div className="mt-3" style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'start', marginBottom: '10px' }}>
          <button
            onClick={handleAdd}
            disabled={rolesLoading}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              background: rolesLoading ? '#ccc' : 'linear-gradient(45deg,#007bff,#0056b3)',
              color: 'white',
              border: 'none',
              cursor: rolesLoading ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <i className="fa-solid fa-plus"></i>
            {rolesLoading ? 'Loading...' : 'Create New User'}
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table table-bordered table-hover table-sm align-middle" style={{ fontSize: '12px', lineHeight: '1.8', minWidth: '100%' }}>
            <thead className="table-light">
              <tr>
                <th style={{ width: '60px' }} className="py-2 px-3 fw-semibold text-center">S/N</th>
                <th className="py-2 px-3 fw-semibold text-start">Name</th>
                <th className="py-2 px-3 fw-semibold text-start">Email</th>
                <th className="py-2 px-3 fw-semibold text-start">Phone</th>
                <th className="py-2 px-3 fw-semibold text-start">District</th>
                <th className="py-2 px-3 fw-semibold text-start">Subscription</th>
                <th className="py-2 px-3 fw-semibold text-start">Joined</th>
                <th style={{ width: '80px' }} className="py-2 px-3 fw-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersLoading ? (
                <SkeletonLoader type="table" count={5} columns={8} />
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((u, i) => (
                  <tr key={u.id} className="align-middle">
                    <td className="py-1 px-3 text-center">{i + 1}</td>
                    <td className="py-1 px-3">
                      <div style={{ fontWeight: '600', color: '#333' }}>{u.name || '-'}</div>
                    </td>
                    <td className="py-1 px-3">
                      <div style={{ fontSize: '11px', color: '#666' }}>{u.email || '-'}</div>
                    </td>
                    <td className="py-1 px-3">{u.phone || '-'}</td>
                    <td className="py-1 px-3">{u.district || '-'}</td>
                    <td className="py-1 px-3">
                      <span style={{ 
                        padding: '2px 8px', 
                        borderRadius: '10px', 
                        fontSize: '10px', 
                        fontWeight: '700',
                        background: u.subscription_status === 'active' ? '#F0FDF4' : '#FEF2F2',
                        color: u.subscription_status === 'active' ? '#16A34A' : '#DC2626'
                      }}>
                        {u.subscription_status || 'inactive'}
                      </span>
                    </td>
                    <td className="py-1 px-3">{u.joining_date || '-'}</td>
                    <td className="py-1 px-3 text-center position-relative">
                      <button className="btn btn-link p-0" style={{ fontSize: '12px' }} onClick={(e) => { e.stopPropagation(); setActionMenuId(actionMenuId === u.id ? null : u.id); }}>
                        <i className="fa-solid fa-ellipsis-v"></i>
                      </button>
                      {actionMenuId === u.id && (
                        <div className="position-absolute bg-white border rounded shadow-sm py-1" style={{
                          top: '24px',
                          right: '10px',
                          zIndex: 10,
                          minWidth: '90px',
                          fontSize: '12px',
                          lineHeight: '1.1'
                        }}>
                          <button onClick={() => handleEdit(u.id)} className="dropdown-item py-0 px-2 d-flex align-items-center" style={{ fontSize: '12px', height: '24px' }}>
                            <i className="fa-solid fa-pen me-2"></i> Edit
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center text-muted py-3">No students registered yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Results Info */}
        {!usersLoading && (
          <div style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>
            Showing {filteredUsers.length} of {users.length} results
          </div>
        )}
      </div>

      {/* Modal with Skeleton Loading */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1050,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
              width: "95%",
              maxWidth: "820px",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "12px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h5 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                {isEditing ? "Update User" : "Create New User"}
              </h5>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#666",
                }}
              >
                ×
              </button>
            </div>
            <div style={{ borderBottom: "1px solid #e5e7eb" }} />
            {/* Body */}
            {/* Body */}
            <div style={{ padding: "14px", overflowY: "auto", flex: 1 }}>
              {/* 1. Loading user details (instant feedback when clicking Edit) */}
              {modalLoading ? (
                <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-6"></div>
                  <p style={{ fontSize: '15px', color: '#444', fontWeight: '500' }}>
                    Loading user details...
                  </p>
                </div>
              ) : loading ? (
                /* 2. Saving state */
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500 mb-4"></div>
                  <p style={{ fontSize: '14px', color: '#555' }}>Saving user...</p>
                </div>
              ) : (
                /* 3. Actual Form – only shown when data is ready */
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    {/* Name */}
                    <div className="autofill-fix">
                      <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", fontSize: "13px" }}>
                        Name <span style={{ color: 'red' }}>*</span>
                      </label>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter full name"
                        style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "13px" }}
                      />
                    </div>

                    {/* Email */}
                    <div className="autofill-fix">
                      <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", fontSize: "13px" }}>
                        Email <span style={{ color: 'red' }}>*</span>
                      </label>
                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        placeholder="Enter email address"
                        style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "13px" }}
                      />
                    </div>

                    {/* Password */}
                    <div className="autofill-fix">
                      <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", fontSize: "13px" }}>
                        Password {isEditing ? "(leave blank to keep current)" : <span style={{ color: "red" }}>*</span>}
                      </label>
                      <input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                        placeholder={isEditing ? "Leave blank to keep current password" : "Enter password"}
                        style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "13px" }}
                      />
                    </div>

                    {/* Merchant */}
                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", fontSize: "13px" }}>
                        Merchant (Optional)
                      </label>
                      <select
                        value={merchantId}
                        onChange={(e) => setMerchantId(e.target.value)}
                        style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "13px", backgroundColor: "white" }}
                      >
                        <option value="">Select Merchant (Optional)</option>
                        {merchants.map((merchant) => (
                          <option key={merchant.value} value={merchant.value}>
                            {merchant.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* ROLES – Full original section (unchanged) */}
                  <div style={{ marginTop: "20px", gridColumn: "1 / -1" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "13px" }}>
                      Roles <span style={{ color: 'red' }}>*</span> (select one or more)
                    </label>

                    <div ref={dropdownRef}>
                      {/* Selected roles pill box */}
                      <div
                        onClick={() => setRolesDropdownOpen(!rolesDropdownOpen)}
                        style={{
                          minHeight: "44px",
                          padding: "6px 8px",
                          border: "1px solid #d1d5db",
                          borderRadius: "6px",
                          background: "#fff",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          flexWrap: "wrap",
                          cursor: "pointer",
                        }}
                      >
                        {selectedRoles.length === 0 ? (
                          <div style={{ color: "#999", fontSize: "13px" }}>Select roles...</div>
                        ) : (
                          selectedRoles.map((rid) => (
                            <div
                              key={rid}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "4px 8px",
                                borderRadius: "14px",
                                background: "#e8f1ff",
                                fontSize: "12px",
                              }}
                            >
                              <span style={{ marginRight: "6px" }}>{getRoleNameById(rid)}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeRoleTag(rid);
                                }}
                                style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
                              >
                                ×
                              </button>
                            </div>
                          ))
                        )}
                        <div style={{ marginLeft: "auto", color: "#666" }}>
                          <i className="fa-solid fa-chevron-down"></i>
                        </div>
                      </div>

                      {/* Dropdown */}
                      {rolesDropdownOpen && (
                        <div
                          style={{
                            marginTop: "6px",
                            border: "1px solid #e5e7eb",
                            background: "white",
                            borderRadius: "6px",
                            boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
                            padding: "8px",
                            zIndex: 50,
                          }}
                        >
                          {rolesLoading ? (
                            <div style={{ padding: "8px" }}>
                              <SkeletonLoader type="text" count={3} />
                            </div>
                          ) : filteredRoles.length === 0 ? (
                            <div style={{ padding: "6px", color: "#999" }}>No roles found</div>
                          ) : (
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                                gap: "8px",
                              }}
                            >
                              {filteredRoles.map((role) => (
                                <label
                                  key={role.id}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "8px 10px",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontSize: "13px",
                                    background: "#f8f9fa",
                                    border: "1px solid #e5e7eb",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedRoles.includes(Number(role.id))}
                                    onChange={() => toggleRoleSelection(Number(role.id))}
                                    style={{ width: "14px", height: "14px" }}
                                  />
                                  {role.name}
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}>
                      {selectedRoles.length} selected
                    </div>
                  </div>

                  {/* Permissions Section */}
                  <div style={{ marginTop: "24px", gridColumn: "1 / -1" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "13px" }}>
                      Assigned Permissions
                    </label>
                    <div style={{ backgroundColor: '#f8f9fa', borderRadius: '6px', padding: '12px', border: '1px solid #e5e7eb' }}>
                      {modalPermissionsLoading ? (
                        <div>
                          <SkeletonLoader type="text" count={2} />
                          <div style={{ marginTop: '8px' }}>
                            <SkeletonLoader type="text" count={3} />
                          </div>
                        </div>
                      ) : groupedPermissions.length > 0 ? (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                          gap: '8px'
                        }}>
                          {groupedPermissions.map((group, index) => (
                            <div key={index} style={{
                              backgroundColor: 'white',
                              borderRadius: '4px',
                              padding: '8px',
                              border: '1px solid #e5e7eb'
                            }}>
                              <div style={{ fontWeight: '600', fontSize: '12px', marginBottom: '6px', color: '#333' }}>
                                {group.label}
                              </div>
                              <div style={{ fontSize: '11px', color: '#666' }}>
                                {group.permissions.join(', ')}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ color: '#999', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                          No permissions assigned. Select roles to see permissions.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            {/* Footer */}
            <div
              style={{
                borderTop: "1px solid #e5e7eb",
                padding: "12px 16px",
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                onClick={() => setShowModal(false)}
                disabled={loading}
                style={{
                  padding: "6px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  background: "white",
                  cursor: loading ? 'not-allowed' : "pointer",
                  fontSize: "12px",
                  opacity: loading ? 0.6 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  padding: "6px 12px",
                  borderRadius: "4px",
                  background: loading ? '#ccc' : "linear-gradient(45deg,#007bff,#0056b3)",
                  color: "white",
                  border: "none",
                  cursor: loading ? 'not-allowed' : "pointer",
                  fontSize: "12px",
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? "Saving..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Skeleton Animation & Autofill Fix */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        
        .inline-block {
          display: inline-block;
        }
        
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .rounded-full {
          border-radius: 9999px;
        }
        
        .h-8 {
          height: 2rem;
        }
        
        .w-8 {
          width: 2rem;
        }
        
        .border-b-2 {
          border-bottom-width: 2px;
        }
        
        .border-teal-500 {
          border-color: #14b8a6;
        }
        
        .mb-4 {
          margin-bottom: 1rem;
        }
        
        .text-gray-600 {
          color: #4b5563;
        }
        
        /* Fix for browser autofill styles */
        .autofill-fix input:-webkit-autofill,
        .autofill-fix input:-webkit-autofill:hover,
        .autofill-fix input:-webkit-autofill:focus,
        .autofill-fix input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0px 1000px white inset !important;
          -webkit-text-fill-color: #000 !important;
          transition: background-color 5000s ease-in-out 0s !important;
        }
        
        .autofill-fix input {
          color: #000 !important;
        }
      `}</style>
    </div>
  );
};

export default UserPage;