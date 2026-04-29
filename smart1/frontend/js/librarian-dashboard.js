// ═══════════════════════════════════════════
// LIBRARIAN DASHBOARD JS
// ═══════════════════════════════════════════

let allStudents = [];

document.addEventListener('DOMContentLoaded', async () => {
  const user = await checkAuth();
  if (!user) return;
  if (!requireRole(user, 'librarian')) return;

  document.getElementById('navContainer').innerHTML = renderNavbar('librarian-dashboard', user.name, user.role);
  document.getElementById('welcomeMsg').textContent = `${getGreeting()}, ${user.name}! 🔑`;

  await loadLibrarianData();
});

async function loadLibrarianData() {
  await Promise.all([loadLibStats(), loadPending(), loadActive(), loadOverdue(), loadStudents()]);
}

async function loadLibStats() {
  try {
    const res = await fetch(`${window.API_BASE}/api/dashboard/librarian-stats`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed');
    const d = await res.json();
    document.getElementById('libPending').textContent = d.pending_requests;
    document.getElementById('libActive').textContent = d.active_borrows;
    document.getElementById('libOverdue').textContent = d.overdue_count;
    document.getElementById('libStudents').textContent = d.total_students;
    const tc = document.getElementById('tabPendingCount');
    if (tc) tc.textContent = d.pending_requests > 0 ? `(${d.pending_requests})` : '';
  } catch (e) { console.error('Stats error:', e); }
}

async function loadPending() {
  try {
    const res = await fetch(`${window.API_BASE}/api/borrow/requests?status=pending`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed');
    const rows = await res.json();
    const tbody = document.getElementById('pendingBody');
    if (rows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:3rem;"><div class="empty-state"><div class="empty-icon">✅</div><h3>No pending requests</h3><p>All requests have been processed</p></div></td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(r => `<tr>
      <td><strong>${esc(r.student_name)}</strong><div style="font-size:12px;color:var(--gray);">${esc(r.student_id)}</div></td>
      <td><strong>${esc(r.book_title)}</strong><div style="font-size:12px;color:var(--gray);">${esc(r.book_author)}</div></td>
      <td style="font-family:'DM Mono',monospace;font-size:13px;">${esc(r.accession_number) || '—'}</td>
      <td style="font-family:'DM Mono',monospace;font-size:13px;">${formatDate(r.request_date)}</td>
      <td><div style="display:flex;gap:8px;">
        <button class="btn btn-sm" onclick="approveRequest(${r.record_id}, this)">✓ Approve</button>
        <button class="btn btn-danger btn-sm" onclick="rejectRequest(${r.record_id}, this)">✕ Reject</button>
      </div></td>
    </tr>`).join('');
  } catch (e) { console.error('Pending error:', e); }
}

async function loadActive() {
  try {
    const res = await fetch(`${window.API_BASE}/api/borrow/requests?status=borrowed`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed');
    const rows = await res.json();
    const tbody = document.getElementById('activeBody');
    if (rows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:3rem;color:var(--gray);">No active borrows</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(r => {
      const daysDisplay = r.days_remaining !== null
        ? (r.days_remaining < 0 ? `<span style="color:var(--red);font-weight:600;">${Math.abs(r.days_remaining)}d overdue</span>`
        : r.days_remaining === 0 ? '<span style="color:var(--orange);font-weight:600;">Today</span>'
        : `<span style="color:var(--green);">${r.days_remaining}d left</span>`) : '—';
      return `<tr>
        <td><strong>${esc(r.student_name)}</strong><div style="font-size:12px;color:var(--gray);">${esc(r.student_id)}</div></td>
        <td>${esc(r.book_title)}</td>
        <td style="font-family:'DM Mono',monospace;font-size:13px;">${esc(r.accession_number) || '—'}</td>
        <td style="font-family:'DM Mono',monospace;font-size:13px;">${formatDate(r.borrow_date)}</td>
        <td style="font-family:'DM Mono',monospace;font-size:13px;">${formatDate(r.due_date)}</td>
        <td>${daysDisplay}</td>
        <td><button class="btn btn-sm btn-secondary" onclick="markReturned(${r.record_id}, this)">↩ Return</button></td>
      </tr>`;
    }).join('');
  } catch (e) { console.error('Active error:', e); }
}

async function loadOverdue() {
  try {
    const res = await fetch(`${window.API_BASE}/api/borrow/requests?status=overdue`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed');
    const rows = await res.json();
    const tbody = document.getElementById('overdueBody');
    if (rows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:3rem;"><div class="empty-state"><div class="empty-icon">✅</div><h3>No overdue books</h3><p>All books are returned on time</p></div></td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(r => {
      const overdueDays = r.days_remaining !== null ? Math.abs(r.days_remaining) : '?';
      return `<tr style="background:rgba(231,76,60,0.05);">
        <td><strong>${esc(r.student_name)}</strong><div style="font-size:12px;color:var(--gray);">${esc(r.student_id)} · ${esc(r.student_email)}</div></td>
        <td>${esc(r.book_title)}</td>
        <td style="font-family:'DM Mono',monospace;font-size:13px;">${esc(r.accession_number) || '—'}</td>
        <td style="font-family:'DM Mono',monospace;font-size:13px;">${formatDate(r.due_date)}</td>
        <td><span class="badge badge-red">⚠️ ${overdueDays} days</span></td>
        <td><button class="btn btn-danger btn-sm" onclick="markReturned(${r.record_id}, this)">↩ Return</button></td>
      </tr>`;
    }).join('');
  } catch (e) { console.error('Overdue error:', e); }
}

async function loadStudents() {
  try {
    const res = await fetch(`${window.API_BASE}/api/dashboard/all-students`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed');
    allStudents = await res.json();
    renderStudents(allStudents);
  } catch (e) { console.error('Students error:', e); }
}

function filterStudents() {
  const q = document.getElementById('studentSearch').value.trim().toLowerCase();
  const filtered = allStudents.filter(s => s.name.toLowerCase().includes(q) || s.register_id.toLowerCase().includes(q));
  renderStudents(filtered);
}

function renderStudents(students) {
  const tbody = document.getElementById('studentsBody');
  if (students.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--gray);">No students found</td></tr>';
    return;
  }
  tbody.innerHTML = students.map(s => `<tr>
    <td style="font-family:'DM Mono',monospace;font-size:13px;">${esc(s.register_id)}</td>
    <td><strong>${esc(s.name)}</strong></td>
    <td style="font-size:13px;color:var(--gray);">${esc(s.email)}</td>
    <td>${s.active_borrows > 0 ? `<span class="badge badge-blue">${s.active_borrows}</span>` : '<span style="color:var(--gray);">0</span>'}</td>
    <td>${s.overdue_count > 0 ? `<span class="badge badge-red">${s.overdue_count}</span>` : '<span style="color:var(--gray);">0</span>'}</td>
    <td>${s.pending_count > 0 ? `<span class="badge badge-yellow">${s.pending_count}</span>` : '<span style="color:var(--gray);">0</span>'}</td>
    <td>${s.total_records}</td>
  </tr>`).join('');
}

function switchTab(tabId, btn) {
  document.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tabId).style.display = 'block';
  btn.classList.add('active');
}

async function approveRequest(recordId, btn) {
  const orig = btn.innerHTML;
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';
  try {
    const res = await fetch(`${window.API_BASE}/api/borrow/approve/${recordId}`, { method: 'POST', credentials: 'include' });
    const data = await res.json();
    if (data.success) { showToast('Request approved!', 'success'); await loadLibrarianData(); }
    else { showToast(data.message || 'Failed', 'error'); btn.disabled = false; btn.innerHTML = orig; }
  } catch (e) { showToast('Server error', 'error'); btn.disabled = false; btn.innerHTML = orig; }
}

async function rejectRequest(recordId, btn) {
  const orig = btn.innerHTML;
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';
  try {
    const res = await fetch(`${window.API_BASE}/api/borrow/reject/${recordId}`, { method: 'POST', credentials: 'include' });
    const data = await res.json();
    if (data.success) { showToast('Request rejected', 'info'); await loadLibrarianData(); }
    else { showToast(data.message || 'Failed', 'error'); btn.disabled = false; btn.innerHTML = orig; }
  } catch (e) { showToast('Server error', 'error'); btn.disabled = false; btn.innerHTML = orig; }
}

async function markReturned(recordId, btn) {
  const orig = btn.innerHTML;
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';
  try {
    const res = await fetch(`${window.API_BASE}/api/borrow/mark-returned/${recordId}`, { method: 'POST', credentials: 'include' });
    const data = await res.json();
    if (data.success) { showToast('Book marked as returned!', 'success'); await loadLibrarianData(); }
    else { showToast(data.message || 'Failed', 'error'); btn.disabled = false; btn.innerHTML = orig; }
  } catch (e) { showToast('Server error', 'error'); btn.disabled = false; btn.innerHTML = orig; }
}

function esc(s) { return escapeHtml(s); }
