// ═══════════════════════════════════════════
// DASHBOARD PAGE JS
// ═══════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async () => {
  const user = await checkAuth();
  if (!user) return;
  if (!requireRole(user, 'student')) return;

  document.getElementById('navContainer').innerHTML = renderNavbar('dashboard', user.name, user.role);
  document.getElementById('welcomeMsg').textContent = `${getGreeting()}, ${user.name}! 👋`;

  await Promise.all([loadStats(), loadRecent()]);
});

async function loadStats() {
  try {
    const res = await fetch(`${window.API_BASE}/api/dashboard/stats`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load stats');
    const data = await res.json();

    document.getElementById('statBorrowed').textContent = data.borrowed_count;
    document.getElementById('statPending').textContent = data.pending_count || 0;

    const overdueEl = document.getElementById('statOverdue');
    overdueEl.textContent = data.overdue_count;
    overdueEl.className = 'stat-number ' + (data.overdue_count > 0 ? 'red' : 'green');

    document.getElementById('statAvailable').textContent = data.available_books;

    // Show alert banners
    const banners = document.getElementById('alertBanners');
    let bannerHTML = '';
    if (data.overdue_count > 0) {
      bannerHTML += `<div class="alert-banner danger">⚠️ You have ${data.overdue_count} overdue book(s). Please return them immediately!</div>`;
    }
    if (data.pending_count > 0) {
      bannerHTML += `<div class="alert-banner warning">⏳ You have ${data.pending_count} pending request(s) awaiting librarian approval.</div>`;
    }
    banners.innerHTML = bannerHTML;

  } catch (err) {
    console.error('API Error:', err);
  }
}

async function loadRecent() {
  try {
    const res = await fetch(`${window.API_BASE}/api/dashboard/recent`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load recent');
    const records = await res.json();
    const tbody = document.getElementById('recentBody');

    if (records.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:3rem;">
        <div class="empty-state"><div class="empty-icon">📚</div><h3>No activity yet</h3><p>Browse the catalog to borrow your first book!</p></div>
      </td></tr>`;
      return;
    }

    tbody.innerHTML = records.map(record => {
      const statusBadge = getStatusBadge(record.status, record.days_remaining);
      const daysDisplay = getDaysDisplay(record.status, record.days_remaining);
      return `<tr>
        <td><strong>${escapeHtml(record.title)}</strong><div style="font-size:12px;color:var(--gray);margin-top:2px;">${escapeHtml(record.author)}</div></td>
        <td>${statusBadge}</td>
        <td style="font-family:'DM Mono',monospace;font-size:13px;">${formatDate(record.borrow_date)}</td>
        <td style="font-family:'DM Mono',monospace;font-size:13px;">${formatDate(record.due_date)}</td>
        <td style="font-family:'DM Mono',monospace;font-size:13px;">${daysDisplay}</td>
      </tr>`;
    }).join('');

  } catch (err) {
    console.error('API Error:', err);
  }
}

function getStatusBadge(status, daysRemaining) {
  if (status === 'pending') return '<span class="badge badge-yellow">⏳ Pending</span>';
  if (status === 'rejected') return '<span class="badge badge-gray">✕ Rejected</span>';
  if (status === 'returned') return '<span class="badge badge-green">✓ Returned</span>';
  if (status === 'overdue' || (daysRemaining !== null && daysRemaining < 0)) return '<span class="badge badge-red">⚠️ Overdue</span>';
  if (daysRemaining !== null && daysRemaining === 0) return '<span class="badge badge-orange">⏰ Due Today</span>';
  if (daysRemaining !== null && daysRemaining <= 3) return '<span class="badge badge-orange">⏰ Due Soon</span>';
  return '<span class="badge badge-blue">📖 Borrowed</span>';
}

function getDaysDisplay(status, daysRemaining) {
  if (status === 'returned' || status === 'pending' || status === 'rejected') return '—';
  if (daysRemaining === null) return '—';
  if (daysRemaining < 0) return `<span style="color:var(--red);font-weight:600;">${Math.abs(daysRemaining)}d overdue</span>`;
  if (daysRemaining === 0) return '<span style="color:var(--orange);font-weight:600;">Today</span>';
  return `<span style="color:var(--green);">${daysRemaining}d left</span>`;
}
