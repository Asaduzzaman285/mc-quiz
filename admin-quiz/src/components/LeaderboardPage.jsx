import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, Loader2, RefreshCw } from 'lucide-react';

const LeaderboardPage = () => {
    const [quizzes, setQuizzes] = useState([]);
    const [selectedQuiz, setSelectedQuiz] = useState('');
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(false);
    const [quizLoading, setQuizLoading] = useState(true);

    const API_URL = import.meta.env.VITE_APP_API_BASE_URL + '/api/v1';
    const token = localStorage.getItem('authToken');
    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        axios.get(`${API_URL}/quizzes`, { headers })
            .then(r => {
                setQuizzes(r.data.data || []);
                if (r.data.data?.length) {
                    setSelectedQuiz(r.data.data[0].id);
                }
            })
            .catch(console.error)
            .finally(() => setQuizLoading(false));
    }, []);

    useEffect(() => {
        if (!selectedQuiz) return;
        fetchLeaderboard(selectedQuiz);
    }, [selectedQuiz]);

    const fetchLeaderboard = async (quizId) => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/leaderboard?quiz_id=${quizId}`, { headers });
            setLeaderboard(res.data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const medals = { 1: '#D4A843', 2: '#A8A8B3', 3: '#CD7F32' };

    return (
        <div style={{ padding: '24px', backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b', margin: 0 }}>Leaderboard</h1>
                        <p style={{ color: '#64748b', marginTop: '4px' }}>Top 50 participants ranked by score and speed.</p>
                    </div>
                    <button onClick={() => fetchLeaderboard(selectedQuiz)} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, color: '#64748b' }}>
                        <RefreshCw size={16} /> Refresh
                    </button>
                </div>

                {/* Quiz selector */}
                <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>Select Quiz</label>
                    {quizLoading ? (
                        <div style={{ height: 40, background: '#f1f5f9', borderRadius: 8, animation: 'pulse 1.5s infinite' }} />
                    ) : (
                        <select value={selectedQuiz} onChange={e => setSelectedQuiz(e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>
                            {quizzes.map(q => (
                                <option key={q.id} value={q.id}>{q.name} — Deadline: {q.deadline}</option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Table */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '80px' }}>
                        <Loader2 size={36} color="#7C6FFF" style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                ) : leaderboard.length === 0 ? (
                    <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '60px', textAlign: 'center' }}>
                        <Trophy size={40} color="#e2e8f0" style={{ marginBottom: 16 }} />
                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#94a3b8' }}>No submissions yet</div>
                        <div style={{ fontSize: '13px', color: '#cbd5e1', marginTop: 6 }}>Results will appear here once participants submit the quiz.</div>
                    </div>
                ) : (
                    <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        {/* Table header */}
                        <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 100px 120px 120px 120px', padding: '14px 24px', background: '#F8FAFC', borderBottom: '1px solid #e2e8f0' }}>
                            {['Rank', 'Participant', 'Score', 'Time (s)', 'District', 'Prize'].map(h => (
                                <div key={h} style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
                            ))}
                        </div>
                        {leaderboard.map((p, i) => {
                            const mc = medals[p.rank];
                            return (
                                <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 100px 120px 120px 120px', padding: '14px 24px', borderBottom: i < leaderboard.length - 1 ? '1px solid #f1f5f9' : 'none', background: p.rank <= 3 ? `${mc}08` : 'transparent', alignItems: 'center' }}>
                                    <div style={{ fontWeight: 800, fontSize: 15, color: mc || '#64748b' }}>
                                        {p.rank <= 3 ? ['🥇', '🥈', '🥉'][p.rank - 1] : `#${p.rank}`}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: mc ? `${mc}20` : '#F5F3FF', border: `1px solid ${mc ? mc + '40' : '#e2e8f0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: mc || '#7C6FFF', flexShrink: 0 }}>
                                            {p.avatar || (p.display_name || p.name || '?')[0]}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>{p.display_name || p.name}</div>
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: 800, fontSize: 15, color: '#7C6FFF' }}>{p.correct_count ?? p.score}</div>
                                    <div style={{ fontSize: 14, color: '#64748b' }}>{p.time_taken_seconds ?? '—'}s</div>
                                    <div style={{ fontSize: 13, color: '#64748b' }}>{p.district || '—'}</div>
                                    <div style={{ fontWeight: 700, fontSize: 13, color: p.prize && p.prize !== '—' ? '#D4A843' : '#94a3b8' }}>{p.prize || '—'}</div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
        </div>
    );
};

export default LeaderboardPage;
