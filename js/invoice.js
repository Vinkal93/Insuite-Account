/**
 * invoice.js
 * Invoice management and GST calculation
 */

import { Storage } from './storage.js';
import { Ledger } from './ledger.js';

export const Invoice = {
    createInvoice(data) {
        // data: { customerId, items: [{desc, quantity, rate, taxRate}], type: 'intra'|'inter' }

        const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);

        // Calculate GST
        let cgst = 0, sgst = 0, igst = 0;

        data.items.forEach(item => {
            const amount = item.quantity * item.rate;
            const taxAmount = amount * (item.taxRate / 100);

            if (data.type === 'inter') { // Interstate
                igst += taxAmount;
            } else { // Intrastate
                cgst += taxAmount / 2;
                sgst += taxAmount / 2;
            }
        });

        const totalGST = cgst + sgst + igst;
        const totalAmount = subtotal + totalGST;

        const newInvoice = {
            id: 'inv_' + Date.now(),
            invoiceNumber: this.generateInvoiceNumber(),
            customerId: data.customerId,
            date: new Date().toISOString(),
            dueDate: data.dueDate,
            items: data.items,
            subtotal,
            gst: { cgst, sgst, igst },
            total: totalAmount,
            status: 'unpaid',
            createdAt: new Date().toISOString()
        };

        Storage.addItem('invoices', newInvoice);

        // Auto-post to Ledger? Yes, usually Sales Journal
        // Dr Accounts Receivable
        //    Cr Sales
        //    Cr GST Payable

        Ledger.addTransaction({
            date: newInvoice.date,
            description: `Invoice #${newInvoice.invoiceNumber}`,
            entries: [
                { accountId: 'acc_ar', debit: totalAmount }, // AR
                { accountId: 'acc_sales', credit: subtotal }, // Sales Income
                { accountId: 'acc_gst_pay', credit: totalGST } // Liability
            ]
        });

        return newInvoice;
    },

    generateInvoiceNumber() {
        const invoices = Storage.getCollection('invoices');
        const count = invoices.length + 1;
        return `INV-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;
    }
};
