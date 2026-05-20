import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Search, RefreshCw } from 'lucide-react';

const PurchasesPage = () => {
    const [purchases, setPurchases] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const API_URL = import.meta.env.VITE_APP_API_BASE_URL + '/api/v1';
    const token = localStorage.getItem('authToken');

    useEffect(() => { fetchPurchases(); }, []);

    useEffect(() => {
        let data = purchases;
        if (search) {
            const q = search.toLowerCase();
            data = data.filter(p =>
                p.user_name?.toLowerCase().includes(q) ||
                p.magazine_name?.toLowerCase().includes(q) ||
                p.transaction_id?.toLowerCase().includes(q)
            );
        }
        if (statusFilter) data = data.filter(p => p.payment_status === statusFilter);
        setFiltered(data);
    }, [search, statusFilter, purchases]);

    const fetchPurchases = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/admin/purchases`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPurchases(res.data.data || []);
        } catch (err) {
            // Fallback: fetch from users endpoint and aggregate
            console.error(err);
            setPurchases([]);
        } finally {
            setLoading(false);
        }
    };

    const statusColor = { completed: '#22C55E', pending: '#D4A843', failed: '#EF4444' };
    const statusBg = { completed: 'rgba(34,197,94,0.1)', pending: 'rgba(212,168,67,0.1)', failed: 'rgba(239,68,68,0.1)' };

    return (
        <div style={{ padding: '24px', backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b', margin: 0 }}>Purchases</h1>
                        <p style={{ color: '#64748b', marginTop: '4px' }}>All magazine purchase transactions.</p>
                    </div>
                    <button onClick={fetchPurchases} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, color: '#64748b' }}>
                        <RefreshCw size={16} /> Refresh
                    </button>
                </div>

                {/* Filters */}
                <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '16px 20px', marginBottom: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, magazine, transaction ID..."
                            style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', boxSizing: 'border-box' }} />
                    </div>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                        style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', background: '#fff', fontWeight: 600, color: '#1e293b' }}>
                        <option value="">All Status</option>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                    </select>
                    <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>{filtered.length} records</div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '80px' }}><Loader2 size={36} color="#7C6FFF" style={{ animation: 'spin 1s linear infinite' }} /></div>
                ) : filtered.length === 0 ? (
                    <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '60px', textAlign: 'center' }}>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#94a3b8' }}>No purchases found</div>
                    </div>
                ) : (
                    <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 140px 100px', padding: '13px 20px', background: '#F8FAFC', borderBottom: '1px solid #e2e8f0' }}>
                            {['User', 'Magazine', 'Amount', 'Transaction ID', 'Status'].map(h => (
                                <div key={h} style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</div>
                            ))}
                        </div>
                        {filtered.map((p, i) => (
                            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 140px 100px', padding: '14px 20px', borderBottom: i < filtered.length - 1 ? '1px solid #f1f5f9' : 'none', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>{p.user_name || '—'}</div>
                                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{p.user_email || ''}</div>
                                </div>
                                <div style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>{p.magazine_name || '—'}</div>
                                <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>৳{p.amount}</div>
                                <div style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>{p.transaction_id || '—'}</div>
                                <div>
                                    <span style={{ background: statusBg[p.payment_status] || '#f1f5f9', color: statusColor[p.payment_status] || '#64748b', padding: '4px 10px', borderRadius: '50px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                                        {p.payment_status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );
};

export default PurchasesPage;
