import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Upload, FileText, Image as ImageIcon, Check, Loader2 } from 'lucide-react';

const MagazineManager = () => {
    const [magazines, setMagazines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '', month: '', title: '', price: 50, pages: 200, 
        topics: '', featured: false, color: '#7C6FFF',
        pdf: null, cover: null
    });
    const [uploading, setUploading] = useState(null);

    const API_URL = import.meta.env.VITE_APP_API_BASE_URL + '/api/v1';
    const token = localStorage.getItem('authToken');

    useEffect(() => {
        fetchMagazines();
    }, []);

    const fetchMagazines = async () => {
        try {
            const res = await axios.get(`${API_URL}/magazines`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMagazines(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (key === 'topics') {
                data.append(key, JSON.stringify(formData.topics.split(',').map(t => t.trim())));
            } else if (formData[key] !== null) {
                data.append(key, formData[key]);
            }
        });

        try {
            await axios.post(`${API_URL}/admin/magazines`, data, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setShowModal(false);
            setFormData({
                name: '', month: '', title: '', price: 50, pages: 200, 
                topics: '', featured: false, color: '#7C6FFF',
                pdf: null, cover: null
            });
            fetchMagazines();
        } catch (err) {
            alert(err.response?.data?.message?.[0] || 'Error creating magazine');
        }
    };

    const handleFileUpload = async (magId, type, file) => {
        setUploading({ id: magId, type });
        const data = new FormData();
        data.append('file', file);
        data.append('type', type);

        try {
            await axios.post(`${API_URL}/admin/magazines/${magId}/upload`, data, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            fetchMagazines();
        } catch (err) {
            alert('Upload failed');
        } finally {
            setUploading(null);
        }
    };

    return (
        <div style={{ padding: '24px', backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b', margin: 0 }}>Magazine Management</h1>
                        <p style={{ color: '#64748b', marginTop: '4px' }}>Create and manage monthly eBooks and their assets.</p>
                    </div>
                    <button onClick={() => setShowModal(true)} style={{ background: '#7C6FFF', color: '#fff', border: 'none', borderRadius: '12px', padding: '12px 20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(124,111,255,0.3)' }}>
                        <Plus size={20} /> Create Magazine
                    </button>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '100px' }}><Loader2 className="animate-spin" size={40} color="#7C6FFF" /></div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                        {magazines.map(mag => (
                            <div key={mag.id} style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                                <div style={{ height: '120px', background: mag.color || '#7C6FFF', padding: '20px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <div>
                                        <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', opacity: 0.8 }}>{mag.month}</div>
                                        <h3 style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: 800 }}>{mag.name}</h3>
                                    </div>
                                    {mag.featured && <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '50px', fontSize: '11px', fontWeight: 700 }}>Featured</span>}
                                </div>
                                <div style={{ padding: '20px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                        <div style={{ textAlign: 'center', padding: '12px', background: '#F8FAFC', borderRadius: '12px', border: mag.pdf_path ? '1px solid #22C55E33' : '1px solid #e2e8f0' }}>
                                            <FileText size={20} color={mag.pdf_path ? '#22C55E' : '#64748b'} style={{ marginBottom: '8px' }} />
                                            <div style={{ fontSize: '12px', fontWeight: 600 }}>PDF Content</div>
                                            <label style={{ display: 'block', marginTop: '8px', cursor: 'pointer', color: '#7C6FFF', fontSize: '11px', fontWeight: 700 }}>
                                                {uploading?.id === mag.id && uploading?.type === 'pdf' ? 'Uploading...' : (mag.pdf_path ? 'Replace PDF' : 'Upload PDF')}
                                                <input type="file" accept=".pdf" hidden onChange={(e) => handleFileUpload(mag.id, 'pdf', e.target.files[0])} />
                                            </label>
                                        </div>
                                        <div style={{ textAlign: 'center', padding: '12px', background: '#F8FAFC', borderRadius: '12px', border: mag.image ? '1px solid #22C55E33' : '1px solid #e2e8f0' }}>
                                            <ImageIcon size={20} color={mag.image ? '#22C55E' : '#64748b'} style={{ marginBottom: '8px' }} />
                                            <div style={{ fontSize: '12px', fontWeight: 600 }}>Cover Image</div>
                                            <label style={{ display: 'block', marginTop: '8px', cursor: 'pointer', color: '#7C6FFF', fontSize: '11px', fontWeight: 700 }}>
                                                {uploading?.id === mag.id && uploading?.type === 'cover' ? 'Uploading...' : (mag.image ? 'Replace Cover' : 'Upload Cover')}
                                                <input type="file" accept="image/*" hidden onChange={(e) => handleFileUpload(mag.id, 'cover', e.target.files[0])} />
                                            </label>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
                                        <strong>Topics:</strong> {mag.topics.join(', ')}
                                    </div>
                                    <div style={{ padding: '12px', background: '#F0F9FF', borderRadius: '12px', border: '1px solid #0EA5E933', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0EA5E9' }}></div>
                                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#0369A1' }}>Dedicated Quiz Linked</span>
                                        </div>
                                        <button onClick={() => window.location.href='/admin/quizzes'} style={{ background: 'none', border: 'none', color: '#0EA5E9', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>Manage Quiz →</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative' }}>
                        <h2 style={{ margin: '0 0 24px', fontSize: '24px', fontWeight: 800 }}>Create New Magazine</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Magazine Name</label>
                                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. MCQuiz April 2026" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Internal Title (Optional)</label>
                                <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Internal reference title" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Month</label>
                                <input type="month" required value={formData.month} onChange={e => setFormData({...formData, month: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Price (৳)</label>
                                <input type="number" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Total Pages</label>
                                <input type="number" required value={formData.pages} onChange={e => setFormData({...formData, pages: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Topics (Comma separated)</label>
                                <input type="text" required value={formData.topics} onChange={e => setFormData({...formData, topics: e.target.value})} placeholder="BCS, Bank Job, Geography" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                            </div>
                            <div style={{ gridColumn: 'span 2', display: 'flex', gap: '20px', alignItems: 'center' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={formData.featured} onChange={e => setFormData({...formData, featured: e.target.checked})} />
                                    <span style={{ fontSize: '14px', fontWeight: 600 }}>Featured Issue</span>
                                </label>
                                <input type="color" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} style={{ border: 'none', width: '40px', height: '30px', cursor: 'pointer' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>PDF File</label>
                                <input type="file" accept=".pdf" onChange={e => setFormData({...formData, pdf: e.target.files[0]})} style={{ width: '100%', fontSize: '12px' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Cover Image</label>
                                <input type="file" accept="image/*" onChange={e => setFormData({...formData, cover: e.target.files[0]})} style={{ width: '100%', fontSize: '12px' }} />
                            </div>
                            <div style={{ gridColumn: 'span 2', display: 'flex', gap: '12px', marginTop: '12px' }}>
                                <button type="submit" style={{ flex: 1, background: '#7C6FFF', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px', fontWeight: 700, cursor: 'pointer' }}>Save Magazine</button>
                                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, background: '#F1F5F9', color: '#64748b', border: 'none', borderRadius: '12px', padding: '14px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MagazineManager;
