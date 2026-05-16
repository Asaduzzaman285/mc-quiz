const API_BASE = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:8000';
const API_URL = `${API_BASE}/api/v1`;

const MCQUIZ_API = {
    async login(email, password) {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (data.status === 'success') {
            localStorage.setItem('mcquiz_token', data.data.user.access_token);
            return data.data;
        }
        throw new Error(data.message.join(', '));
    },

    async signup(payload) {
        const response = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (data.status === 'success') {
            localStorage.setItem('mcquiz_token', data.data.user.access_token);
            return data.data;
        }
        throw new Error(data.message.join(', '));
    },

    async getMagazines() {
        const token = localStorage.getItem('mcquiz_token');
        const response = await fetch(`${API_URL}/magazines`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        const data = await response.json();
        return data.data;
    },

    async getQuizzes() {
        const token = localStorage.getItem('mcquiz_token');
        const response = await fetch(`${API_URL}/quizzes`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        const data = await response.json();
        return data.data;
    },

    async getQuiz(id) {
        const token = localStorage.getItem('mcquiz_token');
        const response = await fetch(`${API_URL}/quizzes/${id}`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        const data = await response.json();
        return data.data;
    },

    async submitQuiz(quizId, result) {
        const token = localStorage.getItem('mcquiz_token');
        const response = await fetch(`${API_URL}/quizzes/${quizId}/submit`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify(result)
        });
        const data = await response.json();
        return data.data;
    },

    async getMe() {
        const token = localStorage.getItem('mcquiz_token');
        if (!token) return null;
        const response = await fetch(`${API_URL}/me`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        const data = await response.json();
        if (data.status === 'success') return data.data;
        return null;
    },

    async purchaseMagazine(magId) {
        const token = localStorage.getItem('mcquiz_token');
        const response = await fetch(`${API_URL}/magazines/${magId}/purchase`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        const data = await response.json();
        if (data.status === 'success') return data.data;
        throw new Error(data.message.join(', '));
    },

    async getLeaderboard() {
        const token = localStorage.getItem('mcquiz_token');
        const response = await fetch(`${API_URL}/leaderboard`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        const data = await response.json();
        return data.data;
    }
};

export default MCQUIZ_API;
