import { useState, useEffect, useRef } from 'react';
import type { Company } from '../types';
import {
    loadAllReportData, getCompanyInfo, getPartyName, getCategoryName,
    formatCurrency, formatDate, handleExport, handlePrint,
    type ReportData
} from '../utils/reportHelpers';

const REPORT_SECTIONS = [
    {
        title: 'Accounting Reports', items: [
            { id: 'pl', name: 'Profit & Loss', icon: 'analytics', desc: 'Income vs Expenses analysis', color: '#10b981' },
            { id: 'balancesheet', name: 'Balance Sheet', icon: 'account_balance_wallet', desc: 'Assets vs Liabilities snapshot', color: '#3b82f6' },
            { id: 'trialbalance', name: 'Trial Balance', icon: 'balance', desc: 'All ledger balances', color: '#8b5cf6' },
            { id: 'daybook', name: 'Day Book', icon: 'calendar_today', desc: 'All daily transactions', color: '#f59e0b' },
            { id: 'cashflow', name: 'Cash Flow', icon: 'currency_exchange', desc: 'Money in/out analysis', color: '#2d6a4f' },
        ]
    },
    {
        title: 'Sales & Purchase', items: [
            { id: 'sales', name: 'Sales Register', icon: 'trending_up', desc: 'All sales invoices', color: '#0077b6' },
            { id: 'purchase', name: 'Purchase Register', icon: 'shopping_cart', desc: 'All purchase bills', color: '#e07a00' },
            { id: 'salessummary', name: 'Sales Summary', icon: 'bar_chart', desc: 'Product/Month-wise sales', color: '#0ea5e9' },
            { id: 'purchasesummary', name: 'Purchase Summary', icon: 'stacked_bar_chart', desc: 'Vendor/Month-wise purchases', color: '#d97706' },
        ]
    },
    {
        title: 'Party & Ledger', items: [
            { id: 'ledger', name: 'Party Ledger', icon: 'menu_book', desc: 'Party-wise transactions', color: '#7b2cbf' },
            { id: 'partystatement', name: 'Party Statement', icon: 'assignment_ind', desc: 'Individual party account', color: '#6d28d9' },
            { id: 'receivables', name: 'Outstanding Receivables', icon: 'call_received', desc: 'Aging: who owes you', color: '#059669' },
            { id: 'payables', name: 'Outstanding Payables', icon: 'call_made', desc: 'Aging: what you owe', color: '#dc2626' },
        ]
    },
    {
        title: 'Expense & Inventory', items: [
            { id: 'expense', name: 'Expense Report', icon: 'payments', desc: 'Category-wise expenses', color: '#e63946' },
            { id: 'stock', name: 'Stock Summary', icon: 'inventory', desc: 'Product stock & value', color: '#0d9488' },
        ]
    },
    {
        title: 'GST & Tax', items: [
            { id: 'gstr1', name: 'GSTR-1', icon: 'description', desc: 'Outward supplies (B2B/B2C)', color: '#4338ca' },
            { id: 'gstr3b', name: 'GSTR-3B Summary', icon: 'summarize', desc: 'Tax liability + ITC', color: '#7c3aed' },
            { id: 'gstsummary', name: 'GST Tax Summary', icon: 'calculate', desc: 'GST collected vs paid', color: '#2563eb' },
        ]
    },
];

type ExportFormat = 'csv' | 'pdf' | 'excel' | 'json';

export default function Reports() {
    const [activeReport, setActiveReport] = useState<string | null>(null);
    const [data, setData] = useState<ReportData | null>(null);
    const [company, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedParty, setSelectedParty] = useState<number>(0);
    const [exportOpen, setExportOpen] = useState(false);
    const exportRef = useRef<HTMLDivElement>(null);
    const [dateRange, setDateRange] = useState({
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
    });

    const loadData = async () => {
        setLoading(true);
        const [d, c] = await Promise.all([
            loadAllReportData(new Date(dateRange.from), new Date(dateRange.to)),
            getCompanyInfo()
        ]);
        setData(d);
        setCompany(c);
        setLoading(false);
    };

    useEffect(() => { if (activeReport) loadData(); }, [activeReport, dateRange]);

    // Close export dropdown on outside click
    useEffect(() => {
        const h = (e: MouseEvent) => { if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    // ─── Report Data Builders ───
    const reportName = REPORT_SECTIONS.flatMap(s => s.items).find(r => r.id === activeReport)?.name || '';

    const getReportTableData = (): { headers: string[]; rows: (string | number)[][]; summary?: { label: string; value: string; color?: string }[]; rightAlignCols?: number[] } | null => {
        if (!data) return null;
        const pName = (id: number) => getPartyName(data.parties, id);
        const cName = (id: number) => getCategoryName(data.expenseCategories, id);


        switch (activeReport) {
            case 'pl': {
                const totalSales = data.invoices.reduce((s, i) => s + i.grandTotal, 0);
                const totalPurchases = data.purchases.reduce((s, p) => s + p.grandTotal, 0);
                const totalExpenses = data.expenses.reduce((s, e) => s + e.amount, 0);
                const profit = totalSales - totalPurchases - totalExpenses;
                return {
                    headers: ['Particulars', 'Amount (₹)'],
                    rows: [
                        ['Sales Revenue', totalSales],
                        ['(-) Cost of Goods (Purchases)', totalPurchases],
                        ['(-) Operating Expenses', totalExpenses],
                        ['Net ' + (profit >= 0 ? 'Profit' : 'Loss'), Math.abs(profit)],
                    ],
                    summary: [
                        { label: 'Total Income', value: formatCurrency(totalSales), color: '#10b981' },
                        { label: 'Total Expenses', value: formatCurrency(totalPurchases + totalExpenses), color: '#ef4444' },
                        { label: profit >= 0 ? 'Net Profit' : 'Net Loss', value: formatCurrency(Math.abs(profit)), color: profit >= 0 ? '#10b981' : '#ef4444' },
                    ],
                    rightAlignCols: [1]
                };
            }
            case 'balancesheet': {
                const cashBal = data.accounts.filter(a => a.type === 'cash').reduce((s, a) => s + a.balance, 0);
                const bankBal = data.accounts.filter(a => a.type === 'bank').reduce((s, a) => s + a.balance, 0);
                const stockVal = data.products.reduce((s, p) => s + (p.stock * p.purchasePrice), 0);
                const receivables = data.invoices.filter(i => !i.isPaid).reduce((s, i) => s + (i.grandTotal - i.paidAmount), 0);
                const payables = data.purchases.filter(p => !p.isPaid).reduce((s, p) => s + (p.grandTotal - p.paidAmount), 0);
                const totalAssets = cashBal + bankBal + stockVal + receivables;
                return {
                    headers: ['Particulars', 'Amount (₹)'],
                    rows: [
                        ['— ASSETS —', ''],
                        ['Cash in Hand', cashBal],
                        ['Bank Balance', bankBal],
                        ['Inventory (Stock)', stockVal],
                        ['Accounts Receivable', receivables],
                        ['Total Assets', totalAssets],
                        ['', ''],
                        ['— LIABILITIES —', ''],
                        ['Accounts Payable', payables],
                        ['Total Liabilities', payables],
                        ['', ''],
                        ['Net Worth (Assets - Liabilities)', totalAssets - payables],
                    ],
                    summary: [
                        { label: 'Total Assets', value: formatCurrency(totalAssets), color: '#3b82f6' },
                        { label: 'Total Liabilities', value: formatCurrency(payables), color: '#ef4444' },
                        { label: 'Net Worth', value: formatCurrency(totalAssets - payables), color: '#10b981' },
                    ],
                    rightAlignCols: [1]
                };
            }
            case 'trialbalance': {
                const ledgers: { name: string; dr: number; cr: number }[] = [];
                const salesTotal = data.invoices.reduce((s, i) => s + i.grandTotal, 0);
                const purchTotal = data.purchases.reduce((s, p) => s + p.grandTotal, 0);
                const expTotal = data.expenses.reduce((s, e) => s + e.amount, 0);
                if (salesTotal) ledgers.push({ name: 'Sales', dr: 0, cr: salesTotal });
                if (purchTotal) ledgers.push({ name: 'Purchases', dr: purchTotal, cr: 0 });
                if (expTotal) ledgers.push({ name: 'Expenses', dr: expTotal, cr: 0 });
                data.accounts.forEach(a => {
                    if (a.balance > 0) ledgers.push({ name: a.name, dr: a.balance, cr: 0 });
                    else if (a.balance < 0) ledgers.push({ name: a.name, dr: 0, cr: Math.abs(a.balance) });
                });
                const totalDr = ledgers.reduce((s, l) => s + l.dr, 0);
                const totalCr = ledgers.reduce((s, l) => s + l.cr, 0);
                return {
                    headers: ['Ledger', 'Debit (₹)', 'Credit (₹)'],
                    rows: [...ledgers.map(l => [l.name, l.dr || '', l.cr || '']), ['TOTAL', totalDr, totalCr]],
                    rightAlignCols: [1, 2]
                };
            }
            case 'sales':
                return {
                    headers: ['Invoice #', 'Date', 'Party', 'Taxable', 'CGST', 'SGST', 'Total'],
                    rows: data.invoices.map(i => [i.invoiceNumber, formatDate(i.invoiceDate), pName(i.partyId), i.taxableAmount, i.cgst, i.sgst, i.grandTotal]),
                    summary: [
                        { label: 'Total Invoices', value: String(data.invoices.length), color: '#0077b6' },
                        { label: 'Total Sales', value: formatCurrency(data.invoices.reduce((s, i) => s + i.grandTotal, 0)), color: '#10b981' },
                        { label: 'Total GST', value: formatCurrency(data.invoices.reduce((s, i) => s + i.totalTax, 0)), color: '#f59e0b' },
                    ],
                    rightAlignCols: [3, 4, 5, 6]
                };
            case 'purchase':
                return {
                    headers: ['Bill #', 'Date', 'Vendor', 'Taxable', 'GST', 'Total'],
                    rows: data.purchases.map(p => [p.billNumber, formatDate(p.billDate), pName(p.partyId), p.taxableAmount, p.totalTax, p.grandTotal]),
                    summary: [
                        { label: 'Total Bills', value: String(data.purchases.length), color: '#e07a00' },
                        { label: 'Total Purchases', value: formatCurrency(data.purchases.reduce((s, p) => s + p.grandTotal, 0)), color: '#ef4444' },
                    ],
                    rightAlignCols: [3, 4, 5]
                };
            case 'ledger': {
                const entries: (string | number)[][] = [];
                data.invoices.forEach(i => entries.push([formatDate(i.invoiceDate), pName(i.partyId), 'Sale', `#${i.invoiceNumber}`, i.grandTotal, 0]));
                data.purchases.forEach(p => entries.push([formatDate(p.billDate), pName(p.partyId), 'Purchase', `#${p.billNumber}`, 0, p.grandTotal]));
                entries.sort((a, b) => String(a[0]).localeCompare(String(b[0])));
                return { headers: ['Date', 'Party', 'Type', 'Ref', 'Debit (₹)', 'Credit (₹)'], rows: entries, rightAlignCols: [4, 5] };
            }
            case 'expense': {
                const catMap: Record<number, number> = {};
                data.expenses.forEach(e => { catMap[e.categoryId] = (catMap[e.categoryId] || 0) + e.amount; });
                const rows = Object.entries(catMap).map(([id, amt]) => [cName(Number(id)), amt as number]);
                rows.push(['TOTAL', data.expenses.reduce((s, e) => s + e.amount, 0)]);
                return { headers: ['Category', 'Amount (₹)'], rows, rightAlignCols: [1] };
            }
            case 'cashflow': {
                const cashIn = data.invoices.reduce((s, i) => s + i.paidAmount, 0);
                const cashOut = data.purchases.reduce((s, p) => s + p.paidAmount, 0) + data.expenses.reduce((s, e) => s + e.amount, 0);
                return {
                    headers: ['Particulars', 'Amount (₹)'],
                    rows: [
                        ['Cash Received (Sales)', cashIn], ['Cash Paid (Purchases)', cashOut],
                        ['Expenses', data.expenses.reduce((s, e) => s + e.amount, 0)],
                        ['Net Cash Flow', cashIn - cashOut],
                    ],
                    summary: [
                        { label: 'Cash In', value: formatCurrency(cashIn), color: '#10b981' },
                        { label: 'Cash Out', value: formatCurrency(cashOut), color: '#ef4444' },
                        { label: 'Net Flow', value: formatCurrency(cashIn - cashOut), color: cashIn >= cashOut ? '#10b981' : '#ef4444' },
                    ],
                    rightAlignCols: [1]
                };
            }
            case 'daybook': {
                const entries: (string | number)[][] = [];
                data.invoices.forEach(i => entries.push([formatDate(i.invoiceDate), 'Sale', `#${i.invoiceNumber}`, pName(i.partyId), i.grandTotal]));
                data.purchases.forEach(p => entries.push([formatDate(p.billDate), 'Purchase', `#${p.billNumber}`, pName(p.partyId), p.grandTotal]));
                data.expenses.forEach(e => entries.push([formatDate(e.date), 'Expense', cName(e.categoryId), e.description, e.amount]));
                data.transactions.forEach(t => entries.push([formatDate(t.date), t.type.replace(/_/g, ' '), t.reference || '-', t.description, t.amount]));
                entries.sort((a, b) => String(a[0]).localeCompare(String(b[0])));
                return { headers: ['Date', 'Type', 'Ref', 'Details', 'Amount (₹)'], rows: entries, rightAlignCols: [4] };
            }
            case 'stock':
                return {
                    headers: ['Product', 'HSN', 'Unit', 'Stock Qty', 'Purchase Price', 'Sale Price', 'Stock Value'],
                    rows: data.products.map(p => [p.name, p.hsn || '-', p.unit, p.stock, p.purchasePrice, p.salePrice, p.stock * p.purchasePrice]),
                    summary: [
                        { label: 'Total Items', value: String(data.products.length), color: '#0d9488' },
                        { label: 'Total Stock Value', value: formatCurrency(data.products.reduce((s, p) => s + p.stock * p.purchasePrice, 0)), color: '#3b82f6' },
                    ],
                    rightAlignCols: [3, 4, 5, 6]
                };
            case 'receivables': {
                const unpaid = data.invoices.filter(i => !i.isPaid);
                const now = Date.now();
                const rows = unpaid.map(i => {
                    const days = Math.floor((now - new Date(i.invoiceDate).getTime()) / 86400000);
                    const due = i.grandTotal - i.paidAmount;
                    const aging = days <= 30 ? '0-30' : days <= 60 ? '30-60' : days <= 90 ? '60-90' : '90+';
                    return [i.invoiceNumber, formatDate(i.invoiceDate), pName(i.partyId), i.grandTotal, i.paidAmount, due, `${days}d`, aging];
                });
                return {
                    headers: ['Invoice #', 'Date', 'Party', 'Total', 'Paid', 'Due', 'Days', 'Aging'],
                    rows, rightAlignCols: [3, 4, 5],
                    summary: [{ label: 'Total Receivable', value: formatCurrency(unpaid.reduce((s, i) => s + i.grandTotal - i.paidAmount, 0)), color: '#059669' }]
                };
            }
            case 'payables': {
                const unpaid = data.purchases.filter(p => !p.isPaid);
                const now = Date.now();
                const rows = unpaid.map(p => {
                    const days = Math.floor((now - new Date(p.billDate).getTime()) / 86400000);
                    const due = p.grandTotal - p.paidAmount;
                    const aging = days <= 30 ? '0-30' : days <= 60 ? '30-60' : days <= 90 ? '60-90' : '90+';
                    return [p.billNumber, formatDate(p.billDate), pName(p.partyId), p.grandTotal, p.paidAmount, due, `${days}d`, aging];
                });
                return {
                    headers: ['Bill #', 'Date', 'Vendor', 'Total', 'Paid', 'Due', 'Days', 'Aging'],
                    rows, rightAlignCols: [3, 4, 5],
                    summary: [{ label: 'Total Payable', value: formatCurrency(unpaid.reduce((s, p) => s + p.grandTotal - p.paidAmount, 0)), color: '#dc2626' }]
                };
            }
            case 'partystatement': {
                if (!selectedParty) return { headers: ['Please select a party above'], rows: [] };
                const party = data.parties.find(p => p.id === selectedParty);
                const entries: (string | number)[][] = [];
                data.invoices.filter(i => i.partyId === selectedParty).forEach(i =>
                    entries.push([formatDate(i.invoiceDate), 'Sale', `#${i.invoiceNumber}`, i.grandTotal, 0])
                );
                data.purchases.filter(p => p.partyId === selectedParty).forEach(p =>
                    entries.push([formatDate(p.billDate), 'Purchase', `#${p.billNumber}`, 0, p.grandTotal])
                );
                entries.sort((a, b) => String(a[0]).localeCompare(String(b[0])));
                const totalDr = entries.reduce((s, e) => s + (Number(e[3]) || 0), 0);
                const totalCr = entries.reduce((s, e) => s + (Number(e[4]) || 0), 0);
                entries.push(['', '', 'TOTAL', totalDr, totalCr]);
                return {
                    headers: ['Date', 'Type', 'Ref', 'Debit (₹)', 'Credit (₹)'], rows: entries, rightAlignCols: [3, 4],
                    summary: [
                        { label: 'Party', value: party?.name || '', color: '#6d28d9' },
                        { label: 'Total Debit', value: formatCurrency(totalDr), color: '#10b981' },
                        { label: 'Total Credit', value: formatCurrency(totalCr), color: '#ef4444' },
                    ]
                };
            }
            case 'salessummary': {
                const productSales: Record<string, { qty: number; total: number }> = {};
                data.invoices.forEach(inv => inv.items?.forEach((item: any) => {
                    const key = item.description || 'Unknown';
                    if (!productSales[key]) productSales[key] = { qty: 0, total: 0 };
                    productSales[key].qty += item.quantity;
                    productSales[key].total += item.total;
                }));
                const rows = Object.entries(productSales).map(([name, v]) => [name, v.qty, v.total]);
                return { headers: ['Product', 'Qty Sold', 'Amount (₹)'], rows, rightAlignCols: [1, 2] };
            }
            case 'purchasesummary': {
                const vendorPurch: Record<string, number> = {};
                data.purchases.forEach(p => {
                    const name = pName(p.partyId);
                    vendorPurch[name] = (vendorPurch[name] || 0) + p.grandTotal;
                });
                const rows = Object.entries(vendorPurch).map(([name, total]) => [name, total]);
                return { headers: ['Vendor', 'Total Purchase (₹)'], rows, rightAlignCols: [1] };
            }
            case 'gstr1': {
                const b2b = data.invoices.filter(i => { const p = data.parties.find(pp => pp.id === i.partyId); return p?.gstin; });
                const b2c = data.invoices.filter(i => { const p = data.parties.find(pp => pp.id === i.partyId); return !p?.gstin; });
                const rows: (string | number)[][] = [
                    ['— B2B (Registered Parties) —', '', '', '', '', ''],
                    ...b2b.map(i => [i.invoiceNumber, formatDate(i.invoiceDate), pName(i.partyId), i.taxableAmount, i.totalTax, i.grandTotal]),
                    ['Subtotal B2B', '', '', b2b.reduce((s, i) => s + i.taxableAmount, 0), b2b.reduce((s, i) => s + i.totalTax, 0), b2b.reduce((s, i) => s + i.grandTotal, 0)],
                    ['', '', '', '', '', ''],
                    ['— B2C (Unregistered) —', '', '', '', '', ''],
                    ...b2c.map(i => [i.invoiceNumber, formatDate(i.invoiceDate), pName(i.partyId), i.taxableAmount, i.totalTax, i.grandTotal]),
                    ['Subtotal B2C', '', '', b2c.reduce((s, i) => s + i.taxableAmount, 0), b2c.reduce((s, i) => s + i.totalTax, 0), b2c.reduce((s, i) => s + i.grandTotal, 0)],
                ];
                return { headers: ['Invoice #', 'Date', 'Party', 'Taxable', 'Tax', 'Total'], rows, rightAlignCols: [3, 4, 5] };
            }
            case 'gstr3b': {
                const outwardTax = data.invoices.reduce((s, i) => s + i.totalTax, 0);
                const itc = data.purchases.reduce((s, p) => s + p.totalTax, 0);
                return {
                    headers: ['Particulars', 'Taxable (₹)', 'CGST (₹)', 'SGST (₹)', 'Total Tax (₹)'],
                    rows: [
                        ['Outward Supplies (Sales)', data.invoices.reduce((s, i) => s + i.taxableAmount, 0), data.invoices.reduce((s, i) => s + i.cgst, 0), data.invoices.reduce((s, i) => s + i.sgst, 0), outwardTax],
                        ['Input Tax Credit (Purchases)', data.purchases.reduce((s, p) => s + p.taxableAmount, 0), data.purchases.reduce((s, p) => s + p.cgst, 0), data.purchases.reduce((s, p) => s + p.sgst, 0), itc],
                        ['Net Tax Payable', '', '', '', outwardTax - itc],
                    ],
                    summary: [
                        { label: 'Output Tax', value: formatCurrency(outwardTax), color: '#ef4444' },
                        { label: 'Input Tax Credit', value: formatCurrency(itc), color: '#10b981' },
                        { label: 'Net Payable', value: formatCurrency(outwardTax - itc), color: outwardTax > itc ? '#ef4444' : '#10b981' },
                    ],
                    rightAlignCols: [1, 2, 3, 4]
                };
            }
            case 'gstsummary': {
                const collected = { cgst: data.invoices.reduce((s, i) => s + i.cgst, 0), sgst: data.invoices.reduce((s, i) => s + i.sgst, 0), igst: data.invoices.reduce((s, i) => s + i.igst, 0) };
                const paid = { cgst: data.purchases.reduce((s, p) => s + p.cgst, 0), sgst: data.purchases.reduce((s, p) => s + p.sgst, 0), igst: data.purchases.reduce((s, p) => s + p.igst, 0) };
                return {
                    headers: ['Tax Type', 'Collected (₹)', 'Paid (ITC) (₹)', 'Net Liability (₹)'],
                    rows: [
                        ['CGST', collected.cgst, paid.cgst, collected.cgst - paid.cgst],
                        ['SGST', collected.sgst, paid.sgst, collected.sgst - paid.sgst],
                        ['IGST', collected.igst, paid.igst, collected.igst - paid.igst],
                        ['TOTAL', collected.cgst + collected.sgst + collected.igst, paid.cgst + paid.sgst + paid.igst, (collected.cgst + collected.sgst + collected.igst) - (paid.cgst + paid.sgst + paid.igst)],
                    ],
                    rightAlignCols: [1, 2, 3]
                };
            }
            default: return null;
        }
    };

    const tableData = (!loading && data) ? getReportTableData() : null;

    const doExport = (fmt: ExportFormat) => {
        if (!tableData) return;
        handleExport(fmt, reportName, tableData.headers, tableData.rows, company, dateRange);
        setExportOpen(false);
    };

    const doPrint = () => {
        if (!tableData) return;
        handlePrint(reportName, company, tableData.headers, tableData.rows, dateRange, tableData.summary, tableData.rightAlignCols);
    };

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: 'var(--md-sys-spacing-lg)' }}>
                <h1 className="text-headline-medium">Reports</h1>
                <p className="text-body-medium text-muted">Generate, print & export 18+ business reports</p>
            </div>

            {/* Date Range */}
            <div className="card" style={{ marginBottom: 'var(--md-sys-spacing-lg)' }}>
                <div style={{ display: 'flex', gap: 'var(--md-sys-spacing-md)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">From Date</label>
                        <input type="date" className="form-input" value={dateRange.from} onChange={e => setDateRange({ ...dateRange, from: e.target.value })} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">To Date</label>
                        <input type="date" className="form-input" value={dateRange.to} onChange={e => setDateRange({ ...dateRange, to: e.target.value })} />
                    </div>
                    {activeReport === 'partystatement' && data && (
                        <div className="form-group" style={{ marginBottom: 0, minWidth: '200px' }}>
                            <label className="form-label">Select Party</label>
                            <select className="form-input" value={selectedParty} onChange={e => setSelectedParty(Number(e.target.value))}>
                                <option value={0}>-- Select Party --</option>
                                {data.parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    )}
                    {activeReport && (
                        <button className="btn btn-filled" onClick={loadData}>
                            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>refresh</span> Refresh
                        </button>
                    )}
                </div>
            </div>

            {/* Report Selection Grid */}
            {!activeReport && REPORT_SECTIONS.map(section => (
                <div key={section.title} style={{ marginBottom: 'var(--md-sys-spacing-xl)' }}>
                    <h2 className="text-title-large" style={{ marginBottom: 'var(--md-sys-spacing-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {section.title}
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--md-sys-spacing-md)' }}>
                        {section.items.map(r => (
                            <div key={r.id} className="card report-card" onClick={() => setActiveReport(r.id)}
                                style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--md-sys-elevation-3)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
                                <div style={{
                                    width: '44px', height: '44px', borderRadius: '10px',
                                    background: `linear-gradient(135deg, ${r.color}22, ${r.color}0a)`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px'
                                }}>
                                    <span className="material-symbols-rounded" style={{ fontSize: '22px', color: r.color }}>{r.icon}</span>
                                </div>
                                <h3 className="text-title-medium" style={{ marginBottom: '4px' }}>{r.name}</h3>
                                <p className="text-body-small text-muted">{r.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {/* Active Report View */}
            {activeReport && (
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--md-sys-spacing-lg)', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <button className="btn btn-icon" onClick={() => setActiveReport(null)} title="Back">
                                <span className="material-symbols-rounded">arrow_back</span>
                            </button>
                            <h2 className="text-headline-medium">{reportName}</h2>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--md-sys-spacing-sm)' }}>
                            <button className="btn btn-outlined" onClick={doPrint}>
                                <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>print</span> Print
                            </button>
                            <div ref={exportRef} style={{ position: 'relative' }}>
                                <button className="btn btn-filled" onClick={() => setExportOpen(v => !v)}>
                                    <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>download</span> Export ▾
                                </button>
                                {exportOpen && (
                                    <div className="export-dropdown">
                                        {(['csv', 'pdf', 'excel', 'json'] as ExportFormat[]).map(f => (
                                            <button key={f} className="export-dropdown-item" onClick={() => doExport(f)}>
                                                <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>
                                                    {f === 'csv' ? 'table_view' : f === 'pdf' ? 'picture_as_pdf' : f === 'excel' ? 'grid_on' : 'data_object'}
                                                </span>
                                                Export as {f.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="skeleton" style={{ height: '300px' }} />
                    ) : tableData ? (
                        <>
                            {/* Summary Cards */}
                            {tableData.summary && (
                                <div style={{ display: 'flex', gap: 'var(--md-sys-spacing-md)', flexWrap: 'wrap', marginBottom: 'var(--md-sys-spacing-lg)' }}>
                                    {tableData.summary.map((s, i) => (
                                        <div key={i} style={{
                                            flex: '1', minWidth: '130px', padding: 'var(--md-sys-spacing-md)',
                                            background: 'var(--md-sys-color-surface-container-high)', borderRadius: '10px',
                                            borderLeft: `3px solid ${s.color || 'var(--md-sys-color-primary)'}`,
                                        }}>
                                            <div className="text-label-small text-muted">{s.label}</div>
                                            <div className="text-title-large" style={{ color: s.color }}>{s.value}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Data Table */}
                            {tableData.rows.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 'var(--md-sys-spacing-xl)' }}>
                                    <span className="material-symbols-rounded" style={{ fontSize: '48px', color: 'var(--md-sys-color-outline)' }}>search_off</span>
                                    <p className="text-muted">No data found for selected period</p>
                                </div>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="data-table">
                                        <thead>
                                            <tr>{tableData.headers.map((h, i) => <th key={i} style={tableData.rightAlignCols?.includes(i) ? { textAlign: 'right' } : {}}>{h}</th>)}</tr>
                                        </thead>
                                        <tbody>
                                            {tableData.rows.map((row, ri) => (
                                                <tr key={ri} className={String(row[0]).startsWith('—') || String(row[0]) === 'TOTAL' || String(row[2]) === 'TOTAL' ? 'total-row' : ''}>
                                                    {row.map((cell, ci) => (
                                                        <td key={ci} style={tableData.rightAlignCols?.includes(ci) ? { textAlign: 'right' } : {}}>
                                                            {typeof cell === 'number' ? formatCurrency(cell) : String(cell)}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: 'var(--md-sys-spacing-xl)' }}>
                            <span className="material-symbols-rounded" style={{ fontSize: '48px', color: 'var(--md-sys-color-outline)' }}>error</span>
                            <p className="text-muted">Could not load report</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
