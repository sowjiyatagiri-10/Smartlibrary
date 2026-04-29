// ═══════════════════════════════════════════
// MY BOOKS PAGE JS
// ═══════════════════════════════════════════

let myRecords = [];
let pendingReturnId = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = await checkAuth();
  if (!user) return;
  if (!requireRole(user, 'student')) return;
  document.getElementById('navContainer').innerHTML = renderNavbar('mybooks', user.name, user.role);
  await loadMyBooks();
});

async function loadMyBooks() {
  try {
    const res = await fetch(`${window.API_BASE}/api/borrow/mybooks`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load books');
    myRecords = await res.json();
    renderSummary();
    renderTable();
  } catch (err) {
    console.error('API Error:', err);
    document.getElementById('booksBody').innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--red);">Failed to load books.</td></tr>`;
  }
}

function renderSummary() {
  const borrowed = myRecords.filter(r => r.status === 'borrowed' || r.status === 'overdue').length;
  const pending = myRecords.filter(r => r.status === 'pending').length;
  const overdue = myRecords.filter(r => r.status === 'overdue').length;
  document.getElementById('sumBorrowed').textContent = borrowed;
  document.getElementById('sumPending').textContent = pending;
  document.getElementById('sumOverdue').textContent = overdue;
  document.getElementById('sumTotal').textContent = myRecords.length;
  const overdueEl = document.getElementById('sumOverdue');
  overdueEl.className = 'summary-number ' + (overdue > 0 ? 'red' : 'green');
}

function renderTable() {
  const tbody = document.getElementById('booksBody');
  if (myRecords.length === 0) {
    document.getElementById('booksTableWrap').innerHTML = `<div class="empty-state"><div class="empty-icon">📚</div><h3>No books yet</h3><p>You haven't borrowed any books. Browse the catalog!</p><a href="catalog.html" class="btn" style="width:auto;display:inline-flex;">Browse Catalog →</a></div>`;
    return;
  }

  tbody.innerHTML = myRecords.map((r, i) => {
    const statusBadge = getMyBooksStatusBadge(r.status, r.days_remaining);
    const actionBtn = getActionButton(r);
    const dateInfo = r.status === 'pending' ? `<div style="font-size:12px;color:var(--gray);">Requested ${formatDate(r.request_date)}</div>`
      : r.status === 'rejected' ? `<div style="font-size:12px;color:var(--gray);">Requested ${formatDate(r.request_date)}</div>`
      : `<div style="font-size:12px;color:var(--gray);">${formatDate(r.borrow_date)} → ${formatDate(r.due_date)}</div>
         ${r.return_date ? `<div style="font-size:11px;color:var(--green);">Returned ${formatDate(r.return_date)}</div>` : ''}
         ${r.days_remaining !== null && r.status !== 'returned' ? `<div style="font-size:11px;color:${r.days_remaining < 0 ? 'var(--red)' : 'var(--green)'};">${r.days_remaining < 0 ? Math.abs(r.days_remaining) + 'd overdue' : r.days_remaining + 'd left'}</div>` : ''}`;

    return `<tr>
      <td style="color:var(--gray);font-family:'DM Mono',monospace;font-size:13px;">${i + 1}</td>
      <td><strong>${escapeHtml(r.title)}</strong><div style="font-size:12px;color:var(--gray);">${escapeHtml(r.author)}</div></td>
      <td style="font-family:'DM Mono',monospace;font-size:13px;">${escapeHtml(r.accession_number) || '—'}</td>
      <td>${statusBadge}</td>
      <td>${dateInfo}</td>
      <td>${actionBtn}</td>
    </tr>`;
  }).join('');
}

function getMyBooksStatusBadge(status, daysRemaining) {
  if (status === 'pending') return '<span class="badge badge-yellow">⏳ Pending</span>';
  if (status === 'rejected') return '<span class="badge badge-gray">✕ Rejected</span>';
  if (status === 'returned') return '<span class="badge badge-green">✓ Returned</span>';
  if (status === 'overdue') return `<span class="badge badge-red">⚠️ Overdue${daysRemaining !== null ? ' ' + Math.abs(daysRemaining) + 'd' : ''}</span>`;
  if (daysRemaining !== null && daysRemaining === 0) return '<span class="badge badge-orange">⏰ Due Today</span>';
  if (daysRemaining !== null && daysRemaining <= 3 && daysRemaining > 0) return `<span class="badge badge-orange">⏰ Due in ${daysRemaining}d</span>`;
  return '<span class="badge badge-blue">📖 Borrowed</span>';
}

function getActionButton(record) {
  if (record.status === 'returned' || record.status === 'rejected' || record.status === 'pending') return '<span style="color:var(--gray);font-size:13px;">—</span>';
  if (record.status === 'overdue') return `<button class="btn btn-danger btn-sm" onclick="openReturnModal(${record.record_id}, '${escapeJsString(record.title)}')">Return Now</button>`;
  return `<button class="btn btn-sm" onclick="openReturnModal(${record.record_id}, '${escapeJsString(record.title)}')">Return Book</button>`;
}

function openReturnModal(recordId, bookTitle) {
  pendingReturnId = recordId;
  document.getElementById('returnModalMsg').textContent = `Return "${bookTitle}"?`;
  document.getElementById('returnConfirmBtn').disabled = false;
  document.getElementById('returnConfirmBtn').innerHTML = 'Return Book';
  document.getElementById('returnModal').style.display = 'flex';
}

function closeReturnModal() {
  document.getElementById('returnModal').style.display = 'none';
  pendingReturnId = null;
}

async function confirmReturn() {
  if (!pendingReturnId) return;
  const btn = document.getElementById('returnConfirmBtn');
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';
  try {
    const res = await fetch(`${window.API_BASE}/api/borrow/return/${pendingReturnId}`, { method: 'POST', credentials: 'include' });
    const data = await res.json();
    if (data.success) { showToast('Book returned!', 'success'); closeReturnModal(); await loadMyBooks(); }
    else { showToast(data.message || 'Failed', 'error'); btn.disabled = false; btn.innerHTML = 'Return Book'; }
  } catch (e) { showToast('Server error', 'error'); btn.disabled = false; btn.innerHTML = 'Return Book'; }
}

document.addEventListener('click', (e) => { if (e.target.id === 'returnModal') closeReturnModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeReturnModal(); });

function escapeJsString(str) { return str.replace(/'/g, "\\'").replace(/"/g, '\\"'); }
