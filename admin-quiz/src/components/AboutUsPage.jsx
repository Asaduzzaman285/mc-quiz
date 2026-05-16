import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Save, Image as ImageIcon, Plus, Edit, Trash2 } from 'lucide-react';
import SkeletonLoader from './SkeletonLoader';

const AboutUsPage = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    // Global About Us Data
    const [formData, setFormData] = useState({
        right_title: '',
        right_description: '',
        image_path: ''
    });
    const [previewImage, setPreviewImage] = useState(null);

    // Slides Data
    const [slides, setSlides] = useState([]);

    // Slide Modal State
    const [showModal, setShowModal] = useState(false);
    const [isEditingSlide, setIsEditingSlide] = useState(false);
    const [selectedSlideId, setSelectedSlideId] = useState(null);
    const [savingSlide, setSavingSlide] = useState(false);
    const [slideData, setSlideData] = useState({
        title: '',
        content: '',
        order: 0
    });

    const API_BASE = import.meta.env.VITE_APP_API_BASE_URL;

    useEffect(() => {
        fetchAboutUs();
    }, []);

    const fetchAboutUs = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/api/v1/public/portfolio/about`);
            if (res.data && res.data.data) {
                const data = res.data.data;
                setFormData({
                    right_title: data.right_title || '',
                    right_description: data.right_description || '',
                    image_path: data.left_image_path || ''
                });
                if (data.left_image_path) {
                    setPreviewImage(API_BASE + data.left_image_path);
                }
                setSlides(data.slides || []);
            }
        } catch (err) {
            console.error("Failed to load About Us data:", err);
            Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load data.' });
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
            upData.append('file_path', 'portfolio/about/');
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
                setPreviewImage(uploadedPath.startsWith('http') ? uploadedPath : API_BASE + uploadedPath);
            } else {
                Swal.fire({ icon: 'error', title: 'Upload Failed', text: 'Could not upload image.' });
            }
        } catch (err) {
            console.error("Image upload failed:", err);
            Swal.fire({ icon: 'error', title: 'Upload Failed', text: 'Error uploading image.' });
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSaveGlobal = async () => {
        setSaving(true);
        const token = localStorage.getItem('authToken');

        try {
            const res = await axios.post(`${API_BASE}/api/v1/admin/portfolio/about`, formData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.data?.success) {
                Swal.fire({ icon: 'success', title: 'Saved!', text: 'About Us main section updated.', timer: 2000, showConfirmButton: false });
            }
        } catch (err) {
            console.error("Save failed:", err);
            Swal.fire({ icon: 'error', title: 'Save Failed', text: 'Could not save About Us data.' });
        } finally {
            setSaving(false);
        }
    };

    // --- Slide Functions ---
    const openCreateSlide = () => {
        setIsEditingSlide(false);
        setSelectedSlideId(null);
        // Find the maximum order and add 1
        const maxOrder = slides.length > 0 ? Math.max(...slides.map(s => s.order)) : -1;
        setSlideData({ title: '', content: '', order: maxOrder + 1 });
        setShowModal(true);
    };

    const openEditSlide = (slide) => {
        setIsEditingSlide(true);
        setSelectedSlideId(slide.id);
        setSlideData({
            title: slide.title,
            content: slide.content,
            order: slide.order
        });
        setShowModal(true);
    };

    const handleDeleteSlide = async (id) => {
        const confirm = await Swal.fire({
            title: 'Delete Slide?',
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
                const res = await axios.delete(`${API_BASE}/api/v1/admin/portfolio/about/slides/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.data?.success) {
                    Swal.fire('Deleted!', 'Slide removed.', 'success');
                    fetchAboutUs();
                }
            } catch (err) {
                Swal.fire('Error!', 'Could not delete slide.', 'error');
            }
        }
    };

    const handleSaveSlide = async () => {
        if (!slideData.title.trim() || !slideData.content.trim()) {
            Swal.fire({ icon: 'warning', text: 'Title and Content are required.' });
            return;
        }

        setSavingSlide(true);
        const token = localStorage.getItem('authToken');

        try {
            const url = isEditingSlide
                ? `${API_BASE}/api/v1/admin/portfolio/about/slides/${selectedSlideId}`
                : `${API_BASE}/api/v1/admin/portfolio/about/slides`;
            
            // PUT request since our api route is configured as Route::put() for slide updates
            const method = isEditingSlide ? 'put' : 'post';

            const res = await axios[method](url, slideData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.data?.success) {
                Swal.fire({ icon: 'success', title: 'Success', text: 'Slide saved successfully.', timer: 2000, showConfirmButton: false });
                setShowModal(false);
                fetchAboutUs();
            }
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Save Failed', text: err.response?.data?.message || 'Could not save Slide.' });
        } finally {
            setSavingSlide(false);
        }
    };

    const containerStyle = { padding: '16px', backgroundColor: '#F5F5F5', minHeight: '100vh' };

    return (
        <div style={containerStyle}>
            <div className='mt-5 page-header' style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>About Us Configuration</h1>
            </div>

            {loading ? (
                <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px' }}>
                    <SkeletonLoader type="table" count={3} columns={1} />
                </div>
            ) : (
                <>
                    {/* Main Global Content Config */}
                    <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px', marginBottom: '20px' }}>
                        <h5 className="border-bottom pb-2 mb-3 fw-bold">Landing Page Content</h5>
                        <div className="row">
                            <div className="col-md-8">
                                <div className="mb-3">
                                    <label className="form-label fw-bold">Right Side Title</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.right_title}
                                        onChange={(e) => setFormData({ ...formData, right_title: e.target.value })}
                                        placeholder="Enter title (e.g. Connecting Ideas to Realities)"
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-bold">Right Side Description (Optional Text block)</label>
                                    <textarea
                                        className="form-control"
                                        rows="6"
                                        value={formData.right_description}
                                        onChange={(e) => setFormData({ ...formData, right_description: e.target.value })}
                                        placeholder="Enter paragraph description if applicable on your landing page..."
                                    />
                                </div>
                            </div>

                            <div className="col-md-4">
                                <div className="mb-3">
                                    <label className="form-label fw-bold">Left Side Block Image</label>

                                    <div
                                        className="border rounded d-flex flex-column align-items-center justify-content-center mb-2"
                                        style={{ height: '200px', backgroundColor: '#fafafa', overflow: 'hidden' }}
                                    >
                                        {previewImage ? (
                                            <img src={previewImage} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                        ) : (
                                            <div className="text-muted text-center">
                                                <ImageIcon size={40} className="mb-2 opacity-50" />
                                                <div style={{ fontSize: '13px' }}>No image loaded</div>
                                            </div>
                                        )}
                                    </div>

                                    <input
                                        type="file"
                                        className="form-control mb-2"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        disabled={uploadingImage}
                                    />
                                    {uploadingImage && <small className="text-primary d-block mt-1"><i className="fas fa-spinner fa-spin me-1"></i> Uploading Image...</small>}
                                </div>
                            </div>

                            <div className="col-12 mt-2 text-end">
                                <button
                                    className="btn btn-primary px-4"
                                    onClick={handleSaveGlobal}
                                    disabled={saving || uploadingImage}
                                >
                                    {saving ? (
                                        <><i className="fas fa-spinner fa-spin me-2"></i>Saving...</>
                                    ) : (
                                        <><Save size={16} className="me-2" style={{ marginTop: '-3px' }} /> Update General Content</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Dedicated Sliders Config */}
                    <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px' }}>
                        <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                            <div>
                                <h5 className="m-0 fw-bold">Dedicated Page Carousel Slides</h5>
                                <small className="text-muted">These texts will populate the interactive slide module on the `/about-us` route page.</small>
                            </div>
                            <button onClick={openCreateSlide} className="btn btn-primary btn-sm d-flex align-items-center gap-1">
                                <Plus size={14} /> Add Slide
                            </button>
                        </div>

                        <div className="table-responsive">
                            <table className="table table-bordered table-hover align-middle" style={{ fontSize: '13px' }}>
                                <thead className="table-light">
                                    <tr>
                                        <th style={{ width: '60px', textAlign: 'center' }}>Order</th>
                                        <th style={{ width: '200px' }}>Slide Title</th>
                                        <th>Slide Text Content</th>
                                        <th style={{ width: '100px', textAlign: 'center' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {slides.length === 0 ? (
                                        <tr><td colSpan="4" className="text-center text-muted py-4">No slider sections found. Add one!</td></tr>
                                    ) : (
                                        slides.map(sl => (
                                            <tr key={sl.id}>
                                                <td className="text-center fw-bold">{sl.order}</td>
                                                <td className="fw-bold">{sl.title}</td>
                                                <td>
                                                    <div style={{ maxHeight: '80px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {sl.content}
                                                    </div>
                                                </td>
                                                <td className="text-center">
                                                    <button onClick={() => openEditSlide(sl)} className="btn btn-sm btn-light me-2" title="Edit">
                                                        <Edit size={14} className="text-primary" />
                                                    </button>
                                                    <button onClick={() => handleDeleteSlide(sl.id)} className="btn btn-sm btn-light" title="Delete">
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
                </>
            )}

            {/* Slide Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050 }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '8px', width: '90%', maxWidth: '600px', padding: '20px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' }}>
                        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                            <h5 className="m-0 fw-bold">{isEditingSlide ? 'Update Slide Section' : 'Add Slide Section'}</h5>
                            <button onClick={() => setShowModal(false)} className="btn-close" aria-label="Close"></button>
                        </div>
                        
                        <div className="mb-3">
                            <label className="form-label fw-bold small">Slider Heading</label>
                            <input 
                                type="text" 
                                className="form-control" 
                                value={slideData.title} 
                                onChange={(e) => setSlideData({...slideData, title: e.target.value})} 
                                placeholder="E.g. Vision & Mission"
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label fw-bold small">Body Content</label>
                            <textarea 
                                className="form-control" 
                                rows="6"
                                value={slideData.content} 
                                onChange={(e) => setSlideData({...slideData, content: e.target.value})} 
                                placeholder="Core text body or HTML for this slide..."
                            />
                        </div>
                        
                        <div className="mb-3">
                            <label className="form-label fw-bold small">Display Order</label>
                            <input 
                                type="number" 
                                className="form-control" 
                                value={slideData.order} 
                                onChange={(e) => setSlideData({...slideData, order: Number(e.target.value)})} 
                                style={{ maxWidth: '100px' }}
                            />
                        </div>

                        <div className="text-end border-top pt-3">
                            <button onClick={() => setShowModal(false)} className="btn btn-light me-2 px-4" disabled={savingSlide}>Cancel</button>
                            <button onClick={handleSaveSlide} className="btn btn-primary px-4" disabled={savingSlide}>
                                {savingSlide ? 'Saving...' : 'Save Slide'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AboutUsPage;
