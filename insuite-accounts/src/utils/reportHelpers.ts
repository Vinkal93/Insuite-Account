import { db } from '../db/database';
import type { Company } from '../types';
import { exportToCSV, exportToPDF, exportToExcel, exportToJSON } from './exportUtils';
import { printReport, buildPrintTable, buildPrintSummary } from './printUtils';

// Shared types for report helpers
export interface ReportData {
    invoices: any[];
    purchases: any[];
    expenses: any[];
    parties: any[];
    products: any[];
    transactions: any[];
    accounts: any[];
    expenseCategories: any[];
}

export async function loadAllReportData(from: Date, to: Date): Promise<ReportData> {
    const toEnd = new Date(to);
    toEnd.setHours(23, 59, 59, 999);

    const [invoices, purchases, expenses, parties, products, transactions, accounts, expenseCategories] = await Promise.all([
        db.invoices.where('invoiceDate').between(from, toEnd).toArray(),
        db.purchases.where('billDate').between(from, toEnd).toArray(),
        db.expenses.where('date').between(from, toEnd).toArray(),
        db.parties.toArray(),
        db.products.toArray(),
        db.transactions.where('date').between(from, toEnd).toArray(),
        db.accounts.toArray(),
        db.expenseCategories.toArray(),
    ]);
    return { invoices, purchases, expenses, parties, products, transactions, accounts, expenseCategories };
}

export async function getCompanyInfo(): Promise<Company | null> {
    return (await db.company.toCollection().first()) || null;
}

export function getPartyName(parties: any[], id: number): string {
    return parties.find((p: any) => p.id === id)?.name || 'Unknown';
}

export function getCategoryName(cats: any[], id: number): string {
    return cats.find((c: any) => c.id === id)?.name || 'Unknown';
}

export function getAccountName(accs: any[], id?: number): string {
    if (!id) return '-';
    return accs.find((a: any) => a.id === id)?.name || 'Unknown';
}

export function formatCurrency(n: number): string {
    return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function formatDate(d: Date | string): string {
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Export Dispatcher ───
export function handleExport(
    format: 'csv' | 'pdf' | 'excel' | 'json',
    reportTitle: string,
    headers: string[],
    rows: (string | number)[][],
    company: Company | null,
    dateRange: { from: string; to: string }
) {
    const filename = reportTitle.replace(/[^a-zA-Z0-9]/g, '_');
    switch (format) {
        case 'csv': exportToCSV(filename, headers, rows); break;
        case 'pdf': exportToPDF(reportTitle, company, headers, rows, dateRange); break;
        case 'excel': exportToExcel(filename, reportTitle, headers, rows, company, dateRange); break;
        case 'json': exportToJSON(filename, headers, rows); break;
    }
}

// ─── Print Dispatcher ───
export function handlePrint(
    reportTitle: string,
    company: Company | null,
    headers: string[],
    rows: (string | number)[][],
    dateRange?: { from: string; to: string },
    summaryItems?: { label: string; value: string; color?: string }[],
    rightAlignCols?: number[]
) {
    let html = '';
    if (summaryItems) html += buildPrintSummary(summaryItems);
    html += buildPrintTable(headers, rows, { rightAlignCols });
    printReport(reportTitle, company, html, dateRange);
}
