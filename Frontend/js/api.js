const BACKEND_BASE_URL = 'https://complaints-registration-platform-full-fftj.onrender.com';
const API_BASE_URL = `${BACKEND_BASE_URL}/api`;

const apiFetch = async (endpoint, options = {}) => {
  options.credentials = 'include'; // Include cookies as fallback

  const token = localStorage.getItem('token');
  options.headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong');
    }

    return data;
  } catch (error) {
    throw error;
  }
};

const api = {
  auth: {
    sendOtp: (name, email) => apiFetch('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ name, email })
    }),
    register: (email, otp, password) => apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, otp, password })
    }),
    login: (email, password) => apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
    logout: () => apiFetch('/auth/logout', { method: 'POST' }),
    me: () => apiFetch('/auth/me')
  },
  complaints: {
    getAiQuestion: (complaint_text) => apiFetch('/complaints/ai/question', {
      method: 'POST',
      body: JSON.stringify({ complaint_text })
    }),
    submit: (complaint_text, ai_question, user_answer) => apiFetch('/complaints', {
      method: 'POST',
      body: JSON.stringify({ complaint_text, ai_question, user_answer })
    }),
    getMy: () => apiFetch('/complaints/my'),
    getAllAdmin: () => apiFetch('/complaints/admin/complaints')
  }
};
