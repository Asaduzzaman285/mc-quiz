import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Upload, ListTodo, Check, Loader2, Download } from 'lucide-react';

const QuizManager = () => {
    const [quizzes, setQuizzes] = useState([]);
    const [magazines, setMagazines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        magazine_id: '',
        date: '',
        deadline: '',
        resultDate: '',
        total_marks: 100,
        duration_minutes: 30
    });
    const [uploading, setUploading] = useState(null);

    const API_URL = import.meta.env.VITE_APP_API_BASE_URL + '/api/v1';
    const token = localStorage.getItem('authToken');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [quizRes, magRes] = await Promise.all([
                axios.get(`${API_URL}/quizzes`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/magazines`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setQuizzes(quizRes.data.data);
            setMagazines(magRes.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchQuizzes = async () => {
        try {
            const res = await axios.get(`${API_URL}/quizzes`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setQuizzes(res.data.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/admin/quizzes`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowModal(false);
            setFormData({
                name: '', magazine_id: '', date: '', deadline: '', resultDate: '', total_marks: 100, duration_minutes: 30
            });
            fetchQuizzes();
        } catch (err) {
            alert(err.response?.data?.message?.[0] || 'Error creating quiz');
        }
    };

    const handleCsvUpload = async (quizId, file) => {
        setUploading(quizId);
        const data = new FormData();
        data.append('file', file);

        try {
            const res = await axios.post(`${API_URL}/admin/quizzes/${quizId}/upload-questions`, data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            alert(`${res.data.data.count} questions uploaded successfully!`);
            fetchQuizzes();
        } catch (err) {
            alert('Upload failed. Check CSV format.');
        } finally {
            setUploading(null);
        }
    };

    const downloadSample = () => {
        const content = "question_text,option1,option2,option3,option4,correct_index,category\nWhat is the capital of Bangladesh?,Dhaka,Chittagong,Sylhet,Khulna,0,General Knowledge";
        const blob = new Blob([content], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "quiz_sample.csv";
        a.click();
    };

    return (
        <div style={{ padding: '24px', backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b', margin: 0 }}>Quiz Management</h1>
                        <p style={{ color: '#64748b', marginTop: '4px' }}>Schedule monthly quizzes and link them to magazines.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={downloadSample} style={{ background: '#fff', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <Download size={20} /> Sample CSV
                        </button>
                        <button onClick={() => setShowModal(true)} style={{ background: '#D4A843', color: '#fff', border: 'none', borderRadius: '12px', padding: '12px 20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(212,168,103,0.3)' }}>
                            <Plus size={20} /> Create Quiz
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '100px' }}><Loader2 className="animate-spin" size={40} color="#D4A843" /></div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
                        {quizzes.map(quiz => (
                            <div key={quiz.id} style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                                <div style={{ padding: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#FFFBEB', color: '#D4A843', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <ListTodo size={24} />
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            {quiz.magazine ? (
                                                <div style={{ fontSize: '11px', fontWeight: 800, color: '#7C6FFF', background: '#F5F3FF', padding: '4px 10px', borderRadius: '50px', display: 'inline-block' }}>{quiz.magazine.name}</div>
                                            ) : (
                                                <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', background: '#F8FAFC', padding: '4px 10px', borderRadius: '50px', display: 'inline-block' }}>No Magazine</div>
                                            )}
                                        </div>
                                    </div>

                                    <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>{quiz.name}</h3>
                                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>Deadline: {quiz.deadline}</div>

                                    <div style={{ padding: '20px', background: '#F8FAFC', borderRadius: '16px', border: '1px dashed #e2e8f0', textAlign: 'center' }}>
                                        <Upload size={24} color="#D4A843" style={{ marginBottom: '10px' }} />
                                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>Questions Content</div>
                                        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '12px' }}>Upload .csv file with 200 questions</div>

                                        <label style={{ display: 'inline-block', background: '#fff', border: '1px solid #D4A843', color: '#D4A843', borderRadius: '8px', padding: '8px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                                            {uploading === quiz.id ? 'Uploading...' : 'Browse CSV'}
                                            <input type="file" accept=".csv,.txt,text/csv,text/plain,application/vnd.ms-excel" hidden onChange={(e) => handleCsvUpload(quiz.id, e.target.files[0])} />
                                        </label>
                                    </div>

                                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                                            <strong>{quiz.duration_minutes}</strong> mins · <strong>{quiz.total_marks}</strong> pts
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#22C55E', fontWeight: 700 }}>
                                            Result: {quiz.resultDate}
                                        </div>
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
                        <h2 style={{ margin: '0 0 24px', fontSize: '24px', fontWeight: 800 }}>Schedule New Quiz</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Quiz Name</label>
                                <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Monthly Challenge April 2026" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Linked Magazine (Optional)</label>
                                <select value={formData.magazine_id} onChange={e => setFormData({ ...formData, magazine_id: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff' }}>
                                    <option value="">Select a Magazine</option>
                                    {magazines.map(mag => (
                                        <option key={mag.id} value={mag.id}>{mag.name} ({mag.month})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Quiz Date</label>
                                <input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Submission Deadline</label>
                                <input type="date" required value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Duration (Minutes)</label>
                                <input type="number" required value={formData.duration_minutes} onChange={e => setFormData({ ...formData, duration_minutes: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Total Marks</label>
                                <input type="number" required value={formData.total_marks} onChange={e => setFormData({ ...formData, total_marks: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Result Announce Date</label>
                                <input type="date" required value={formData.resultDate} onChange={e => setFormData({ ...formData, resultDate: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                            </div>
                            <div style={{ gridColumn: 'span 2', display: 'flex', gap: '12px', marginTop: '12px' }}>
                                <button type="submit" style={{ flex: 1, background: '#D4A843', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px', fontWeight: 700, cursor: 'pointer' }}>Save Quiz</button>
                                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, background: '#F1F5F9', color: '#64748b', border: 'none', borderRadius: '12px', padding: '14px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuizManager;
