// ═══════════════════════════════════════════
// SETUP PASSWORD PAGE JS
// ═══════════════════════════════════════════

const params = new URLSearchParams(window.location.search);
const registerId = params.get('id') || '';

document.addEventListener('DOMContentLoaded', () => {
  if (!registerId) {
    window.location.href = 'index.html';
    return;
  }
  document.getElementById('regIdDisplay').textContent = registerId;
});

function togglePwField(fieldId, btnEl) {
  const field = document.getElementById(fieldId);
  if (field.type === 'password') {
    field.type = 'text';
    btnEl.textContent = '🙈';
  } else {
    field.type = 'password';
    btnEl.textContent = '👁';
  }
}

function checkStrength() {
  const pw = document.getElementById('newPassword').value;
  const fill = document.getElementById('strengthFill');
  const label = document.getElementById('strengthLabel');

  if (pw.length === 0) {
    fill.style.width = '0%';
    fill.style.background = 'transparent';
    label.textContent = '';
    return;
  }

  const hasNumber = /\d/.test(pw);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw);

  if (pw.length < 8) {
    fill.style.width = '33%';
    fill.style.background = '#E74C3C';
    label.textContent = 'Weak — at least 8 characters needed';
    label.style.color = '#E74C3C';
  } else if (!hasNumber || !hasSpecial) {
    fill.style.width = '66%';
    fill.style.background = '#E67E22';
    label.textContent = 'Medium — add numbers and special characters';
    label.style.color = '#E67E22';
  } else {
    fill.style.width = '100%';
    fill.style.background = '#2ECC71';
    label.textContent = 'Strong password';
    label.style.color = '#2ECC71';
  }
}

async function setupPassword() {
  const newPw = document.getElementById('newPassword').value;
  const confirmPw = document.getElementById('confirmPassword').value;
  const errorEl = document.getElementById('setupError');
  const btn = document.getElementById('setupBtn');

  errorEl.style.display = 'none';

  if (!newPw || !confirmPw) {
    errorEl.textContent = 'Please fill in both password fields.';
    errorEl.style.display = 'block';
    return;
  }

  if (newPw.length < 8) {
    errorEl.textContent = 'Password must be at least 8 characters.';
    errorEl.style.display = 'block';
    return;
  }

  if (newPw !== confirmPw) {
    errorEl.textContent = 'Passwords do not match.';
    errorEl.style.display = 'block';
    return;
  }

  btn.dataset.originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';

  try {
    // Step 1: Set the password
    const setupRes = await fetch(`${window.API_BASE}/api/auth/setup-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ register_id: registerId, password: newPw })
    });

    const setupData = await setupRes.json();

    if (!setupData.success) {
      btn.disabled = false;
      btn.innerHTML = btn.dataset.originalText;
      errorEl.textContent = setupData.message || 'Failed to set password.';
      errorEl.style.display = 'block';
      return;
    }

    // Step 2: Auto-login
    const loginRes = await fetch(`${window.API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ register_id: registerId, password: newPw })
    });

    const loginData = await loginRes.json();

    if (loginData.success) {
      window.location.href = 'dashboard.html';
    } else {
      btn.disabled = false;
      btn.innerHTML = btn.dataset.originalText;
      errorEl.textContent = 'Password set but login failed. Please log in manually.';
      errorEl.style.display = 'block';
      setTimeout(() => { window.location.href = 'index.html'; }, 2000);
    }

  } catch (err) {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.originalText;
    console.error('API Error:', err);
    showError('Cannot connect to server. Please try again later.');
  }
}

// Enter key support
document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    setupPassword();
  }
});
