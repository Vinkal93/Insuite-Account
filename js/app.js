/**
 * app.js
 * Main Application Controller
 */
import { Storage } from './storage.js';
import { UI } from './ui.js';
import { Reports } from './reports.js';
import { GST } from './gst.js';

class App {
    constructor() {
        this.init();
    }

    init() {
        console.log('InSuite Accounts Starting...');
        Storage.init();
        this.setupEventListeners();
        this.loadDashboard();

        // Handle initial hash
        const hash = window.location.hash.slice(1) || 'dashboard';
        UI.showView(hash);

        // Trigger initial View Load
        if (hash === 'ledger') this.loadLedger();
        if (hash === 'invoices') this.loadInvoices();
        if (hash === 'gst') this.loadGST();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(link => {
            link.addEventListener('click', (e) => {
                const viewId = link.getAttribute('data-view');
                UI.showView(viewId);

                // Also load data for that view
                if (viewId === 'ledger') this.loadLedger();
                if (viewId === 'invoices') this.loadInvoices();
                if (viewId === 'dashboard') this.loadDashboard();
                if (viewId === 'gst') this.loadGST();
            });
        });

        // Quick Actions
        document.getElementById('quick-action-btn')?.addEventListener('click', () => {
            // Future: Show Add Transaction Modal
            UI.showToast('Feature coming in next update', 'info');
        });
    }

    loadDashboard() {
        // 1. Update Key Stats
        const accounts = Storage.getCollection('accounts');
        // Income = revenue accounts
        const income = accounts.filter(a => a.type === 'income').reduce((s, a) => s + a.balance, 0);
        const expense = accounts.filter(a => a.type === 'expense').reduce((s, a) => s + a.balance, 0);
        const profit = income - expense;

        // Receivables
        const ar = accounts.find(a => a.id === 'acc_ar');
        const receivables = ar ? ar.balance : 0;

        // Update DOM
        const elIncome = document.querySelector('.stat-card.income .value');
        const elExpense = document.querySelector('.stat-card.expense .value');
        const elProfit = document.querySelector('.stat-card.profit .value');
        const elReceivable = document.querySelector('.stat-card.receivable .value');

        if (elIncome) elIncome.textContent = UI.formatMoney(income);
        if (elExpense) elExpense.textContent = UI.formatMoney(expense);
        if (elProfit) elProfit.textContent = UI.formatMoney(profit);
        if (elReceivable) elReceivable.textContent = UI.formatMoney(receivables);

        // 2. Recent Transactions
        const recentTrans = Storage.getCollection('transactions').slice(-5).reverse();
        const transList = document.querySelector('.transactions-list');
        if (transList) {
            transList.innerHTML = recentTrans.map(t => {
                const isIncome = t.type === 'invoice' || (t.type === 'journal' && t.amount > 0);

                return `
                <div class="transaction-item">
                    <div class="trans-icon ${isIncome ? 'income' : 'expense'}">
                        <span class="material-symbols-rounded">${isIncome ? 'arrow_downward' : 'arrow_upward'}</span>
                    </div>
                    <div class="trans-details">
                        <span class="trans-title">${t.description}</span>
                        <span class="trans-date">${UI.formatDate(t.date)}</span>
                    </div>
                    <span class="trans-amount ${isIncome ? 'income' : 'expense'}">${isIncome ? '+' : '-'}${UI.formatMoney(t.amount)}</span>
                </div>
                `;
            }).join('');
        }
    }

    loadLedger() {
        const txns = Storage.getCollection('transactions');
        const tbody = document.getElementById('ledger-entries');

        if (!tbody) return;

        // Sort by date desc
        const sortedTxns = [...txns].sort((a, b) => new Date(b.date) - new Date(a.date));

        tbody.innerHTML = sortedTxns.map(txn => {
            return `
            <tr>
                <td>${UI.formatDate(txn.date)}</td>
                <td>${txn.description}</td>
                <td><span class="badge">${txn.type}</span></td>
                <td class="text-right">${UI.formatMoney(txn.amount)}</td>
                <td class="text-right">-</td>
                <td class="text-right">-</td>
            </tr>
            `;
        }).join('');
    }

    loadInvoices() {
        const invoices = Storage.getCollection('invoices');
        const tbody = document.getElementById('invoice-list');
        if (!tbody) return;

        tbody.innerHTML = invoices.map(inv => `
            <tr>
                <td>${inv.invoiceNumber}</td>
                <td>${inv.customerName || 'Unknown'}</td>
                <td>${UI.formatDate(inv.date)}</td>
                <td><span class="badge ${inv.status}">${inv.status}</span></td>
                <td class="text-right">${UI.formatMoney(inv.total)}</td>
                <td>
                    <button class="btn-icon"><span class="material-symbols-rounded">visibility</span></button>
                    <button class="btn-icon"><span class="material-symbols-rounded">download</span></button>
                </td>
            </tr>
        `).join('');
    }

    loadGST() {
        const tax = GST.calculateGST();
        const elOutput = document.getElementById('gst-output');
        const elInput = document.getElementById('gst-input');
        const elPayable = document.getElementById('gst-payable');

        if (elOutput) elOutput.textContent = UI.formatMoney(tax.output);
        if (elInput) elInput.textContent = UI.formatMoney(tax.input);
        if (elPayable) elPayable.textContent = UI.formatMoney(tax.payable);
    }

    generateReport(type) {
        let content = '';
        if (type === 'pl') content = Reports.generatePL();
        if (type === 'bs') content = Reports.generateBalanceSheet();
        if (type === 'cf' || type === 'tb') {
            UI.showToast('This report is coming in the next update!', 'info');
            return;
        }

        if (content) {
            const output = document.getElementById('report-output');
            output.innerHTML = content;
            output.classList.remove('hidden');
            output.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

// Global hook
const app = new App();
window.app = app;
