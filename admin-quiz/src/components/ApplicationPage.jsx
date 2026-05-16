import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaHome, FaEye, FaTrash, FaCheck, FaTimes, FaFileAlt, FaGlobe, FaGraduationCap, FaBriefcase, FaMoneyBillWave, FaUser } from 'react-icons/fa';
import Paginate from './Paginate';
import SkeletonLoader from './SkeletonLoader';

const ApplicationPage = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedApp, setSelectedApp] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [updating, setUpdating] = useState(false);

    const API_BASE = import.meta.env.VITE_APP_API_BASE_URL;
    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        const token = localStorage.getItem("authToken");
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE}/api/v1/admin/portfolio/job-applications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data?.status === 'success') {
                setApplications(response.data.data || []);
            }
        } catch (error) {
            console.error("Error fetching applications:", error);
            Swal.fire('Error', 'Failed to load applications', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        const token = localStorage.getItem("authToken");
        try {
            setUpdating(true);
            const response = await axios.put(`${API_BASE}/api/v1/admin/portfolio/job-applications/${id}/status`,
                { status },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data?.status === 'success') {
                Swal.fire('Success', `Application marked as ${status}`, 'success');
                fetchApplications();
                if (selectedApp && selectedApp.id === id) {
                    setShowModal(false);
                }
            }
        } catch (error) {
            Swal.fire('Error', 'Failed to update status', 'error');
        } finally {
            setUpdating(false);
        }
    };

    const handleDelete = async (id) => {
        const confirm = await Swal.fire({
            title: 'Delete Application?',
            text: 'This candidate record will be permanently removed.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'Yes, delete it'
        });

        if (confirm.isConfirmed) {
            const token = localStorage.getItem("authToken");
            try {
                await axios.delete(`${API_BASE}/api/v1/admin/portfolio/job-applications/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                Swal.fire('Deleted', 'Record removed successfully', 'success');
                fetchApplications();
            } catch (error) {
                Swal.fire('Error', 'Delete failed', 'error');
            }
        }
    };

    const openDetails = (app) => {
        setSelectedApp(app);
        setShowModal(true);
    };

    // Pagination logic
    const totalItems = applications.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedApps = applications.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const paginator = {
        current_page: currentPage,
        total_pages: totalPages,
        record_per_page: ITEMS_PER_PAGE,
        total_count: totalItems,
    };

    return (
        <div style={{ padding: '24px', backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
            {/* Header */}
            <div className='mt-5' style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>Job Applications</h1>
                    <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>Review and manage candidate submissions</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b' }}>
                    <FaHome /> <span>Home</span> / <span>Careers</span> / <span style={{ fontWeight: 600, color: '#1e293b' }}>Applications</span>
                </div>
            </div>

            {/* Stats Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total Applications</p>
                    <h3 style={{ margin: '8px 0 0', fontSize: '24px', fontWeight: 700 }}>{applications.length}</h3>
                </div>
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Pending Review</p>
                    <h3 style={{ margin: '8px 0 0', fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>
                        {applications.filter(a => a.status === 'pending').length}
                    </h3>
                </div>
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Shortlisted</p>
                    <h3 style={{ margin: '8px 0 0', fontSize: '24px', fontWeight: 700, color: '#10b981' }}>
                        {applications.filter(a => a.status === 'shortlisted').length}
                    </h3>
                </div>
            </div>

            {/* Table */}
            <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
                <div className="table-responsive">
                    <table className="table table-hover align-middle" style={{ margin: 0, fontSize: '14px' }}>
                        <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <tr>
                                <th style={{ padding: '16px', fontWeight: 600 }}>Candidate</th>
                                <th style={{ padding: '16px', fontWeight: 600 }}>Position</th>
                                <th style={{ padding: '16px', fontWeight: 600 }}>Expected Salary</th>
                                <th style={{ padding: '16px', fontWeight: 600, textAlign: 'center' }}>Status</th>
                                <th style={{ padding: '16px', fontWeight: 600, textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5"><SkeletonLoader type="table" count={5} columns={5} /></td></tr>
                            ) : paginatedApps.length === 0 ? (
                                <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No applications found.</td></tr>
                            ) : (
                                paginatedApps.map((app) => (
                                    <tr key={app.id}>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                                    {app.image_path ? (
                                                        <img src={`${API_BASE}${app.image_path}`} alt="" style={{ width: '100%', height: '100%', objectCover: 'cover' }} />
                                                    ) : <FaUser style={{ color: '#94a3b8' }} />}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{app.full_name}</div>
                                                    <div style={{ fontSize: '12px', color: '#64748b' }}>{app.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{ fontWeight: 500 }}>{app.position || app.job?.title || 'N/A'}</span>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{ fontWeight: 600, color: '#059669' }}>৳{Number(app.expected_salary).toLocaleString()}</span>
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'center' }}>
                                            <span style={{
                                                padding: '4px 12px',
                                                borderRadius: '20px',
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                textTransform: 'uppercase',
                                                backgroundColor:
                                                    app.status === 'shortlisted' ? '#d1fae5' :
                                                        app.status === 'rejected' ? '#fee2e2' :
                                                            app.status === 'reviewed' ? '#dbeafe' : '#fef3c7',
                                                color:
                                                    app.status === 'shortlisted' ? '#065f46' :
                                                        app.status === 'rejected' ? '#991b1b' :
                                                            app.status === 'reviewed' ? '#1e40af' : '#92400e',
                                            }}>
                                                {app.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                                <button onClick={() => openDetails(app)} className="btn btn-sm btn-light" style={{ color: '#3b82f6' }} title="View Details">
                                                    <FaEye />
                                                </button>
                                                <button onClick={() => handleDelete(app.id)} className="btn btn-sm btn-light" style={{ color: '#ef4444' }} title="Delete">
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ marginTop: '20px' }}>
                    <Paginate paginator={paginator} currentPage={currentPage} pagechanged={setCurrentPage} />
                </div>
            )}

            {/* Details Modal */}
            {showModal && selectedApp && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, padding: '20px' }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '24px', width: '100%', maxWidth: '900px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        {/* Modal Header */}
                        <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: 'white', border: '1px solid #e2e8f0', overflow: 'hidden', padding: '2px' }}>
                                    {selectedApp.image_path ? (
                                        <img src={`${API_BASE}${selectedApp.image_path}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '14px' }} />
                                    ) : <FaUser size={32} style={{ margin: '14px', color: '#cbd5e1' }} />}
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#1e293b' }}>{selectedApp.full_name}</h2>
                                    <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Applying for <span style={{ fontWeight: 600, color: '#3b82f6' }}>{selectedApp.position}</span></p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', color: '#94a3b8', cursor: 'pointer' }}>×</button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>

                                {/* Section: Contact & Personal */}
                                <div>
                                    <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Contact & Info</h3>
                                    <div style={{ spaceY: '12px' }}>
                                        <div style={{ marginBottom: '12px' }}>
                                            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8' }}>Email</label>
                                            <div style={{ fontWeight: 500 }}>{selectedApp.email}</div>
                                        </div>
                                        <div style={{ marginBottom: '12px' }}>
                                            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8' }}>Parents' Name</label>
                                            <div style={{ fontWeight: 500 }}>{selectedApp.parents_name || 'N/A'}</div>
                                        </div>
                                        <div style={{ marginBottom: '12px' }}>
                                            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8' }}>Current Salary</label>
                                            <div style={{ fontWeight: 600 }}>৳{Number(selectedApp.current_salary).toLocaleString()}</div>
                                        </div>
                                        <div style={{ marginBottom: '12px' }}>
                                            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8' }}>Expected Salary</label>
                                            <div style={{ fontWeight: 700, color: '#059669', fontSize: '16px' }}>৳{Number(selectedApp.expected_salary).toLocaleString()}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Addresses */}
                                <div>
                                    <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Location</h3>
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8' }}>Present Address</label>
                                        <div style={{ fontSize: '13px', lineHeight: 1.5 }}>{selectedApp.present_address}</div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8' }}>Permanent Address</label>
                                        <div style={{ fontSize: '13px', lineHeight: 1.5 }}>{selectedApp.permanent_address}</div>
                                    </div>
                                </div>

                                {/* Section: Education (JSON) */}
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', pb: '8px' }}>
                                        <FaGraduationCap style={{ marginRight: '8px' }} /> Education History
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                                        {selectedApp.education && selectedApp.education.length > 0 ? (
                                            selectedApp.education.map((edu, i) => (
                                                <div key={i} style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                                    <div style={{ fontWeight: 700, color: '#1e293b' }}>{edu.degree}</div>
                                                    <div style={{ fontSize: '12px', color: '#64748b', margin: '4px 0' }}>{edu.institute}</div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', mt: '8px' }}>
                                                        <span style={{ color: '#94a3b8' }}>Year: {edu.year}</span>
                                                        <span style={{ fontWeight: 600, color: '#3b82f6' }}>GPA: {edu.result}</span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : <div style={{ color: '#94a3b8' }}>No education details provided</div>}
                                    </div>
                                </div>

                                {/* Section: Experience */}
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
                                        <FaBriefcase style={{ marginRight: '8px' }} /> Work Experience
                                    </h3>
                                    <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '16px', fontSize: '14px', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                                        {selectedApp.experience || 'No experience details shared.'}
                                    </div>
                                </div>

                                {/* Section: Social Links (JSON) */}
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
                                        <FaGlobe style={{ marginRight: '8px' }} /> Social Profiles
                                    </h3>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                        {selectedApp.social_links && selectedApp.social_links.length > 0 ? (
                                            selectedApp.social_links.map((link, i) => (
                                                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" style={{ padding: '8px 16px', backgroundColor: '#eff6ff', color: '#3b82f6', borderRadius: '20px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', border: '1px solid #dbeafe' }}>
                                                    {link.platform}
                                                </a>
                                            ))
                                        ) : <span style={{ color: '#94a3b8' }}>No social links</span>}
                                    </div>
                                </div>

                                {/* Section: Files */}
                                <div style={{ gridColumn: '1 / -1', pt: '20px', borderTop: '1px solid #f1f5f9' }}>
                                    <div style={{ display: 'flex', gap: '16px' }}>
                                        <a href={`${API_BASE}${selectedApp.resume_path}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 24px', backgroundColor: '#1e293b', color: 'white', borderRadius: '12px', fontWeight: 600, textDecoration: 'none' }}>
                                            <FaFileAlt /> View Resume (PDF)
                                        </a>
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* Modal Footer: Actions */}
                        <div style={{ padding: '24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '12px', backgroundColor: '#f8fafc' }}>
                            <button onClick={() => setShowModal(false)} className="btn btn-outline-secondary px-4">Close</button>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => handleUpdateStatus(selectedApp.id, 'shortlisted')}
                                    className="btn btn-success px-4"
                                    disabled={updating}
                                >
                                    <FaCheck style={{ marginRight: '8px' }} /> Shortlist
                                </button>
                                <button
                                    onClick={() => handleUpdateStatus(selectedApp.id, 'rejected')}
                                    className="btn btn-danger px-4"
                                    disabled={updating}
                                >
                                    <FaTimes style={{ marginRight: '8px' }} /> Reject
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApplicationPage;