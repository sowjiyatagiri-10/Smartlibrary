// ═══════════════════════════════════════════
// CATALOG PAGE JS
// ═══════════════════════════════════════════

let allBooks = [];
let filteredBooks = [];
let borrowedBookIds = [];
let pendingBookIds = [];
let currentCategory = 'All';
let currentSearch = '';
let currentPage = 1;
const BOOKS_PER_PAGE = 12;
let pendingBorrowBookId = null;
let currentUserRole = 'student';

document.addEventListener('DOMContentLoaded', async () => {
  const user = await checkAuth();
  if (!user) return;
  currentUserRole = user.role;

  document.getElementById('navContainer').innerHTML = renderNavbar(
    'catalog', user.name, user.role
  );

  await Promise.all([loadBooks(), loadMyBorrows()]);
  applyFilters();
});

async function loadBooks() {
  try {
    const res = await fetch(`${window.API_BASE}/api/books`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load books');
    allBooks = await res.json();
  } catch (err) {
    console.error('API Error:', err);
  }
}

async function loadMyBorrows() {
  try {
    const res = await fetch(`${window.API_BASE}/api/borrow/mybooks`, { credentials: 'include' });
    if (!res.ok) return;
    const records = await res.json();
    borrowedBookIds = records.filter(r => r.status === 'borrowed' || r.status === 'overdue').map(r => r.book_id);
    pendingBookIds = records.filter(r => r.status === 'pending').map(r => r.book_id);
  } catch (err) { console.error('API Error:', err); }
}

function handleSearch() {
  currentSearch = document.getElementById('searchInput').value.trim().toLowerCase();
  currentPage = 1;
  applyFilters();
}

function selectCategory(category, el) {
  currentCategory = category;
  currentPage = 1;
  document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  applyFilters();
}

function applyFilters() {
  filteredBooks = allBooks.filter(book => {
    const matchCategory = currentCategory === 'All' || book.category === currentCategory;
    const matchSearch = !currentSearch || book.title.toLowerCase().includes(currentSearch) || book.author.toLowerCase().includes(currentSearch);
    return matchCategory && matchSearch;
  });
  document.getElementById('resultCount').textContent = `Showing ${filteredBooks.length} book${filteredBooks.length !== 1 ? 's' : ''}`;
  renderBooks();
  renderPagination();
}

function renderBooks() {
  const grid = document.getElementById('bookGrid');
  const start = (currentPage - 1) * BOOKS_PER_PAGE;
  const pageBooks = filteredBooks.slice(start, start + BOOKS_PER_PAGE);

  if (pageBooks.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;"><div class="empty-state"><div class="empty-icon">🔍</div><h3>No books found</h3><p>Try adjusting your search or category filter</p></div></div>`;
    return;
  }

  grid.innerHTML = pageBooks.map(book => {
    const coverClass = getCoverClass(book.category);
    const firstLetter = book.title.charAt(0).toUpperCase();
    const isAvailable = book.available_copies > 0;
    const isBorrowed = borrowedBookIds.includes(book.id);
    const isPending = pendingBookIds.includes(book.id);

    let availBadge = isAvailable
      ? `<span class="badge badge-green">✓ Available (${book.available_copies})</span>`
      : '<span class="badge badge-red">✗ Not Available</span>';

    let btnHTML = '';
    if (isBorrowed) {
      btnHTML = '<button class="btn" disabled>Already Borrowed</button>';
    } else if (isPending) {
      btnHTML = '<button class="btn" disabled style="background:var(--orange);color:#fff;">⏳ Request Pending</button>';
    } else if (!isAvailable) {
      btnHTML = '<button class="btn" disabled>Not Available</button>';
    } else {
      btnHTML = `<button class="btn" onclick="openBorrowModal(${book.id}, '${escapeJsString(book.title)}')">📋 Request Book</button>`;
    }

    const catBadgeClass = getCategoryBadgeClass(book.category);

    return `
      <div class="book-card">
        <div class="book-cover ${coverClass}"><span class="letter">${firstLetter}</span></div>
        <div class="book-body">
          <div class="book-category"><span class="badge ${catBadgeClass}">${escapeHtml(book.category)}</span></div>
          <div class="book-title">${escapeHtml(book.title)}</div>
          <div class="book-author">by ${escapeHtml(book.author)}</div>
          <div class="book-availability">${availBadge}</div>
          ${btnHTML}
        </div>
      </div>
    `;
  }).join('');
}

function renderPagination() {
  const totalPages = Math.ceil(filteredBooks.length / BOOKS_PER_PAGE);
  const paginationEl = document.getElementById('pagination');
  if (totalPages <= 1) { paginationEl.innerHTML = ''; return; }
  let html = `<button ${currentPage === 1 ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})">← Prev</button>`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
  }
  html += `<button ${currentPage === totalPages ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})">Next →</button>`;
  paginationEl.innerHTML = html;
}

function goToPage(page) {
  const totalPages = Math.ceil(filteredBooks.length / BOOKS_PER_PAGE);
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderBooks();
  renderPagination();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openBorrowModal(bookId, bookTitle) {
  pendingBorrowBookId = bookId;
  document.getElementById('modalTitle').textContent = 'Confirm Request';
  document.getElementById('modalMessage').textContent = `Submit a borrow request for "${bookTitle}"? A librarian will review and approve it.`;
  document.getElementById('modalConfirmBtn').textContent = 'Request Book';
  document.getElementById('modalConfirmBtn').disabled = false;
  document.getElementById('confirmModal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('confirmModal').style.display = 'none';
  pendingBorrowBookId = null;
}

async function confirmBorrow() {
  if (!pendingBorrowBookId) return;
  const btn = document.getElementById('modalConfirmBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';

  try {
    const res = await fetch(`${window.API_BASE}/api/borrow/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ book_id: pendingBorrowBookId })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Borrow request submitted! Waiting for librarian approval.', 'success');
      pendingBookIds.push(pendingBorrowBookId);
      closeModal();
      renderBooks();
    } else {
      showToast(data.message || 'Failed to submit request', 'error');
      btn.disabled = false;
      btn.innerHTML = 'Request Book';
    }
  } catch (err) {
    showToast('Cannot connect to server.', 'error');
    btn.disabled = false;
    btn.innerHTML = 'Request Book';
  }
}

async function requestByAccession() {
  const input = document.getElementById('accessionInput');
  const btn = document.getElementById('accessionBtn');
  const accNum = input.value.trim().toUpperCase();
  if (!accNum) { showToast('Please enter an accession number.', 'error'); return; }

  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';

  try {
    const res = await fetch(`${window.API_BASE}/api/borrow/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ accession_number: accNum })
    });
    const data = await res.json();
    btn.disabled = false;
    btn.innerHTML = orig;
    if (data.success) {
      showToast('Request submitted for ' + accNum + '!', 'success');
      input.value = '';
      await loadMyBorrows();
      renderBooks();
    } else {
      showToast(data.message || 'Request failed', 'error');
    }
  } catch (e) {
    btn.disabled = false;
    btn.innerHTML = orig;
    showToast('Cannot connect to server.', 'error');
  }
}

document.addEventListener('click', (e) => { if (e.target.id === 'confirmModal') closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

function getCategoryBadgeClass(category) {
  const map = { 'Technology':'badge-blue','Mathematics':'badge-orange','Science':'badge-green','Biography':'badge-orange','Fiction':'badge-red' };
  return map[category] || 'badge-gray';
}

function escapeJsString(str) { return str.replace(/'/g, "\\'").replace(/"/g, '\\"'); }
