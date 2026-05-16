// State
let currentUser = null;
let currentComplaintText = '';
let currentAiQuestion = '';

// DOM Elements
const views = document.querySelectorAll('.view');
const navMenu = document.getElementById('nav-menu');
const alertContainer = document.getElementById('alert-container');

// Forms
const formSendOtp = document.getElementById('form-send-otp');
const formVerifyOtp = document.getElementById('form-verify-otp');
const formLogin = document.getElementById('form-login');
const formComplaintText = document.getElementById('form-complaint-text');
const formComplaintFinal = document.getElementById('form-complaint-final');

// App Initialization
const init = async () => {
  setupEventListeners();
  try {
    const user = await api.auth.me();
    currentUser = user;
    if (user.role === 'admin') {
      navigate('admin');
    } else {
      navigate('dashboard');
    }
  } catch (error) {
    navigate('login');
  }
};

// Navigation
const navigate = (viewId) => {
  // Hide all
  views.forEach(v => v.classList.add('hidden'));
  
  // Show target
  const targetView = document.getElementById(`view-${viewId}`);
  if (targetView) targetView.classList.remove('hidden');

  updateNav();
  
  // View specific logic
  if (viewId === 'dashboard') loadUserDashboard();
  if (viewId === 'admin') loadAdminDashboard();
  if (viewId === 'submit-complaint') resetComplaintForm();
};

const updateNav = () => {
  if (!currentUser) {
    navMenu.innerHTML = `
      <a data-route="login">Login</a>
      <a data-route="register">Register</a>
    `;
  } else {
    navMenu.innerHTML = `
      <span style="color: var(--text-muted); margin-right: 1rem;">Hi, ${currentUser.name}</span>
      ${currentUser.role === 'admin' 
        ? '<a data-route="admin">Admin Dashboard</a>' 
        : '<a data-route="dashboard">My Complaints</a>'}
      <a data-route="logout">Logout</a>
    `;
  }
};

// Event Listeners
const setupEventListeners = () => {
  document.addEventListener('click', async (e) => {
    const route = e.target.getAttribute('data-route');
    if (route) {
      e.preventDefault();
      if (route === 'logout') {
        await handleLogout();
      } else {
        navigate(route);
      }
    }
  });

  formSendOtp.addEventListener('submit', handleSendOtp);
  formVerifyOtp.addEventListener('submit', handleVerifyOtp);
  formLogin.addEventListener('submit', handleLogin);
  formComplaintText.addEventListener('submit', handleComplaintStep1);
  formComplaintFinal.addEventListener('submit', handleComplaintStep2);
};

// Handlers
const handleSendOtp = async (e) => {
  e.preventDefault();
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  
  const btn = e.target.querySelector('button');
  btn.textContent = 'Sending...';
  btn.disabled = true;

  try {
    await api.auth.sendOtp(name, email);
    showAlert('OTP sent to your email!', 'success');
    document.getElementById('register-step-1').classList.add('hidden');
    document.getElementById('register-step-2').classList.remove('hidden');
  } catch (err) {
    showAlert(err.message, 'error');
  } finally {
    btn.textContent = 'Send OTP';
    btn.disabled = false;
  }
};

const handleVerifyOtp = async (e) => {
  e.preventDefault();
  const email = document.getElementById('reg-email').value;
  const otp = document.getElementById('reg-otp').value;
  const password = document.getElementById('reg-password').value;
  const confirmPassword = document.getElementById('reg-confirm-password').value;

  if (password !== confirmPassword) {
    return showAlert('Passwords do not match', 'error');
  }

  const btn = e.target.querySelector('button');
  btn.textContent = 'Verifying...';
  btn.disabled = true;

  try {
    await api.auth.register(email, otp, password);
    showAlert('Registration successful! Please login.', 'success');
    navigate('login');
  } catch (err) {
    showAlert(err.message, 'error');
  } finally {
    btn.textContent = 'Complete Registration';
    btn.disabled = false;
  }
};

const handleLogin = async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  const btn = e.target.querySelector('button');
  btn.textContent = 'Logging in...';
  btn.disabled = true;

  try {
    const user = await api.auth.login(email, password);
    if (user.token) localStorage.setItem('token', user.token);
    currentUser = user;
    if (user.role === 'admin') navigate('admin');
    else navigate('dashboard');
  } catch (err) {
    showAlert(err.message, 'error');
  } finally {
    btn.textContent = 'Login';
    btn.disabled = false;
  }
};

const handleLogout = async () => {
  try {
    await api.auth.logout();
    localStorage.removeItem('token');
    currentUser = null;
    navigate('login');
  } catch (err) {
    showAlert(err.message, 'error');
  }
};

const handleComplaintStep1 = async (e) => {
  e.preventDefault();
  currentComplaintText = document.getElementById('complaint-text').value;

  const btn = e.target.querySelector('button');
  btn.textContent = 'Generating AI follow-up...';
  btn.disabled = true;

  try {
    const { ai_question } = await api.complaints.getAiQuestion(currentComplaintText);
    currentAiQuestion = ai_question;
    
    document.getElementById('ai-question-display').textContent = ai_question;
    document.getElementById('complaint-step-1').classList.add('hidden');
    document.getElementById('complaint-step-2').classList.remove('hidden');
  } catch (err) {
    showAlert(err.message, 'error');
  } finally {
    btn.textContent = 'Next Step';
    btn.disabled = false;
  }
};

const handleComplaintStep2 = async (e) => {
  e.preventDefault();
  const answer = document.getElementById('user-answer').value;

  const btn = e.target.querySelector('button');
  btn.textContent = 'Submitting...';
  btn.disabled = true;

  try {
    await api.complaints.submit(currentComplaintText, currentAiQuestion, answer);
    showAlert('Complaint submitted successfully!', 'success');
    navigate('dashboard');
  } catch (err) {
    showAlert(err.message, 'error');
  } finally {
    btn.textContent = 'Submit Complete Complaint';
    btn.disabled = false;
  }
};

// UI Helpers
const showAlert = (message, type = 'success') => {
  const alert = document.createElement('div');
  alert.className = `alert ${type}`;
  alert.textContent = message;
  
  alertContainer.appendChild(alert);
  
  setTimeout(() => {
    alert.style.opacity = '0';
    setTimeout(() => alert.remove(), 300);
  }, 4000);
};

const resetComplaintForm = () => {
  document.getElementById('form-complaint-text').reset();
  document.getElementById('form-complaint-final').reset();
  document.getElementById('complaint-step-1').classList.remove('hidden');
  document.getElementById('complaint-step-2').classList.add('hidden');
  currentComplaintText = '';
  currentAiQuestion = '';
};

// Load Data
const loadUserDashboard = async () => {
  const container = document.getElementById('user-complaints-list');
  container.innerHTML = '<p class="loading">Loading complaints...</p>';
  
  try {
    const complaints = await api.complaints.getMy();
    if (complaints.length === 0) {
      container.innerHTML = '<p>You have no complaints yet.</p>';
      return;
    }
    
    container.innerHTML = complaints.map(renderComplaintCard).join('');
  } catch (err) {
    container.innerHTML = `<p class="error-text">Failed to load complaints: ${err.message}</p>`;
  }
};

const loadAdminDashboard = async () => {
  const container = document.getElementById('admin-complaints-list');
  container.innerHTML = '<p class="loading">Loading all complaints...</p>';
  
  try {
    const complaints = await api.complaints.getAllAdmin();
    if (complaints.length === 0) {
      container.innerHTML = '<p>No complaints in the system.</p>';
      return;
    }
    
    container.innerHTML = complaints.map(renderAdminComplaintCard).join('');
  } catch (err) {
    container.innerHTML = `<p class="error-text">Failed to load complaints: ${err.message}</p>`;
  }
};

const renderComplaintCard = (c) => `
  <div class="complaint-item">
    <div class="complaint-header">
      <span>Submitted: ${new Date(c.created_at).toLocaleDateString()}</span>
    </div>
    <div class="original-complaint">
      <p>${c.complaint_text}</p>
    </div>
    <div class="qa-pair">
      <div class="q-label">AI Follow-up:</div>
      <p>${c.ai_question || 'N/A'}</p>
      <div class="a-label">Your Answer:</div>
      <p>${c.user_answer || 'N/A'}</p>
    </div>
  </div>
`;

const renderAdminComplaintCard = (c) => `
  <div class="complaint-item">
    <div class="complaint-header">
      <span><strong>User:</strong> ${c.user_name} (${c.user_email})</span>
      <span>${new Date(c.created_at).toLocaleDateString()}</span>
    </div>
    <div class="original-complaint">
      <p>${c.complaint_text}</p>
    </div>
    <div class="qa-pair">
      <div class="q-label">AI Follow-up:</div>
      <p>${c.ai_question || 'N/A'}</p>
      <div class="a-label">User Answer:</div>
      <p>${c.user_answer || 'N/A'}</p>
    </div>
  </div>
`;

// Start
document.addEventListener('DOMContentLoaded', init);
