/**
 * reports.js
 * Financial Report Generator
 */
import { Storage } from './storage.js';
import { UI } from './ui.js';

export const Reports = {
    generatePL() {
        // Income Statement = Income - Expenses
        const accounts = Storage.getCollection('accounts');
        const incomeAccs = accounts.filter(a => a.type === 'income');
        const expenseAccs = accounts.filter(a => a.type === 'expense');

        const totalIncome = incomeAccs.reduce((sum, a) => sum + a.balance, 0);
        const totalExpense = expenseAccs.reduce((sum, a) => sum + a.balance, 0);
        const netProfit = totalIncome - totalExpense;

        return `
            <div class="report-content">
                <div class="report-header text-center">
                    <h3>Profit & Loss Statement</h3>
                    <p>As of ${UI.formatDate(new Date())}</p>
                </div>
                
                <div class="report-section">
                    <h4>Income</h4>
                    <table class="data-table">
                        ${incomeAccs.map(a => `<tr><td>${a.name}</td><td class="text-right">${UI.formatMoney(a.balance)}</td></tr>`).join('')}
                        <tr class="font-bold bg-gray">
                            <td>Total Income</td>
                            <td class="text-right">${UI.formatMoney(totalIncome)}</td>
                        </tr>
                    </table>
                </div>

                <div class="report-section margin-top">
                    <h4>Expenses</h4>
                    <table class="data-table">
                        ${expenseAccs.map(a => `<tr><td>${a.name}</td><td class="text-right">${UI.formatMoney(a.balance)}</td></tr>`).join('')}
                         <tr class="font-bold bg-gray">
                            <td>Total Expenses</td>
                            <td class="text-right">${UI.formatMoney(totalExpense)}</td>
                        </tr>
                    </table>
                </div>

                <div class="report-summary margin-top p-4 bg-primary-light rounded">
                    <div class="flex justify-between font-bold text-lg">
                        <span>Net Profit</span>
                        <span class="${netProfit >= 0 ? 'text-success' : 'text-danger'}">${UI.formatMoney(netProfit)}</span>
                    </div>
                </div>
            </div>
        `;
    },

    generateBalanceSheet() {
        const accounts = Storage.getCollection('accounts');
        const assets = accounts.filter(a => a.type === 'asset');
        const liabilities = accounts.filter(a => a.type === 'liability');
        const equity = accounts.filter(a => a.type === 'equity');

        // Calculate Current Year Earnings (Net Profit) to balance the sheet
        const netProfit = accounts.filter(a => a.type === 'income').reduce((s, a) => s + a.balance, 0) -
            accounts.filter(a => a.type === 'expense').reduce((s, a) => s + a.balance, 0);

        const totalAssets = assets.reduce((s, a) => s + a.balance, 0);
        const totalLiabilities = liabilities.reduce((s, a) => s + a.balance, 0);
        const totalEquity = equity.reduce((s, a) => s + a.balance, 0) + netProfit;

        return `
            <div class="report-content">
                <div class="report-header text-center">
                    <h3>Balance Sheet</h3>
                    <p>As of ${UI.formatDate(new Date())}</p>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <h4>Assets</h4>
                        <table class="data-table">
                            ${assets.map(a => `<tr><td>${a.name}</td><td class="text-right">${UI.formatMoney(a.balance)}</td></tr>`).join('')}
                            <tr class="font-bold"><td>Total Assets</td><td class="text-right">${UI.formatMoney(totalAssets)}</td></tr>
                        </table>
                    </div>
                    <div>
                        <h4>Liabilities & Equity</h4>
                        <table class="data-table">
                            <tr><td colspan="2" class="font-bold text-secondary">Liabilities</td></tr>
                            ${liabilities.map(a => `<tr><td>${a.name}</td><td class="text-right">${UI.formatMoney(a.balance)}</td></tr>`).join('')}
                            
                            <tr><td colspan="2" class="font-bold text-secondary margin-top">Equity</td></tr>
                            ${equity.map(a => `<tr><td>${a.name}</td><td class="text-right">${UI.formatMoney(a.balance)}</td></tr>`).join('')}
                            <tr><td>Current Earnings</td><td class="text-right">${UI.formatMoney(netProfit)}</td></tr>
                            
                            <tr class="font-bold"><td>Total Liab & Eq</td><td class="text-right">${UI.formatMoney(totalLiabilities + totalEquity)}</td></tr>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }
};
