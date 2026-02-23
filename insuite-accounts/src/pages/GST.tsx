import { useState, useEffect } from 'react';
import { db } from '../db/database';
import type { Invoice } from '../types';

export default function GST() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [selectedPeriod, setSelectedPeriod] = useState('monthly');
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [selectedMonth]);

    const loadData = async () => {
        setLoading(true);
        const [year, month] = selectedMonth.split('-').map(Number);
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        endDate.setHours(23, 59, 59);

        const data = await db.invoices.where('invoiceDate').between(startDate, endDate).toArray();
        setInvoices(data);
        setLoading(false);
    };

    // Calculate GST summary
    const gstSummary = {
        totalSales: invoices.reduce((sum, inv) => sum + inv.grandTotal, 0),
        taxableValue: invoices.reduce((sum, inv) => sum + inv.taxableAmount, 0),
        cgst: invoices.reduce((sum, inv) => sum + inv.cgst, 0),
        sgst: invoices.reduce((sum, inv) => sum + inv.sgst, 0),
        igst: invoices.reduce((sum, inv) => sum + inv.igst, 0),
        totalTax: invoices.reduce((sum, inv) => sum + inv.totalTax, 0)
    };

    // HSN-wise summary
    const hsnSummary: Record<string, { hsn: string, taxableValue: number, cgst: number, sgst: number, igst: number }> = {};
    invoices.forEach(inv => {
        inv.items.forEach(item => {
            const hsn = item.hsn || 'N/A';
            if (!hsnSummary[hsn]) {
                hsnSummary[hsn] = { hsn, taxableValue: 0, cgst: 0, sgst: 0, igst: 0 };
            }
            hsnSummary[hsn].taxableValue += item.taxableValue;
            hsnSummary[hsn].cgst += item.cgst;
            hsnSummary[hsn].sgst += item.sgst;
            hsnSummary[hsn].igst += item.igst;
        });
    });

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--md-sys-spacing-lg)' }}>
                <div>
                    <h1 className="text-headline-medium">GST Returns</h1>
                    <p className="text-body-medium text-muted">View GST reports and filing data</p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--md-sys-spacing-md)', alignItems: 'center' }}>
                    <input
                        type="month"
                        className="form-input"
                        value={selectedMonth}
                        onChange={e => setSelectedMonth(e.target.value)}
                    />
                </div>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--md-sys-spacing-lg)', marginBottom: 'var(--md-sys-spacing-xl)' }}>
                <div className="card card-gradient">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <span className="material-symbols-rounded" style={{ fontSize: '24px', color: 'var(--md-sys-color-success)' }}>trending_up</span>
                        <span className="text-label-medium text-muted">Total Sales</span>
                    </div>
                    <div className="text-headline-medium">₹{gstSummary.totalSales.toLocaleString('en-IN')}</div>
                </div>
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <span className="material-symbols-rounded" style={{ fontSize: '24px', color: 'var(--md-sys-color-primary)' }}>receipt</span>
                        <span className="text-label-medium text-muted">Taxable Value</span>
                    </div>
                    <div className="text-headline-medium">₹{gstSummary.taxableValue.toLocaleString('en-IN')}</div>
                </div>
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <span className="material-symbols-rounded" style={{ fontSize: '24px', color: '#f59e0b' }}>account_balance</span>
                        <span className="text-label-medium text-muted">CGST + SGST</span>
                    </div>
                    <div className="text-headline-medium">₹{(gstSummary.cgst + gstSummary.sgst).toLocaleString('en-IN')}</div>
                </div>
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <span className="material-symbols-rounded" style={{ fontSize: '24px', color: 'var(--md-sys-color-error)' }}>payments</span>
                        <span className="text-label-medium text-muted">Total GST</span>
                    </div>
                    <div className="text-headline-medium text-error">₹{gstSummary.totalTax.toLocaleString('en-IN')}</div>
                </div>
            </div>

            {/* Report Type Selection */}
            <div className="card" style={{ marginBottom: 'var(--md-sys-spacing-lg)' }}>
                <div style={{ display: 'flex', gap: 'var(--md-sys-spacing-sm)' }}>
                    <button className={`btn ${selectedPeriod === 'monthly' ? 'btn-filled' : 'btn-outlined'}`} onClick={() => setSelectedPeriod('monthly')}>
                        <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>calendar_month</span>
                        GSTR-1 (Monthly)
                    </button>
                    <button className={`btn ${selectedPeriod === 'quarterly' ? 'btn-filled' : 'btn-outlined'}`} onClick={() => setSelectedPeriod('quarterly')}>
                        <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>date_range</span>
                        GSTR-3B
                    </button>
                    <button className={`btn ${selectedPeriod === 'hsn' ? 'btn-filled' : 'btn-outlined'}`} onClick={() => setSelectedPeriod('hsn')}>
                        <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>tag</span>
                        HSN Summary
                    </button>
                </div>
            </div>

            {/* GSTR-1 Report */}
            {selectedPeriod === 'monthly' && (
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--md-sys-spacing-lg)' }}>
                        <h3 className="text-title-large" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="material-symbols-rounded" style={{ color: 'var(--md-sys-color-primary)' }}>description</span>
                            GSTR-1 Summary
                        </h3>
                        <button className="btn btn-filled">
                            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>download</span>
                            Export JSON
                        </button>
                    </div>

                    {loading ? (
                        <div className="skeleton" style={{ height: '200px' }} />
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th>No. of Invoices</th>
                                    <th>Taxable Value (₹)</th>
                                    <th>CGST (₹)</th>
                                    <th>SGST (₹)</th>
                                    <th>Total Tax (₹)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>B2B - Registered Parties</td>
                                    <td>{invoices.length}</td>
                                    <td>{gstSummary.taxableValue.toLocaleString('en-IN')}</td>
                                    <td>{gstSummary.cgst.toLocaleString('en-IN')}</td>
                                    <td>{gstSummary.sgst.toLocaleString('en-IN')}</td>
                                    <td className="text-success">{gstSummary.totalTax.toLocaleString('en-IN')}</td>
                                </tr>
                                <tr style={{ fontWeight: 600, background: 'var(--md-sys-color-surface-container-high)' }}>
                                    <td>Total</td>
                                    <td>{invoices.length}</td>
                                    <td>{gstSummary.taxableValue.toLocaleString('en-IN')}</td>
                                    <td>{gstSummary.cgst.toLocaleString('en-IN')}</td>
                                    <td>{gstSummary.sgst.toLocaleString('en-IN')}</td>
                                    <td className="text-success">{gstSummary.totalTax.toLocaleString('en-IN')}</td>
                                </tr>
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* HSN Summary */}
            {selectedPeriod === 'hsn' && (
                <div className="card">
                    <h3 className="text-title-large" style={{ marginBottom: 'var(--md-sys-spacing-lg)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="material-symbols-rounded" style={{ color: 'var(--md-sys-color-primary)' }}>tag</span>
                        HSN-wise Summary
                    </h3>
                    {Object.values(hsnSummary).length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 'var(--md-sys-spacing-xl)' }}>
                            <span className="material-symbols-rounded" style={{ fontSize: '48px', color: 'var(--md-sys-color-outline)' }}>inventory</span>
                            <p className="text-muted">No data for selected period</p>
                        </div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>HSN Code</th>
                                    <th>Taxable Value (₹)</th>
                                    <th>CGST (₹)</th>
                                    <th>SGST (₹)</th>
                                    <th>IGST (₹)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.values(hsnSummary).map(item => (
                                    <tr key={item.hsn}>
                                        <td className="text-label-large">{item.hsn}</td>
                                        <td>{item.taxableValue.toLocaleString('en-IN')}</td>
                                        <td>{item.cgst.toLocaleString('en-IN')}</td>
                                        <td>{item.sgst.toLocaleString('en-IN')}</td>
                                        <td>{item.igst.toLocaleString('en-IN')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* GSTR-3B Placeholder */}
            {selectedPeriod === 'quarterly' && (
                <div className="card" style={{ textAlign: 'center', padding: 'var(--md-sys-spacing-xl)' }}>
                    <span className="material-symbols-rounded" style={{ fontSize: '64px', color: 'var(--md-sys-color-primary)', marginBottom: 'var(--md-sys-spacing-md)', display: 'block' }}>construction</span>
                    <h3 className="text-title-large">GSTR-3B Coming Soon</h3>
                    <p className="text-body-medium text-muted">
                        Quarterly return filing with input tax credit calculation
                    </p>
                </div>
            )}
        </div>
    );
}
