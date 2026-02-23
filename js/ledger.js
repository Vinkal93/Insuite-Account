/**
 * ledger.js
 * Double-entry bookkeeping engine
 */

import { Storage } from './storage.js';

export const Ledger = {
    /**
     * Add a Journal Transaction
     * @param {Object} transaction
     * {
     *   date: 'ISOString',
     *   description: 'String',
     *   entries: [ { accountId: 'acc_1', debit: 0, credit: 100 }, ... ]
     * }
     */
    addTransaction(transaction) {
        // 1. Validate Double Entry (Debits must equal Credits)
        const totalDebit = transaction.entries.reduce((sum, e) => sum + (e.debit || 0), 0);
        const totalCredit = transaction.entries.reduce((sum, e) => sum + (e.credit || 0), 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            throw new Error(`Unbalanced Transaction: Debits (${totalDebit}) != Credits (${totalCredit})`);
        }

        // 2. Prepare Transaction Record
        const newTrans = {
            id: 'txn_' + Date.now(),
            date: transaction.date || new Date().toISOString(),
            description: transaction.description,
            entries: transaction.entries,
            amount: totalDebit, // Can use total debit as the "transaction amount"
            type: 'journal', // or 'invoice', 'payment' but handled by caller mainly
            createdAt: new Date().toISOString()
        };

        // 3. Update Account Balances
        transaction.entries.forEach(entry => {
            // Determine balance impact based on account type
            // Asset/Expense: Debit increases, Credit decreases
            // Liability/Equity/Income: Credit increases, Debit decreases
            // BUT: We usually store "Normal Balance". 
            // Simplified: Just update the raw number and interpret later? 
            // Better: Store signed value or generic 'balance' that follows Normal Balance rules.

            // Let's get the account type first
            const accounts = Storage.getCollection('accounts');
            const account = accounts.find(a => a.id === entry.accountId);

            if (account) {
                let change = 0;
                if (['asset', 'expense'].includes(account.type)) {
                    change = (entry.debit || 0) - (entry.credit || 0);
                } else {
                    change = (entry.credit || 0) - (entry.debit || 0);
                }
                Storage.updateAccountBalance(entry.accountId, change);
            }
        });

        // 4. Save Transaction
        Storage.addItem('transactions', newTrans);

        return newTrans;
    },

    getTrialBalance() {
        const accounts = Storage.getCollection('accounts');
        return accounts.map(acc => ({
            id: acc.id,
            name: acc.name,
            type: acc.type,
            balance: acc.balance
        }));
    },

    // Get Ledger for specific account
    getAccountLedger(accountId) {
        const transactions = Storage.getCollection('transactions');
        return transactions.filter(txn =>
            txn.entries.some(e => e.accountId === accountId)
        ).map(txn => {
            const entry = txn.entries.find(e => e.accountId === accountId);
            return {
                date: txn.date,
                description: txn.description,
                debit: entry.debit,
                credit: entry.credit,
                refId: txn.id
            };
        });
    }
};
