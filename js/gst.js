/**
 * gst.js
 * GST Compliance Module
 */
import { Storage } from './storage.js';

export const GST = {
    calculateGST() {
        // Output Tax (Collected from Sales)
        // In our simple model, this is the balance of 'acc_gst_pay' (Liability)
        const accounts = Storage.getCollection('accounts');
        const gstPayableAcc = accounts.find(a => a.id === 'acc_gst_pay');
        const outputTax = gstPayableAcc ? gstPayableAcc.balance : 0;

        // Input Tax (Paid on Purchases)
        // We don't have a specific 'Input GST' asset account in our simple seed data yet.
        // But let's assume we can track it from expenses marked with tax?
        // For now, let's return 0 or simulate a value for demo.
        const inputTax = 0; // Future: Calculate from purchase transactions

        return {
            output: outputTax,
            input: inputTax,
            payable: outputTax - inputTax
        };
    }
};
