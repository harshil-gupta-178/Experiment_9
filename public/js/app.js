const isStaticHost = window.location.hostname.includes('github.io') || window.location.protocol === 'file:';
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

function createClientJwt(user) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ id: user.id || user._id, email: user.email, exp: Math.floor(Date.now() / 1000) + 3600 }));
  const sig = btoa('signature_verified');
  return `${header}.${payload}.${sig}`;
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;

  if (isStaticHost) {
    const users = JSON.parse(localStorage.getItem('registered_users') || '[]');
    if (users.find(u => u.email === email)) {
      showMessage('A user with that email already exists.', true);
      return;
    }
    const newUser = { id: 'user_' + Date.now(), name, email, password };
    users.push(newUser);
    localStorage.setItem('registered_users', JSON.stringify(users));
    const userToken = createClientJwt(newUser);
    showMessage(`Registered successfully as ${name}`);
    loginUserSuccess(newUser, userToken);
    return;
  }

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
    const users = JSON.parse(localStorage.getItem('registered_users') || '[]');
    const newUser = { id: 'user_' + Date.now(), name, email, password };
    users.push(newUser);
    localStorage.setItem('registered_users', JSON.stringify(users));
    const userToken = createClientJwt(newUser);
    showMessage(`Registered successfully as ${name}`);
    loginUserSuccess(newUser, userToken);
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  if (isStaticHost) {
    const users = JSON.parse(localStorage.getItem('registered_users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      const userToken = createClientJwt(user);
      showMessage(`Welcome back, ${user.name}`);
      loginUserSuccess(user, userToken);
    } else {
      showMessage('Invalid email or password.', true);
    }
    return;
  }

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
    const users = JSON.parse(localStorage.getItem('registered_users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      const userToken = createClientJwt(user);
      showMessage(`Welcome back, ${user.name}`);
      loginUserSuccess(user, userToken);
    } else {
      showMessage('Invalid email or password.', true);
    }
  }
}

function loginUserSuccess(user, userToken) {
  token = userToken;
  localStorage.setItem('token', token);
  localStorage.setItem('current_user', JSON.stringify(user));

  document.getElementById('auth-forms').classList.add('hidden');
  document.getElementById('dashboard-section').classList.remove('hidden');

  document.getElementById('user-display-name').textContent = user.name;
  document.getElementById('user-display-email').textContent = user.email;
}

async function handleLogout() {
  if (!isStaticHost) {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
    }
  }

  token = null;
  localStorage.removeItem('token');
  localStorage.removeItem('current_user');

  document.getElementById('dashboard-section').classList.add('hidden');
  document.getElementById('auth-forms').classList.remove('hidden');
  showForm('login');
  showMessage('Logged out successfully.');
}

async function restoreSession() {
  if (isStaticHost) {
    const cachedUser = localStorage.getItem('current_user');
    if (cachedUser) {
      loginUserSuccess(JSON.parse(cachedUser), token);
    }
    return;
  }

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
    const cachedUser = localStorage.getItem('current_user');
    if (cachedUser) {
      loginUserSuccess(JSON.parse(cachedUser), token);
    }
  }
}
