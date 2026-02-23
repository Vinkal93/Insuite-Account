/**
 * ui.js
 * User Interface utilities and helpers
 */

export const UI = {
    // Format currency (INR)
    formatMoney(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    },

    // Format Date
    formatDate(dateStr) {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        }).format(date);
    },

    // Show View
    showView(viewId) {
        // Hide all views
        document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

        // Show target view
        const targetView = document.getElementById(`view-${viewId}`);
        if (targetView) targetView.classList.add('active');

        // Update Nav
        const navItem = document.querySelector(`.nav-item[data-view="${viewId}"]`);
        if (navItem) navItem.classList.add('active');

        // Update Title
        const titleMap = {
            'dashboard': 'Dashboard',
            'ledger': 'General Ledger',
            'invoices': 'Invoices',
            'reports': 'Financial Reports',
            'gst': 'GST Filing',
            'customers': 'Customers',
            'settings': 'Settings'
        };
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) pageTitle.textContent = titleMap[viewId] || 'InSuite Accounts';
    },

    // Notification Toast
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed; bottom: 20px; right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white; padding: 12px 24px; border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // Modal Builder
    showModal(title, contentHtml, footerHtml = '') {
        const modalContainer = document.getElementById('modal-container');
        modalContainer.innerHTML = `
            <div class="modal-backdrop" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:900;display:flex;align-items:center;justify-content:center;">
                <div class="modal-content" style="background:white;padding:24px;border-radius:16px;width:100%;max-width:500px;box-shadow:0 20px 25px -5px rgba(0,0,0,0.1);animation:scaleIn 0.2s ease;">
                    <div class="modal-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                        <h3 style="font-size:1.25rem;font-weight:600;">${title}</h3>
                        <button onclick="document.getElementById('modal-container').innerHTML=''" style="background:none;border:none;cursor:pointer;">
                            <span class="material-symbols-rounded">close</span>
                        </button>
                    </div>
                    <div class="modal-body">${contentHtml}</div>
                    <div class="modal-footer" style="margin-top:24px;display:flex;justify-content:flex-end;gap:12px;">
                        ${footerHtml}
                    </div>
                </div>
            </div>
        `;
    }
};
