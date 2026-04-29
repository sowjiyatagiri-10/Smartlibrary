// ═══════════════════════════════════════════
// NOTIFICATION BELL & DROPDOWN
// ═══════════════════════════════════════════

let notifData = [];
let unreadCount = 0;

async function loadNotifications() {
  try {
    const res = await fetch(`${window.API_BASE}/api/notifications`, { credentials: 'include' });
    if (!res.ok) return;
    notifData = await res.json();
    unreadCount = notifData.filter(n => !n.is_read).length;
    updateBellBadge();
  } catch (e) { console.error('Notif load error:', e); }
}

async function loadUnreadCount() {
  try {
    const res = await fetch(`${window.API_BASE}/api/notifications/unread-count`, { credentials: 'include' });
    if (!res.ok) return;
    const data = await res.json();
    unreadCount = data.count || 0;
    updateBellBadge();
  } catch (e) { console.error('Unread count error:', e); }
}

function updateBellBadge() {
  const badge = document.getElementById('notifBadge');
  if (badge) {
    badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
    badge.style.display = unreadCount > 0 ? 'flex' : 'none';
  }
}

function toggleNotifDropdown() {
  const dd = document.getElementById('notifDropdown');
  if (!dd) return;
  const isOpen = dd.classList.contains('open');
  if (isOpen) {
    dd.classList.remove('open');
  } else {
    dd.classList.add('open');
    renderNotifList();
    if (notifData.length === 0) loadNotifications().then(renderNotifList);
  }
}

function renderNotifList() {
  const list = document.getElementById('notifList');
  if (!list) return;

  if (notifData.length === 0) {
    list.innerHTML = '<div class="notif-empty">No notifications yet</div>';
    return;
  }

  list.innerHTML = notifData.slice(0, 15).map(n => {
    const timeAgo = getTimeAgo(n.created_at);
    const iconMap = {
      'due_soon': '⏰', 'overdue': '⚠️', 'request_approved': '✅',
      'request_rejected': '❌', 'new_request': '📋', 'book_returned': '📗'
    };
    const icon = iconMap[n.type] || '🔔';
    return `
      <div class="notif-item ${n.is_read ? 'read' : 'unread'}" onclick="markNotifRead(${n.id}, this)">
        <div class="notif-icon">${icon}</div>
        <div class="notif-body">
          <div class="notif-title">${escapeHtml(n.title)}</div>
          <div class="notif-msg">${escapeHtml(n.message)}</div>
          <div class="notif-time">${timeAgo}</div>
        </div>
      </div>
    `;
  }).join('');
}

async function markNotifRead(id, el) {
  try {
    await fetch(`${window.API_BASE}/api/notifications/${id}/read`, { method: 'POST', credentials: 'include' });
    if (el) el.classList.remove('unread');
    if (el) el.classList.add('read');
    const notif = notifData.find(n => n.id === id);
    if (notif && !notif.is_read) {
      notif.is_read = 1;
      unreadCount = Math.max(0, unreadCount - 1);
      updateBellBadge();
    }
  } catch (e) { console.error('Mark read error:', e); }
}

async function markAllRead() {
  try {
    await fetch(`${window.API_BASE}/api/notifications/read-all`, { method: 'POST', credentials: 'include' });
    notifData.forEach(n => n.is_read = 1);
    unreadCount = 0;
    updateBellBadge();
    renderNotifList();
  } catch (e) { console.error('Mark all read error:', e); }
}

function getTimeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return then.toLocaleDateString();
}

function escapeHtml(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// Close dropdown on outside click
document.addEventListener('click', (e) => {
  const dd = document.getElementById('notifDropdown');
  const bell = document.querySelector('.notif-bell');
  if (dd && dd.classList.contains('open') && !dd.contains(e.target) && bell && !bell.contains(e.target)) {
    dd.classList.remove('open');
  }
});

// Poll for new notifications every 30s
setInterval(() => { loadUnreadCount(); }, 30000);
