// ═══════════════════════════════════════════
// SHARED AUTH & UTILITY FUNCTIONS
// ═══════════════════════════════════════════

async function checkAuth() {
  try {
    const res = await fetch(`${window.API_BASE}/api/auth/me`, { credentials: 'include' });
    if (!res.ok) {
      window.location.href = 'index.html';
      return null;
    }
    const data = await res.json();
    try { sessionStorage.setItem('loggedUser', JSON.stringify(data.user)); } catch (e) {}
    return data.user;
  } catch (err) {
    console.error('API Error:', err);
    window.location.href = 'index.html';
    return null;
  }
}

function requireRole(user, role) {
  if (!user || user.role !== role) {
    const target = user && user.role === 'librarian' ? 'librarian-dashboard.html' : 'dashboard.html';
    window.location.href = target;
    return false;
  }
  return true;
}

function setSessionUser(user) {
  try { sessionStorage.setItem('loggedUser', JSON.stringify(user)); } catch (e) {}
}

function getSessionUser() {
  try { return JSON.parse(sessionStorage.getItem('loggedUser') || 'null'); } catch (e) { return null; }
}

function clearSessionUser() {
  try { sessionStorage.removeItem('loggedUser'); } catch (e) {}
}

async function logout() {
  try {
    await fetch(`${window.API_BASE}/api/auth/logout`, { method: 'POST', credentials: 'include' });
  } catch (err) {}
  clearSessionUser();
  window.location.href = 'index.html';
}

function getActivePageFromPath() {
  const p = window.location.pathname.split('/').pop();
  if (!p) return 'dashboard';
  if (p.includes('librarian')) return 'librarian-dashboard';
  if (p.includes('catalog')) return 'catalog';
  if (p.includes('mybooks')) return 'mybooks';
  if (p.includes('dashboard')) return 'dashboard';
  return '';
}

function showToast(message, type = 'info') {
  const existing = document.querySelectorAll('.toast');
  existing.forEach(t => t.remove());
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
  toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span> ${message}`;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function showLoading(buttonEl) {
  if (!buttonEl) return;
  buttonEl.dataset.originalText = buttonEl.innerHTML;
  buttonEl.disabled = true;
  buttonEl.innerHTML = '<span class="spinner"></span>';
}

function hideLoading(buttonEl, originalText) {
  if (!buttonEl) return;
  buttonEl.disabled = false;
  buttonEl.innerHTML = originalText || buttonEl.dataset.originalText || 'Submit';
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function renderNavbar(activePage, userName, role) {
  const initials = getInitials(userName);
  const isLibrarian = role === 'librarian';

  const studentLinks = `
    <li><a href="dashboard.html" class="${activePage === 'dashboard' ? 'active' : ''}">Dashboard</a></li>
    <li><a href="catalog.html" class="${activePage === 'catalog' ? 'active' : ''}">Catalog</a></li>
    <li><a href="mybooks.html" class="${activePage === 'mybooks' ? 'active' : ''}">My Books</a></li>
  `;

  const librarianLinks = `
    <li><a href="librarian-dashboard.html" class="${activePage === 'librarian-dashboard' ? 'active' : ''}">Dashboard</a></li>
    <li><a href="catalog.html" class="${activePage === 'catalog' ? 'active' : ''}">Catalog</a></li>
  `;

  const mobileStudentLinks = `
    <a href="dashboard.html" class="${activePage === 'dashboard' ? 'active' : ''}">Dashboard</a>
    <a href="catalog.html" class="${activePage === 'catalog' ? 'active' : ''}">Catalog</a>
    <a href="mybooks.html" class="${activePage === 'mybooks' ? 'active' : ''}">My Books</a>
  `;

  const mobileLibrarianLinks = `
    <a href="librarian-dashboard.html" class="${activePage === 'librarian-dashboard' ? 'active' : ''}">Dashboard</a>
    <a href="catalog.html" class="${activePage === 'catalog' ? 'active' : ''}">Catalog</a>
  `;

  return `
    <nav class="navbar">
      <a href="${isLibrarian ? 'librarian-dashboard.html' : 'dashboard.html'}" class="nav-logo">📚 SRKR Library</a>
      <ul class="nav-links">
        ${isLibrarian ? librarianLinks : studentLinks}
      </ul>
      <div class="nav-right">
        <div class="notif-bell" onclick="toggleNotifDropdown()">
          🔔
          <span class="notif-badge" id="notifBadge" style="display:none;">0</span>
          <div class="notif-dropdown" id="notifDropdown">
            <div class="notif-header">
              <span>Notifications</span>
              <button class="notif-mark-all" onclick="event.stopPropagation(); markAllRead();">Mark all read</button>
            </div>
            <div class="notif-list" id="notifList">
              <div class="notif-empty">Loading...</div>
            </div>
          </div>
        </div>
        ${isLibrarian ? '<span class="role-badge">Librarian</span>' : ''}
        <div class="nav-avatar">${initials}</div>
        <span class="nav-user-name">${userName || ''}</span>
        <a href="#" class="nav-logout" onclick="event.preventDefault(); logout();">Logout</a>
      </div>
      <button class="hamburger" onclick="toggleMobileMenu()" aria-label="Menu">☰</button>
    </nav>
    <div class="mobile-menu" id="mobileMenu">
      ${isLibrarian ? mobileLibrarianLinks : mobileStudentLinks}
      <a href="#" onclick="event.preventDefault(); logout();" style="color:var(--red);">Logout</a>
    </div>
  `;
}

function toggleMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  if (menu) menu.classList.toggle('open');
}

document.addEventListener('click', (e) => {
  const menu = document.getElementById('mobileMenu');
  const hamburger = document.querySelector('.hamburger');
  if (menu && menu.classList.contains('open') && !menu.contains(e.target) && hamburger && !hamburger.contains(e.target)) {
    menu.classList.remove('open');
  }
});

function getCoverClass(category) {
  const map = {
    'Technology': 'cover-technology', 'Mathematics': 'cover-mathematics',
    'Science': 'cover-science', 'Biography': 'cover-biography', 'Fiction': 'cover-fiction'
  };
  return map[category] || 'cover-technology';
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Auto-load notifications after navbar renders
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (typeof loadUnreadCount === 'function') loadUnreadCount();
    if (typeof loadNotifications === 'function') loadNotifications();
  }, 500);
});
