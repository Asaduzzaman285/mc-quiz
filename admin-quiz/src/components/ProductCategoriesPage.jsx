import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Save, Plus, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import SkeletonLoader from './SkeletonLoader';
import { Modal, Button, Form } from 'react-bootstrap';

const ProductCategoriesPage = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    const [formData, setFormData] = useState({
        id: null,
        name: '',
        email: '',
        intro_text: '',
        image_path: ''
    });

    const API_BASE = import.meta.env.VITE_APP_API_BASE_URL;

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/api/v1/public/portfolio/product-categories`);
            if (res.data?.success) {
                setCategories(res.data.data);
            }
        } catch (err) {
            Swal.fire('Error', 'Failed to fetch product categories', 'error');
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
            const uploadData = new FormData();
            uploadData.append('file', file);
            uploadData.append('file_path', 'portfolio/product_categories/');
            uploadData.append('file_name', file.name.split('.')[0]);

            const res = await axios.post(`${API_BASE}/api/v1/general/file/file-upload`, uploadData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.data?.status === 'success' || res.data?.code === 200) {
                setFormData(prev => ({ ...prev, image_path: res.data.data.file_path }));
            } else {
                Swal.fire('Error', 'Image upload failed', 'error');
            }
        } catch (err) {
            Swal.fire('Error', 'Image upload failed', 'error');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        const token = localStorage.getItem('authToken');

        try {
            const url = isEditing
                ? `${API_BASE}/api/v1/admin/portfolio/product-categories/${formData.id}`
                : `${API_BASE}/api/v1/admin/portfolio/product-categories`;

            const method = isEditing ? 'put' : 'post';

            const res = await axios[method](url, formData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.data?.success) {
                Swal.fire({ icon: 'success', title: 'Success', text: 'Category saved!', timer: 2000 });
                setShowModal(false);
                fetchCategories();
            }
        } catch (err) {
            Swal.fire('Error', 'Failed to save product category', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        const confirm = await Swal.fire({
            title: 'Are you sure?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });

        if (confirm.isConfirmed) {
            try {
                const token = localStorage.getItem('authToken');
                await axios.delete(`${API_BASE}/api/v1/admin/portfolio/product-categories/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                Swal.fire('Deleted!', 'Category has been deleted.', 'success');
                fetchCategories();
            } catch (err) {
                Swal.fire('Error', 'Could not delete category', 'error');
            }
        }
    };

    const openAddModal = () => {
        setIsEditing(false);
        setFormData({ id: null, name: '', email: '', intro_text: '', image_path: '' });
        setShowModal(true);
    };

    const openEditModal = (cat) => {
        setIsEditing(true);
        setFormData({
            id: cat.id,
            name: cat.name || '',
            email: cat.email || '',
            intro_text: cat.intro_text || '',
            image_path: cat.image_path || ''
        });
        setShowModal(true);
    };

    return (
        <div style={{ padding: '16px', backgroundColor: '#F5F5F5', overflowX: 'hidden', minHeight: '100vh' }}>
            <div className="mt-5 d-flex justify-content-between align-items-center mb-4">
                <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Collective Products (Parents)</h1>
                <button className="btn btn-primary btn-sm d-flex align-items-center gap-1" onClick={openAddModal}>
                    <Plus size={14} /> Add Collective Product
                </button>
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                {loading ? <SkeletonLoader type="table" count={5} columns={4} /> : (
                    <div className="table-responsive">
                        <table className="table table-bordered table-hover align-middle" style={{ fontSize: '13px' }}>
                            <thead className="table-light">
                                <tr>
                                    <th style={{ width: '80px' }}>Image</th>
                                    <th>Collective Product Name</th>
                                    <th>Dedicated Email</th>
                                    <th>Intro Text</th>
                                    <th style={{ width: '100px', textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center py-4">No categories found.</td></tr>
                                ) : (
                                    categories.map(cat => (
                                        <tr key={cat.id}>
                                            <td className="text-center">
                                                {cat.image_path ? (
                                                    <img src={`${API_BASE}${cat.image_path}`} alt={cat.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                                                ) : <div className="bg-light d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px', borderRadius: '4px' }}><ImageIcon size={20} className="text-muted" /></div>}
                                            </td>
                                            <td className="fw-bold">{cat.name}</td>
                                            <td>{cat.email || <span className="text-muted fst-italic">None set</span>}</td>
                                            <td>
                                                <div style={{ maxHeight: '40px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat.intro_text}</div>
                                            </td>
                                            <td className="text-center">
                                                <button onClick={() => openEditModal(cat)} className="btn btn-sm btn-light me-2"><Edit size={14} className="text-primary" /></button>
                                                <button onClick={() => handleDelete(cat.id)} className="btn btn-sm btn-light"><Trash2 size={14} className="text-danger" /></button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} backdrop="static" size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{isEditing ? 'Edit Collective Product' : 'Create Collective Product'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSave}>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold small">Product Name *</Form.Label>
                            <Form.Control required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="E.g. Basic Chemicals" />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold text-primary small">Dedicated Department Email</Form.Label>
                            <Form.Control type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="E.g. inquiries@threeeyebd.com" />
                            <Form.Text className="text-muted">Inquiries for products in this category will be routed through the dashboard to this email automatically.</Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold small">Intro Text</Form.Label>
                            <Form.Control as="textarea" rows={3} value={formData.intro_text} onChange={e => setFormData({ ...formData, intro_text: e.target.value })} placeholder="Short description..." />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold small">Product Image</Form.Label>
                            <div className="d-flex align-items-end gap-3">
                                <div style={{ width: '100px', height: '100px', border: '1px dashed #ccc', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {formData.image_path ? (
                                        <img src={formData.image_path.startsWith('http') ? formData.image_path : `${API_BASE}${formData.image_path}`} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : <ImageIcon className="text-muted opacity-50" size={30} />}
                                </div>
                                <div className="flex-grow-1">
                                    <Form.Control type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                                    {uploadingImage && <small className="text-primary d-block mt-1">Uploading...</small>}
                                </div>
                            </div>
                        </Form.Group>

                        <div className="text-end mt-4">
                            <Button variant="light" onClick={() => setShowModal(false)} className="me-2" disabled={saving || uploadingImage}>Cancel</Button>
                            <Button variant="primary" type="submit" disabled={saving || uploadingImage}>
                                {saving ? 'Saving...' : 'Save Product'}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default ProductCategoriesPage;
