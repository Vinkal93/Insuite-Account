import { useState, useEffect } from 'react';
import { db } from '../db/database';
import { useConfirm } from '../components/ConfirmModal';
import type { Invoice, InvoiceItem, Party, Product } from '../types';

const INVOICE_TYPES = [
    { value: 'tax_invoice', label: 'Tax Invoice', icon: 'receipt_long' },
    { value: 'bill_of_supply', label: 'Bill of Supply', icon: 'description' },
    { value: 'proforma', label: 'Proforma', icon: 'draft' },
];

interface LineItem extends InvoiceItem {
    productName: string;
}

export default function Sales() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [parties, setParties] = useState<Party[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    // Invoice form state
    const [invoiceForm, setInvoiceForm] = useState({
        invoiceNumber: '',
        invoiceType: 'tax_invoice' as 'tax_invoice' | 'bill_of_supply' | 'proforma',
        partyId: 0,
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        notes: ''
    });

    const [lineItems, setLineItems] = useState<LineItem[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [invoicesData, partiesData, productsData] = await Promise.all([
            db.invoices.toArray(),
            db.parties.where('type').anyOf(['customer', 'both']).toArray(),
            db.products.toArray()
        ]);
        setInvoices(invoicesData);
        setParties(partiesData);
        setProducts(productsData);
        generateInvoiceNumber(invoicesData.length);
        setLoading(false);
    };

    const generateInvoiceNumber = (count: number) => {
        const year = new Date().getFullYear();
        const num = String(count + 1).padStart(4, '0');
        setInvoiceForm(prev => ({ ...prev, invoiceNumber: `INV-${year}-${num}` }));
    };

    const addLineItem = () => {
        setLineItems([...lineItems, {
            productName: '',
            description: '',
            hsn: '',
            quantity: 1,
            unit: 'Pcs',
            rate: 0,
            discountPercent: 0,
            discountAmount: 0,
            taxableValue: 0,
            gstRate: 18,
            cgst: 0,
            sgst: 0,
            igst: 0,
            total: 0
        }]);
    };

    const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
        const updated = [...lineItems];
        (updated[index] as Record<string, string | number>)[field] = value;

        // If product selected, auto-fill details
        if (field === 'productId') {
            const product = products.find(p => p.id === Number(value));
            if (product) {
                updated[index].productName = product.name;
                updated[index].description = product.name;
                updated[index].hsn = product.hsn || '';
                updated[index].unit = product.unit;
                updated[index].rate = product.salePrice;
                updated[index].gstRate = product.gstRate;
            }
        }

        // Recalculate
        const item = updated[index];
        const subtotal = item.quantity * item.rate;
        item.discountAmount = (subtotal * item.discountPercent) / 100;
        item.taxableValue = subtotal - item.discountAmount;
        const taxAmount = (item.taxableValue * item.gstRate) / 100;
        item.cgst = taxAmount / 2;
        item.sgst = taxAmount / 2;
        item.igst = 0; // For intra-state
        item.total = item.taxableValue + taxAmount;

        setLineItems(updated);
    };

    const removeLineItem = (index: number) => {
        setLineItems(lineItems.filter((_, i) => i !== index));
    };

    const calculateTotals = () => {
        const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
        const discount = lineItems.reduce((sum, item) => sum + item.discountAmount, 0);
        const taxable = lineItems.reduce((sum, item) => sum + item.taxableValue, 0);
        const cgst = lineItems.reduce((sum, item) => sum + item.cgst, 0);
        const sgst = lineItems.reduce((sum, item) => sum + item.sgst, 0);
        const totalTax = cgst + sgst;
        const grandTotal = taxable + totalTax;
        const roundOff = Math.round(grandTotal) - grandTotal;

        return { subtotal, discount, taxable, cgst, sgst, totalTax, grandTotal: Math.round(grandTotal), roundOff };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const totals = calculateTotals();

        const invoice: Omit<Invoice, 'id'> = {
            invoiceNumber: invoiceForm.invoiceNumber,
            invoiceType: invoiceForm.invoiceType,
            partyId: invoiceForm.partyId,
            invoiceDate: new Date(invoiceForm.invoiceDate),
            dueDate: invoiceForm.dueDate ? new Date(invoiceForm.dueDate) : undefined,
            items: lineItems.map(({ productName, ...item }) => item),
            subtotal: totals.subtotal,
            discountType: 'percent',
            discountValue: 0,
            discountAmount: totals.discount,
            taxableAmount: totals.taxable,
            cgst: totals.cgst,
            sgst: totals.sgst,
            igst: 0,
            totalTax: totals.totalTax,
            grandTotal: totals.grandTotal,
            roundOff: totals.roundOff,
            notes: invoiceForm.notes,
            isPaid: false,
            paidAmount: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        await db.invoices.add(invoice);
        setShowModal(false);
        resetForm();
        loadData();
    };

    const resetForm = () => {
        setInvoiceForm({
            invoiceNumber: '',
            invoiceType: 'tax_invoice',
            partyId: 0,
            invoiceDate: new Date().toISOString().split('T')[0],
            dueDate: '',
            notes: ''
        });
        setLineItems([]);
        generateInvoiceNumber(invoices.length);
    };

    const confirm = useConfirm();

    const handleDelete = async (id: number) => {
        const ok = await confirm({ message: 'This invoice will be permanently deleted.', title: 'Delete Invoice?', variant: 'danger' });
        if (ok) {
            await db.invoices.delete(id);
            loadData();
        }
    };

    const filteredInvoices = invoices.filter(inv => {
        const matchesTab = activeTab === 'all' || inv.invoiceType === activeTab;
        const matchesSearch = inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const getPartyName = (partyId: number) => parties.find(p => p.id === partyId)?.name || 'Unknown';
    const totals = calculateTotals();

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--md-sys-spacing-lg)' }}>
                <div>
                    <h1 className="text-headline-medium">Sales & Invoices</h1>
                    <p className="text-body-medium text-muted">Create and manage sales invoices</p>
                </div>
                <button className="btn btn-filled" onClick={() => { resetForm(); addLineItem(); setShowModal(true); }}>
                    <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>add</span>
                    New Invoice
                </button>
            </div>

            {/* Invoice Type Tabs */}
            <div className="card" style={{ marginBottom: 'var(--md-sys-spacing-lg)' }}>
                <div style={{ display: 'flex', gap: 'var(--md-sys-spacing-sm)', flexWrap: 'wrap' }}>
                    <button
                        className={`btn ${activeTab === 'all' ? 'btn-filled' : 'btn-outlined'}`}
                        onClick={() => setActiveTab('all')}
                    >
                        All Invoices
                    </button>
                    {INVOICE_TYPES.map(type => (
                        <button
                            key={type.value}
                            className={`btn ${activeTab === type.value ? 'btn-filled' : 'btn-outlined'}`}
                            onClick={() => setActiveTab(type.value)}
                        >
                            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>{type.icon}</span>
                            {type.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Search */}
            <div className="card" style={{ marginBottom: 'var(--md-sys-spacing-lg)' }}>
                <div style={{ display: 'flex', gap: 'var(--md-sys-spacing-md)', alignItems: 'center' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <span className="material-symbols-rounded" style={{
                            position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                            color: 'var(--md-sys-color-on-surface-variant)'
                        }}>search</span>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search by invoice number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '44px' }}
                        />
                    </div>
                    <span className="text-label-medium text-muted">{filteredInvoices.length} invoices</span>
                </div>
            </div>

            {/* Invoices List */}
            {loading ? (
                <div className="card"><div className="skeleton" style={{ height: '200px' }} /></div>
            ) : filteredInvoices.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 'var(--md-sys-spacing-xl)' }}>
                    <span className="material-symbols-rounded" style={{ fontSize: '4rem', color: 'var(--md-sys-color-primary)', marginBottom: 'var(--md-sys-spacing-md)', display: 'block' }}>receipt_long</span>
                    <h3 className="text-title-large">No invoices yet</h3>
                    <p className="text-body-medium text-muted" style={{ marginBottom: 'var(--md-sys-spacing-lg)' }}>
                        Create your first sales invoice to get started
                    </p>
                    <button className="btn btn-filled" onClick={() => { resetForm(); addLineItem(); setShowModal(true); }}>
                        <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>add</span>
                        Create Invoice
                    </button>
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Invoice #</th>
                                <th>Date</th>
                                <th>Party</th>
                                <th>Type</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvoices.map(inv => (
                                <tr key={inv.id}>
                                    <td className="text-label-large">{inv.invoiceNumber}</td>
                                    <td>{new Date(inv.invoiceDate).toLocaleDateString('en-IN')}</td>
                                    <td>{getPartyName(inv.partyId)}</td>
                                    <td>
                                        <span className="badge badge-primary">
                                            {INVOICE_TYPES.find(t => t.value === inv.invoiceType)?.label}
                                        </span>
                                    </td>
                                    <td className="text-success">₹{inv.grandTotal.toLocaleString('en-IN')}</td>
                                    <td>
                                        <span className={`badge ${inv.isPaid ? 'badge-success' : 'badge-warning'}`}>
                                            {inv.isPaid ? 'Paid' : 'Unpaid'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <button className="btn btn-icon" title="View">
                                                <span className="material-symbols-rounded">visibility</span>
                                            </button>
                                            <button className="btn btn-icon" title="Print">
                                                <span className="material-symbols-rounded">print</span>
                                            </button>
                                            <button className="btn btn-icon" onClick={() => inv.id && handleDelete(inv.id)} title="Delete">
                                                <span className="material-symbols-rounded" style={{ color: 'var(--md-sys-color-error)' }}>delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* FAB */}
            <button className="fab" title="New Invoice" onClick={() => { resetForm(); addLineItem(); setShowModal(true); }}>
                <span className="material-symbols-rounded" style={{ fontSize: '28px' }}>add</span>
            </button>

            {/* Create Invoice Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflow: 'auto' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">Create New Invoice</h2>
                            <button className="btn btn-icon" onClick={() => setShowModal(false)}>
                                <span className="material-symbols-rounded">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                {/* Invoice Details */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--md-sys-spacing-md)', marginBottom: 'var(--md-sys-spacing-lg)' }}>
                                    <div className="form-group">
                                        <label className="form-label">Invoice #</label>
                                        <input type="text" className="form-input" value={invoiceForm.invoiceNumber} readOnly />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Type</label>
                                        <select
                                            className="form-input form-select"
                                            value={invoiceForm.invoiceType}
                                            onChange={e => setInvoiceForm({ ...invoiceForm, invoiceType: e.target.value as 'tax_invoice' | 'bill_of_supply' | 'proforma' })}
                                        >
                                            {INVOICE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Invoice Date</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={invoiceForm.invoiceDate}
                                            onChange={e => setInvoiceForm({ ...invoiceForm, invoiceDate: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Due Date</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={invoiceForm.dueDate}
                                            onChange={e => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Party Selection */}
                                <div className="form-group">
                                    <label className="form-label form-label-required">Select Customer</label>
                                    <select
                                        className="form-input form-select"
                                        value={invoiceForm.partyId}
                                        onChange={e => setInvoiceForm({ ...invoiceForm, partyId: Number(e.target.value) })}
                                        required
                                    >
                                        <option value={0}>-- Select Customer --</option>
                                        {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>

                                {/* Line Items */}
                                <div style={{ marginBottom: 'var(--md-sys-spacing-lg)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--md-sys-spacing-md)' }}>
                                        <h3 className="text-title-large">Items</h3>
                                        <button type="button" className="btn btn-outlined" onClick={addLineItem}>
                                            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>add</span>
                                            Add Item
                                        </button>
                                    </div>

                                    <div style={{ overflowX: 'auto' }}>
                                        <table className="data-table" style={{ minWidth: '800px' }}>
                                            <thead>
                                                <tr>
                                                    <th style={{ width: '200px' }}>Product</th>
                                                    <th>HSN</th>
                                                    <th>Qty</th>
                                                    <th>Rate (₹)</th>
                                                    <th>Disc %</th>
                                                    <th>GST %</th>
                                                    <th>Total (₹)</th>
                                                    <th></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {lineItems.map((item, index) => (
                                                    <tr key={index}>
                                                        <td>
                                                            <select
                                                                className="form-input form-select"
                                                                style={{ minWidth: '150px' }}
                                                                value={item.productId || ''}
                                                                onChange={e => updateLineItem(index, 'productId', Number(e.target.value))}
                                                            >
                                                                <option value="">Select Product</option>
                                                                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                            </select>
                                                        </td>
                                                        <td><input type="text" className="form-input" value={item.hsn} onChange={e => updateLineItem(index, 'hsn', e.target.value)} style={{ width: '80px' }} /></td>
                                                        <td><input type="number" className="form-input" value={item.quantity} onChange={e => updateLineItem(index, 'quantity', Number(e.target.value))} min="1" style={{ width: '60px' }} /></td>
                                                        <td><input type="number" className="form-input" value={item.rate} onChange={e => updateLineItem(index, 'rate', Number(e.target.value))} step="0.01" style={{ width: '80px' }} /></td>
                                                        <td><input type="number" className="form-input" value={item.discountPercent} onChange={e => updateLineItem(index, 'discountPercent', Number(e.target.value))} min="0" max="100" style={{ width: '60px' }} /></td>
                                                        <td>
                                                            <select className="form-input form-select" value={item.gstRate} onChange={e => updateLineItem(index, 'gstRate', Number(e.target.value))} style={{ width: '70px' }}>
                                                                {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
                                                            </select>
                                                        </td>
                                                        <td className="text-success">₹{item.total.toFixed(2)}</td>
                                                        <td>
                                                            <button type="button" className="btn btn-icon" onClick={() => removeLineItem(index)}>
                                                                <span className="material-symbols-rounded" style={{ color: 'var(--md-sys-color-error)' }}>delete</span>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Totals */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <div style={{ width: '300px', background: 'var(--md-sys-color-surface-container-high)', padding: 'var(--md-sys-spacing-md)', borderRadius: 'var(--md-sys-shape-corner-md)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span className="text-muted">Subtotal</span>
                                            <span>₹{totals.subtotal.toFixed(2)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span className="text-muted">Discount</span>
                                            <span className="text-error">-₹{totals.discount.toFixed(2)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span className="text-muted">CGST</span>
                                            <span>₹{totals.cgst.toFixed(2)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span className="text-muted">SGST</span>
                                            <span>₹{totals.sgst.toFixed(2)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span className="text-muted">Round Off</span>
                                            <span>₹{totals.roundOff.toFixed(2)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--md-sys-color-outline-variant)', fontWeight: 600 }}>
                                            <span>Grand Total</span>
                                            <span className="text-success">₹{totals.grandTotal.toLocaleString('en-IN')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outlined" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-filled" disabled={lineItems.length === 0 || !invoiceForm.partyId}>
                                    <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>save</span>
                                    Save Invoice
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
