import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Edit, Trash2, Plus, Briefcase } from 'lucide-react';
import SkeletonLoader from './SkeletonLoader';

const JobPostsPage = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        requirements: '',
        is_active: true
    });

    const API_BASE = import.meta.env.VITE_APP_API_BASE_URL;

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/api/v1/public/portfolio/jobs`);
            if (res.data && res.data.data) {
                setJobs(res.data.data);
            }
        } catch (err) {
            console.error("Failed to load jobs:", err);
            Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to fetch job list.' });
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setIsEditing(false);
        setSelectedId(null);
        setFormData({ title: '', description: '', requirements: '', is_active: true });
        setShowModal(true);
    };

    const openEdit = (job) => {
        setIsEditing(true);
        setSelectedId(job.id);
        setFormData({
            title: job.title || '',
            description: job.description || '',
            requirements: job.requirements || '',
            is_active: job.is_active === 1 || job.is_active === true
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        const confirm = await Swal.fire({
            title: 'Delete Job Post?',
            text: 'This action cannot be undone!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, delete it!'
        });

        if (confirm.isConfirmed) {
            try {
                const token = localStorage.getItem('authToken');
                const res = await axios.delete(`${API_BASE}/api/v1/admin/portfolio/jobs/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.data?.success) {
                    Swal.fire('Deleted!', 'Job post removed.', 'success');
                    fetchJobs();
                }
            } catch (err) {
                Swal.fire('Error!', 'Could not delete job post.', 'error');
            }
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        const token = localStorage.getItem('authToken');

        try {
            const url = isEditing
                ? `${API_BASE}/api/v1/admin/portfolio/jobs/${selectedId}`
                : `${API_BASE}/api/v1/admin/portfolio/jobs`;

            const method = isEditing ? 'put' : 'post';

            const res = await axios({
                method: method,
                url: url,
                data: formData,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.data?.success) {
                Swal.fire({ icon: 'success', title: 'Success', text: 'Job post saved successfully.', timer: 2000, showConfirmButton: false });
                setShowModal(false);
                fetchJobs();
            }
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Save Failed', text: err.response?.data?.message || 'Could not save Job data.' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ padding: '16px', backgroundColor: '#F5F5F5', minHeight: '100vh' }}>
            <div className='mt-5 page-header' style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Career Management</h1>
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '15px' }}>
                <div style={{ marginBottom: '15px' }}>
                    <button onClick={openCreate} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Plus size={14} /> Post New Job
                    </button>
                </div>

                <div className="table-responsive">
                    <table className="table table-bordered table-hover align-middle" style={{ fontSize: '13px' }}>
                        <thead className="table-light">
                            <tr>
                                <th>Job Title</th>
                                <th>Description / Responsibilities</th>
                                <th style={{ width: '100px', textAlign: 'center' }}>Status</th>
                                <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="4"><SkeletonLoader type="table" count={5} columns={4} /></td></tr>
                            ) : jobs.length === 0 ? (
                                <tr><td colSpan="4" className="text-center text-muted py-4">No job posts created yet.</td></tr>
                            ) : (
                                jobs.map(job => (
                                    <tr key={job.id}>
                                        <td className="fw-bold">{job.title}</td>
                                        <td className="text-muted" style={{ maxWidth: '400px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {job.description}
                                        </td>
                                        <td className="text-center">
                                            <span className={`badge ${job.is_active ? 'bg-success' : 'bg-secondary'}`} style={{ fontSize: '10px' }}>
                                                {job.is_active ? 'Active' : 'Draft'}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            <button onClick={() => openEdit(job)} className="btn btn-sm btn-light me-2" title="Edit">
                                                <Edit size={14} className="text-primary" />
                                            </button>
                                            <button onClick={() => handleDelete(job.id)} className="btn btn-sm btn-light" title="Delete">
                                                <Trash2 size={14} className="text-danger" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050 }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '8px', width: '90%', maxWidth: '700px', padding: '25px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
                            <h5 className="m-0 fw-bold">{isEditing ? 'Update Job Post' : 'Create New Job Post'}</h5>
                            <button onClick={() => setShowModal(false)} className="btn-close" aria-label="Close"></button>
                        </div>

                        <form onSubmit={handleSave}>
                            <div className="mb-3">
                                <label className="form-label fw-bold small">Job Title <span className="text-danger">*</span></label>
                                <input
                                    required
                                    type="text"
                                    className="form-control"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="E.g. Senior Chemical Engineer"
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label fw-bold small">Job Description / Overview <span className="text-danger">*</span></label>
                                <textarea
                                    required
                                    className="form-control"
                                    rows="4"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Overview of the role and responsibilities..."
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label fw-bold small">Requirements / Qualifications</label>
                                <textarea
                                    className="form-control"
                                    rows="4"
                                    value={formData.requirements}
                                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                                    placeholder="Degree, experience, skills required..."
                                />
                            </div>

                            <div className="mb-4 d-flex align-items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    id="jobStatus"
                                    checked={formData.is_active} 
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} 
                                />
                                <label htmlFor="jobStatus" className="form-label fw-bold small m-0">Publish immediately (Visible on website)</label>
                            </div>

                            <div className="text-end border-top pt-3">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-light me-2 px-4" disabled={saving}>Cancel</button>
                                <button type="submit" className="btn btn-primary px-4" disabled={saving}>
                                    {saving ? 'Saving...' : 'Save Job Post'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JobPostsPage;
