// SRKR Smart Library — API Configuration
// This file MUST load before any other script in every HTML page.

window.API_BASE = "https://web-production-d5180.up.railway.app";

// Global helper: show standardized error message in pages
window.showError = function(message) {
	try {
		console.error('API Error:', message);
		const els = document.querySelectorAll('.error-msg');
		if (els && els.length) {
			els.forEach(e => { e.textContent = message; e.style.display = 'block'; });
			return;
		}
		// fallback: toast if present
		if (window.showToast) {
			window.showToast(message, 'error');
		}
	} catch (e) {
		console.error('showError failed', e);
	}
};