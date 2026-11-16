let token = localStorage.getItem('token') || null;

window.addEventListener('DOMContentLoaded', () => {
  if (token) {
    restoreSession();
  }
});

function showMessage(msg, isError = false) {
  const box = document.getElementById('message-box');
  box.textContent = msg;
  box.className = `message ${isError ? 'error' : 'success'}`;
  box.classList.remove('hidden');
  setTimeout(() => box.classList.add('hidden'), 4000);
}

function showForm(formType) {
  const loginSection = document.getElementById('login-section');
  const regSection = document.getElementById('register-section');
  const loginBtn = document.getElementById('show-login-btn');
  const regBtn = document.getElementById('show-register-btn');

  if (formType === 'login') {
    loginSection.classList.remove('hidden');
    regSection.classList.add('hidden');
    loginBtn.classList.add('active');
    regBtn.classList.remove('active');
  } else {
    regSection.classList.remove('hidden');
    loginSection.classList.add('hidden');
    regBtn.classList.add('active');
    loginBtn.classList.remove('active');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (res.ok) {
      showMessage(`Registered successfully as ${data.user.name}`);
      loginUserSuccess(data.user, data.token);
    } else {
      showMessage(data.message || 'Registration failed', true);
    }
  } catch (err) {
    showMessage('Server error during registration', true);
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
      showMessage(`Welcome back, ${data.user.name}`);
      loginUserSuccess(data.user, data.token);
    } else {
      showMessage(data.message || 'Login failed', true);
    }
  } catch (err) {
    showMessage('Server error during login', true);
  }
}

function loginUserSuccess(user, userToken) {
  token = userToken;
  localStorage.setItem('token', token);

  document.getElementById('auth-forms').classList.add('hidden');
  document.getElementById('dashboard-section').classList.remove('hidden');

  document.getElementById('user-display-name').textContent = user.name;
  document.getElementById('user-display-email').textContent = user.email;
}

async function handleLogout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch (err) {
  }

  token = null;
  localStorage.removeItem('token');

  document.getElementById('dashboard-section').classList.add('hidden');
  document.getElementById('auth-forms').classList.remove('hidden');
  showForm('login');
  showMessage('Logged out successfully.');
}

async function restoreSession() {
  try {
    const res = await fetch('/api/auth/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok && data.success) {
      loginUserSuccess(data.user, token);
    } else {
      localStorage.removeItem('token');
      token = null;
    }
  } catch (err) {
    localStorage.removeItem('token');
    token = null;
  }
}
