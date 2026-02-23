/**
 * storage.js
 * Handles data persistence using localStorage
 */

const STORAGE_KEY = 'insuite_accounts_data_v1';

const DEFAULT_DATA = {
    settings: {
        currency: 'INR',
        dateFormat: 'DD/MM/YYYY',
        companyName: 'My Business',
        gstNumber: ''
    },
    accounts: [
        // Default Chart of Accounts
        { id: 'acc_cash', name: 'Cash', type: 'asset', category: 'Current Assets', balance: 0 },
        { id: 'acc_bank', name: 'Bank Account', type: 'asset', category: 'Current Assets', balance: 0 },
        { id: 'acc_ar', name: 'Accounts Receivable', type: 'asset', category: 'Current Assets', balance: 0 },
        { id: 'acc_inventory', name: 'Inventory', type: 'asset', category: 'Current Assets', balance: 0 },

        { id: 'acc_ap', name: 'Accounts Payable', type: 'liability', category: 'Current Liabilities', balance: 0 },
        { id: 'acc_gst_pay', name: 'GST Payable', type: 'liability', category: 'Current Liabilities', balance: 0 },

        { id: 'acc_sales', name: 'Sales Revenue', type: 'income', category: 'Operating Income', balance: 0 },
        { id: 'acc_invest', name: 'Investment Income', type: 'income', category: 'Other Income', balance: 0 },

        { id: 'acc_rent', name: 'Rent Expense', type: 'expense', category: 'Operating Expenses', balance: 0 },
        { id: 'acc_salary', name: 'Salaries', type: 'expense', category: 'Operating Expenses', balance: 0 },
        { id: 'acc_util', name: 'Utilities', type: 'expense', category: 'Operating Expenses', balance: 0 },
        { id: 'acc_purchases', name: 'Purchases', type: 'expense', category: 'Cost of Goods Sold', balance: 0 },

        { id: 'acc_equity', name: 'Owner Equity', type: 'equity', category: 'Equity', balance: 0 },
    ],
    transactions: [],
    invoices: [],
    customers: [],
    lastUpdated: new Date().toISOString()
};

export const Storage = {
    // Initialize storage if empty
    init() {
        if (!localStorage.getItem(STORAGE_KEY)) {
            this.saveData(DEFAULT_DATA);
            this.seedData();
            console.log('Storage initialized with default data');
        }
    },

    // Seed Data for Demo
    seedData() {
        const data = this.getData();
        const now = new Date();

        // 1. Transactions
        const sampleTransactions = [
            {
                id: 'txn_1', date: new Date(now - 86400000 * 2).toISOString(),
                description: 'Initial Capital Investment',
                entries: [
                    { accountId: 'acc_bank', debit: 500000 },
                    { accountId: 'acc_equity', credit: 500000 }
                ],
                amount: 500000, type: 'journal'
            },
            {
                id: 'txn_2', date: new Date(now - 86400000).toISOString(),
                description: 'Office Rent Payment',
                entries: [
                    { accountId: 'acc_rent', debit: 25000 },
                    { accountId: 'acc_bank', credit: 25000 }
                ],
                amount: 25000, type: 'expense'
            },
            {
                id: 'txn_3', date: new Date().toISOString(),
                description: 'Website Design Project - Invoice #INV-001',
                entries: [
                    { accountId: 'acc_ar', debit: 59000 },
                    { accountId: 'acc_sales', credit: 50000 },
                    { accountId: 'acc_gst_pay', credit: 9000 }
                ],
                amount: 59000, type: 'invoice'
            }
        ];

        // Update balances automatically for seed data
        sampleTransactions.forEach(txn => {
            data.transactions.push(txn);
            txn.entries.forEach(entry => {
                const acc = data.accounts.find(a => a.id === entry.accountId);
                if (acc) {
                    if (['asset', 'expense'].includes(acc.type)) acc.balance += (entry.debit || 0) - (entry.credit || 0);
                    else acc.balance += (entry.credit || 0) - (entry.debit || 0);
                }
            });
        });

        // 2. Invoices
        data.invoices.push({
            id: 'inv_1', invoiceNumber: 'INV-2026-0001', customerName: 'TechDisplay Systems',
            date: new Date().toISOString(), status: 'unpaid', total: 59000
        });

        this.saveData(data);
    },

    // Get all data
    getData() {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : DEFAULT_DATA;
    },

    // Save all data
    saveData(data) {
        data.lastUpdated = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    },

    // Generic collection getter
    getCollection(collectionName) {
        const data = this.getData();
        return data[collectionName] || [];
    },

    // Generic item adder
    addItem(collectionName, item) {
        const data = this.getData();
        if (!data[collectionName]) data[collectionName] = [];
        data[collectionName].push(item);
        this.saveData(data);
        return item;
    },

    // Update item in collection
    updateItem(collectionName, id, updates) {
        const data = this.getData();
        const index = data[collectionName].findIndex(item => item.id === id);
        if (index !== -1) {
            data[collectionName][index] = { ...data[collectionName][index], ...updates };
            this.saveData(data);
            return data[collectionName][index];
        }
        return null;
    },

    // Delete item
    deleteItem(collectionName, id) {
        const data = this.getData();
        data[collectionName] = data[collectionName].filter(item => item.id !== id);
        this.saveData(data);
    },

    // Special Helper: Update Account Balance
    updateAccountBalance(accountId, amount) {
        const data = this.getData();
        const account = data.accounts.find(a => a.id === accountId);
        if (account) {
            account.balance += amount;
            this.saveData(data);
        }
    },

    // Backup helper
    exportData() {
        const data = this.getData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `insuite_backup_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
    },

    reset() {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
    }
};
