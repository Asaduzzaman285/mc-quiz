import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Edit, Trash2, Plus, Image as ImageIcon } from 'lucide-react';
import SkeletonLoader from './SkeletonLoader';

const HeroesPage = () => {
    const [heroes, setHeroes] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        image_path: ''
    });

    const API_BASE = import.meta.env.VITE_APP_API_BASE_URL;

    useEffect(() => {
        fetchHeroes();
    }, []);

    const fetchHeroes = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/api/v1/public/portfolio/heroes`);
            if (res.data && res.data.data) {
                setHeroes(res.data.data);
            }
        } catch (err) {
            console.error("Failed to load heroes:", err);
            Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to fetch heroes list.' });
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
            upData.append('file_path', 'portfolio/heroes/');
            upData.append('file_name', file.name.split('.')[0]);

            const res = await axios.post(`${API_BASE}/api/v1/general/file/file-upload`, upData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.data?.status === 'success' || res.data?.code === 200) {
                const uploadedPath = res.data.data.file_path;
                setFormData(prev => ({ ...prev, image_path: uploadedPath }));
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
        setFormData({ title: '', subtitle: '', image_path: '' });
        setShowModal(true);
    };

    const openEdit = (hero) => {
        setIsEditing(true);
        setSelectedId(hero.id);
        setFormData({
            title: hero.title || '',
            subtitle: hero.subtitle || '',
            image_path: hero.image_path || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        const confirm = await Swal.fire({
            title: 'Delete Hero Slide?',
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
                const res = await axios.delete(`${API_BASE}/api/v1/admin/portfolio/heroes/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.data?.success) {
                    Swal.fire('Deleted!', 'Hero slide removed.', 'success');
                    fetchHeroes();
                }
            } catch (err) {
                Swal.fire('Error!', 'Could not delete hero slide.', 'error');
            }
        }
    };

    const handleSave = async () => {
        // Validation: at least title or an image should be present, but let's just make sure backend handles it
        setSaving(true);
        const token = localStorage.getItem('authToken');

        try {
            const url = isEditing
                ? `${API_BASE}/api/v1/admin/portfolio/heroes/${selectedId}`
                : `${API_BASE}/api/v1/admin/portfolio/heroes`;

            const res = await axios.post(url, formData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.data?.success) {
                Swal.fire({ icon: 'success', title: 'Success', text: 'Hero slide saved successfully.', timer: 2000, showConfirmButton: false });
                setShowModal(false);
                fetchHeroes();
            }
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Save Failed', text: err.response?.data?.message || 'Could not save Hero data.' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ padding: '16px', backgroundColor: '#F5F5F5', minHeight: '100vh' }}>
            <div className='mt-5 page-header' style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Portfolio Hero Sliders</h1>
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '15px' }}>
                <div style={{ marginBottom: '15px' }}>
                    <button onClick={openCreate} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Plus size={14} /> Add New Slide
                    </button>
                </div>

                <div className="table-responsive">
                    <table className="table table-bordered table-hover align-middle" style={{ fontSize: '13px' }}>
                        <thead className="table-light">
                            <tr>
                                <th style={{ width: '120px', textAlign: 'center' }}>Hero Image</th>
                                <th>Primary Title</th>
                                <th>Subtitle</th>
                                <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="4"><SkeletonLoader type="table" count={3} columns={4} /></td></tr>
                            ) : heroes.length === 0 ? (
                                <tr><td colSpan="4" className="text-center text-muted py-4">No hero slides added yet.</td></tr>
                            ) : (
                                heroes.map(hero => (
                                    <tr key={hero.id}>
                                        <td className="text-center">
                                            {hero.image_path ? (
                                                <img src={API_BASE + hero.image_path} alt="Slide" style={{ width: '80px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                                            ) : (
                                                <div style={{ width: '80px', height: '40px', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', borderRadius: '4px' }}>
                                                    <ImageIcon size={16} className="text-muted" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="fw-bold">{hero.title || <span className="text-muted fst-italic">No Title</span>}</td>
                                        <td className="text-muted">{hero.subtitle}</td>
                                        <td className="text-center">
                                            <button onClick={() => openEdit(hero)} className="btn btn-sm btn-light me-2" title="Edit">
                                                <Edit size={14} className="text-primary" />
                                            </button>
                                            <button onClick={() => handleDelete(hero.id)} className="btn btn-sm btn-light" title="Delete">
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
                            <h5 className="m-0 fw-bold">{isEditing ? 'Update Hero Slide' : 'Add New Hero Slide'}</h5>
                            <button onClick={() => setShowModal(false)} className="btn-close" aria-label="Close"></button>
                        </div>

                        <div className="mb-3">
                            <label className="form-label fw-bold small">Primary Title</label>
                            <input
                                type="text"
                                className="form-control"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="E.g. Welcome to Innovio"
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label fw-bold small">Subtitle</label>
                            <input
                                type="text"
                                className="form-control"
                                value={formData.subtitle}
                                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                                placeholder="E.g. Discover our amazing services"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="form-label fw-bold small">Background Image</label>
                            {formData.image_path && (
                                <div className="mb-2 p-2 border rounded" style={{ backgroundColor: '#fafafa' }}>
                                    <img src={API_BASE + formData.image_path} alt="Preview" style={{ height: '80px', width: '100%', objectFit: 'cover' }} />
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
                                {saving ? 'Saving...' : 'Save Slide'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HeroesPage;
