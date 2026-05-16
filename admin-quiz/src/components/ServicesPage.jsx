import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Edit, Trash2, Plus, Image as ImageIcon } from 'lucide-react';
import SkeletonLoader from './SkeletonLoader';

const ServicesPage = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        icon_image_path: ''
    });

    const API_BASE = import.meta.env.VITE_APP_API_BASE_URL;

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/api/v1/public/portfolio/services`);
            if (res.data && res.data.data) {
                setServices(res.data.data);
            }
        } catch (err) {
            console.error("Failed to load services:", err);
            Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to fetch services list.' });
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingImage(true);
        const token = localStorage.getItem('authToken');

        try {
            const upData = new FormData();
            upData.append('file', file);
            upData.append('file_path', 'portfolio/services/');
            upData.append('file_name', file.name.split('.')[0]);

            const res = await axios.post(`${API_BASE}/api/v1/general/file/file-upload`, upData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.data?.status === 'success' || res.data?.code === 200) {
                const uploadedPath = res.data.data.file_path;
                setFormData(prev => ({ ...prev, icon_image_path: uploadedPath }));
            } else {
                Swal.fire({ icon: 'error', title: 'Upload Failed', text: 'Could not upload image.' });
            }
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Upload Failed', text: 'Error uploading image.' });
        } finally {
            setUploadingImage(false);
        }
    };

    const openCreate = () => {
        setIsEditing(false);
        setSelectedId(null);
        setFormData({ title: '', description: '', icon_image_path: '' });
        setShowModal(true);
    };

    const openEdit = (service) => {
        setIsEditing(true);
        setSelectedId(service.id);
        setFormData({
            title: service.title,
            description: service.description || '',
            icon_image_path: service.icon_image_path || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        const confirm = await Swal.fire({
            title: 'Delete Service?',
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
                const res = await axios.delete(`${API_BASE}/api/v1/admin/portfolio/services/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.data?.success) {
                    Swal.fire('Deleted!', 'Service removed.', 'success');
                    fetchServices();
                }
            } catch (err) {
                Swal.fire('Error!', 'Could not delete service.', 'error');
            }
        }
    };

    const handleSave = async () => {
        if (!formData.title.trim()) {
            Swal.fire({ icon: 'warning', text: 'Service Title is required.' });
            return;
        }

        setSaving(true);
        const token = localStorage.getItem('authToken');

        try {
            const url = isEditing
                ? `${API_BASE}/api/v1/admin/portfolio/services/${selectedId}`
                : `${API_BASE}/api/v1/admin/portfolio/services`;

            // Note: the backend uses PUT/POST or just POST with ID for updates, check routes:
            // Route::post('/services/{id}', [ServiceController::class, 'update']);
            // Wait, standard update route is often PUT, but earlier we used POST for images. 
            // In routes.jsx we registered it as `Route::post('/services/{id}'` so we use POST for update too!

            const res = await axios.post(url, formData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.data?.success) {
                Swal.fire({ icon: 'success', title: 'Success', text: 'Service saved successfully.', timer: 2000, showConfirmButton: false });
                setShowModal(false);
                fetchServices();
            }
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Save Failed', text: err.response?.data?.message || 'Could not save Service data.' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ padding: '16px', backgroundColor: '#F5F5F5', minHeight: '100vh' }}>
            <div className='mt-5 page-header' style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Portfolio Services</h1>
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '15px' }}>
                <div style={{ marginBottom: '15px' }}>
                    <button onClick={openCreate} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Plus size={14} /> Add New Service
                    </button>
                </div>

                <div className="table-responsive">
                    <table className="table table-bordered table-hover align-middle" style={{ fontSize: '13px' }}>
                        <thead className="table-light">
                            <tr>
                                <th style={{ width: '80px', textAlign: 'center' }}>Icon</th>
                                <th>Service Title</th>
                                <th>Description</th>
                                <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="4"><SkeletonLoader type="table" count={5} columns={4} /></td></tr>
                            ) : services.length === 0 ? (
                                <tr><td colSpan="4" className="text-center text-muted py-4">No services provided yet.</td></tr>
                            ) : (
                                services.map(srv => (
                                    <tr key={srv.id}>
                                        <td className="text-center">
                                            {srv.icon_image_path ? (
                                                <img src={API_BASE + srv.icon_image_path} alt="Icon" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                                            ) : (
                                                <div style={{ width: '40px', height: '40px', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                                                    <ImageIcon size={16} className="text-muted" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="fw-bold">{srv.title}</td>
                                        <td className="text-muted" style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {srv.description}
                                        </td>
                                        <td className="text-center">
                                            <button onClick={() => openEdit(srv)} className="btn btn-sm btn-light me-2" title="Edit">
                                                <Edit size={14} className="text-primary" />
                                            </button>
                                            <button onClick={() => handleDelete(srv.id)} className="btn btn-sm btn-light" title="Delete">
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
                    <div style={{ backgroundColor: 'white', borderRadius: '8px', width: '90%', maxWidth: '500px', padding: '20px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' }}>
                        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                            <h5 className="m-0 fw-bold">{isEditing ? 'Update Service' : 'Add New Service'}</h5>
                            <button onClick={() => setShowModal(false)} className="btn-close" aria-label="Close"></button>
                        </div>

                        <div className="mb-3">
                            <label className="form-label fw-bold small">Service Title <span className="text-danger">*</span></label>
                            <input
                                type="text"
                                className="form-control"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="E.g. Web Development"
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label fw-bold small">Description</label>
                            <textarea
                                className="form-control"
                                rows="3"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Service description..."
                            />
                        </div>

                        <div className="mb-4">
                            <label className="form-label fw-bold small">Icon / Image</label>
                            {formData.icon_image_path && (
                                <div className="mb-2 p-2 border rounded" style={{ backgroundColor: '#fafafa', width: 'fit-content' }}>
                                    <img src={API_BASE + formData.icon_image_path} alt="Preview" style={{ height: '50px', objectFit: 'contain' }} />
                                </div>
                            )}
                            <input
                                type="file"
                                className="form-control form-control-sm"
                                accept="image/*"
                                onChange={handleImageUpload}
                                disabled={uploadingImage}
                            />
                            {uploadingImage && <small className="text-primary mt-1 d-block"><i className="fas fa-spinner fa-spin"></i> Uploading...</small>}
                        </div>

                        <div className="text-end border-top pt-3">
                            <button onClick={() => setShowModal(false)} className="btn btn-light me-2 px-4" disabled={saving}>Cancel</button>
                            <button onClick={handleSave} className="btn btn-primary px-4" disabled={saving || uploadingImage}>
                                {saving ? 'Saving...' : 'Save Service'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServicesPage;
