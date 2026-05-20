const API_BASE = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:8000';
const API_URL = `${API_BASE}/api/v1`;

const authHeaders = () => ({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('mcquiz_token') || ''}`,
});

async function apiCall(url, options = {}) {
    const res = await fetch(url, options);
    const data = await res.json();
    return data;
}

const MCQUIZ_API = {

    // ── Auth ──────────────────────────────────────────────────────────────────

    async login(email, password) {
        const data = await apiCall(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        if (data.status === 'success') {
            localStorage.setItem('mcquiz_token', data.data.user.access_token);
            return data.data;
        }
        throw new Error(Array.isArray(data.message) ? data.message.join(', ') : (data.message || 'Login failed'));
    },

    async signup(payload) {
        const data = await apiCall(`${API_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (data.status === 'success') {
            localStorage.setItem('mcquiz_token', data.data.user.access_token);
            return data.data;
        }
        throw new Error(Array.isArray(data.message) ? data.message.join(', ') : (data.message || 'Signup failed'));
    },

    async getMe() {
        const token = localStorage.getItem('mcquiz_token');
        if (!token) return null;
        const data = await apiCall(`${API_URL}/me`, {
            method: 'POST',
            headers: authHeaders(),
        });
        if (data.status === 'success') return data.data;
        return null;
    },

    async logout() {
        await apiCall(`${API_URL}/logout`, {
            method: 'POST',
            headers: authHeaders(),
        });
        localStorage.removeItem('mcquiz_token');
    },

    // ── Magazines ─────────────────────────────────────────────────────────────

    async getMagazines() {
        const data = await apiCall(`${API_URL}/magazines`, { headers: authHeaders() });
        return data.data || [];
    },

    async downloadMagazine(magId, magName) {
        const token = localStorage.getItem('mcquiz_token');
        if (!token) return;
        const base = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:8000';
        const url = `${base}/api/v1/magazines/${magId}/download`;
        try {
            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                const msg = Array.isArray(data.message) ? data.message.join(', ') : (data.message || 'Download failed');
                alert(msg);
                return;
            }
            const blob = await res.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = `MCQuiz_${magName || magId}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            alert('Download failed. Please try again.');
        }
    },

    async getMagazine(id) {
        const data = await apiCall(`${API_URL}/magazines/${id}`, { headers: authHeaders() });
        return data.data;
    },

    async purchaseMagazine(magId) {
        const data = await apiCall(`${API_URL}/magazines/${magId}/purchase`, {
            method: 'POST',
            headers: authHeaders(),
        });
        if (data.status === 'success') return data.data;
        throw new Error(Array.isArray(data.message) ? data.message.join(', ') : (data.message || 'Purchase failed'));
    },

    // ── Quizzes ───────────────────────────────────────────────────────────────

    async getQuizzes() {
        const data = await apiCall(`${API_URL}/quizzes`, { headers: authHeaders() });
        return data.data || [];
    },

    async getQuiz(id) {
        const data = await apiCall(`${API_URL}/quizzes/${id}`, { headers: authHeaders() });
        return data.data;
    },

    async getActiveQuiz() {
        const data = await apiCall(`${API_URL}/active-quiz`, { headers: authHeaders() });
        return data.data;
    },

    /**
     * Start a quiz session — returns { session_id, questions, duration_seconds, started_at }
     */
    async startQuiz(quizId) {
        const data = await apiCall(`${API_URL}/quiz/start`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ quiz_id: quizId }),
        });
        if (data.status === 'success') return data.data;
        throw new Error(Array.isArray(data.message) ? data.message.join(', ') : (data.message || 'Failed to start quiz'));
    },

    /**
     * Submit quiz answers
     * answers: [{ question_id, selected_option (0-3 index) }]
     */
    async submitQuiz(sessionId, answers) {
        const data = await apiCall(`${API_URL}/quiz/submit`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ session_id: sessionId, answers }),
        });
        if (data.status === 'success') return data.data;
        throw new Error(Array.isArray(data.message) ? data.message.join(', ') : (data.message || 'Submit failed'));
    },

    // ── Leaderboard ───────────────────────────────────────────────────────────

    async getLeaderboard(quizId = null) {
        const url = quizId
            ? `${API_URL}/leaderboard?quiz_id=${quizId}`
            : `${API_URL}/leaderboard`;
        const data = await apiCall(url, { headers: authHeaders() });
        return data.data || [];
    },
};

export default MCQUIZ_API;
