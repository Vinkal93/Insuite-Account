import { useState, useEffect } from 'react';
import { db } from '../db/database';
import type { Purchase, PurchaseItem, Party, Product } from '../types';

interface LineItem extends PurchaseItem {
    productName: string;
}

export default function Purchases() {
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [parties, setParties] = useState<Party[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    const [purchaseForm, setPurchaseForm] = useState({
        billNumber: '',
        partyId: 0,
        billDate: new Date().toISOString().split('T')[0],
        dueDate: ''
    });

    const [lineItems, setLineItems] = useState<LineItem[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [purchasesData, partiesData, productsData] = await Promise.all([
            db.purchases.toArray(),
            db.parties.where('type').anyOf(['vendor', 'both']).toArray(),
            db.products.toArray()
        ]);
        setPurchases(purchasesData);
        setParties(partiesData);
        setProducts(productsData);
        setLoading(false);
    };

    const addLineItem = () => {
        setLineItems([...lineItems, {
            productName: '',
            description: '',
            hsn: '',
            quantity: 1,
            unit: 'Pcs',
            rate: 0,
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

        if (field === 'productId') {
            const product = products.find(p => p.id === Number(value));
            if (product) {
                updated[index].productName = product.name;
                updated[index].description = product.name;
                updated[index].hsn = product.hsn || '';
                updated[index].unit = product.unit;
                updated[index].rate = product.purchasePrice;
                updated[index].gstRate = product.gstRate;
            }
        }

        const item = updated[index];
        item.taxableValue = item.quantity * item.rate;
        const taxAmount = (item.taxableValue * item.gstRate) / 100;
        item.cgst = taxAmount / 2;
        item.sgst = taxAmount / 2;
        item.total = item.taxableValue + taxAmount;

        setLineItems(updated);
    };

    const removeLineItem = (index: number) => {
        setLineItems(lineItems.filter((_, i) => i !== index));
    };

    const calculateTotals = () => {
        const subtotal = lineItems.reduce((sum, item) => sum + item.taxableValue, 0);
        const cgst = lineItems.reduce((sum, item) => sum + item.cgst, 0);
        const sgst = lineItems.reduce((sum, item) => sum + item.sgst, 0);
        const totalTax = cgst + sgst;
        const grandTotal = subtotal + totalTax;
        return { subtotal, cgst, sgst, totalTax, grandTotal: Math.round(grandTotal) };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const totals = calculateTotals();

        const purchase: Omit<Purchase, 'id'> = {
            billNumber: purchaseForm.billNumber,
            partyId: purchaseForm.partyId,
            billDate: new Date(purchaseForm.billDate),
            dueDate: purchaseForm.dueDate ? new Date(purchaseForm.dueDate) : undefined,
            items: lineItems.map(({ productName, ...item }) => item),
            subtotal: totals.subtotal,
            discountAmount: 0,
            taxableAmount: totals.subtotal,
            cgst: totals.cgst,
            sgst: totals.sgst,
            igst: 0,
            totalTax: totals.totalTax,
            grandTotal: totals.grandTotal,
            isPaid: false,
            paidAmount: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        await db.purchases.add(purchase);
        setShowModal(false);
        resetForm();
        loadData();
    };

    const resetForm = () => {
        setPurchaseForm({
            billNumber: '',
            partyId: 0,
            billDate: new Date().toISOString().split('T')[0],
            dueDate: ''
        });
        setLineItems([]);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this purchase?')) {
            await db.purchases.delete(id);
            loadData();
        }
    };

    const filteredPurchases = purchases.filter(p =>
        p.billNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getPartyName = (partyId: number) => parties.find(p => p.id === partyId)?.name || 'Unknown';
    const totals = calculateTotals();

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--md-sys-spacing-lg)' }}>
                <div>
                    <h1 className="text-headline-medium">Purchases</h1>
                    <p className="text-body-medium text-muted">Record and track purchase bills</p>
                </div>
                <button className="btn btn-filled" onClick={() => { resetForm(); addLineItem(); setShowModal(true); }}>
                    <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>add</span>
                    Add Purchase
                </button>
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
                            placeholder="Search by bill number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '44px' }}
                        />
                    </div>
                    <span className="text-label-medium text-muted">{filteredPurchases.length} purchases</span>
                </div>
            </div>

            {/* Purchases List */}
            {loading ? (
                <div className="card"><div className="skeleton" style={{ height: '200px' }} /></div>
            ) : filteredPurchases.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 'var(--md-sys-spacing-xl)' }}>
                    <span className="material-symbols-rounded" style={{ fontSize: '4rem', color: 'var(--md-sys-color-primary)', marginBottom: 'var(--md-sys-spacing-md)', display: 'block' }}>shopping_cart</span>
                    <h3 className="text-title-large">No purchases recorded</h3>
                    <p className="text-body-medium text-muted" style={{ marginBottom: 'var(--md-sys-spacing-lg)' }}>
                        Record your first purchase bill
                    </p>
                    <button className="btn btn-filled" onClick={() => { resetForm(); addLineItem(); setShowModal(true); }}>
                        <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>add</span>
                        Add Purchase
                    </button>
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Bill #</th>
                                <th>Date</th>
                                <th>Vendor</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPurchases.map(purchase => (
                                <tr key={purchase.id}>
                                    <td className="text-label-large">{purchase.billNumber}</td>
                                    <td>{new Date(purchase.billDate).toLocaleDateString('en-IN')}</td>
                                    <td>{getPartyName(purchase.partyId)}</td>
                                    <td>₹{purchase.grandTotal.toLocaleString('en-IN')}</td>
                                    <td>
                                        <span className={`badge ${purchase.isPaid ? 'badge-success' : 'badge-warning'}`}>
                                            {purchase.isPaid ? 'Paid' : 'Unpaid'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <button className="btn btn-icon" title="View">
                                                <span className="material-symbols-rounded">visibility</span>
                                            </button>
                                            <button className="btn btn-icon" onClick={() => purchase.id && handleDelete(purchase.id)} title="Delete">
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
            <button className="fab" title="Add Purchase" onClick={() => { resetForm(); addLineItem(); setShowModal(true); }}>
                <span className="material-symbols-rounded" style={{ fontSize: '28px' }}>add</span>
            </button>

            {/* Create Purchase Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">Add Purchase Bill</h2>
                            <button className="btn btn-icon" onClick={() => setShowModal(false)}>
                                <span className="material-symbols-rounded">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--md-sys-spacing-md)', marginBottom: 'var(--md-sys-spacing-lg)' }}>
                                    <div className="form-group">
                                        <label className="form-label form-label-required">Bill Number</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={purchaseForm.billNumber}
                                            onChange={e => setPurchaseForm({ ...purchaseForm, billNumber: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label form-label-required">Vendor</label>
                                        <select
                                            className="form-input form-select"
                                            value={purchaseForm.partyId}
                                            onChange={e => setPurchaseForm({ ...purchaseForm, partyId: Number(e.target.value) })}
                                            required
                                        >
                                            <option value={0}>-- Select Vendor --</option>
                                            {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Bill Date</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={purchaseForm.billDate}
                                            onChange={e => setPurchaseForm({ ...purchaseForm, billDate: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Due Date</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={purchaseForm.dueDate}
                                            onChange={e => setPurchaseForm({ ...purchaseForm, dueDate: e.target.value })}
                                        />
                                    </div>
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
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>Product</th>
                                                    <th>Qty</th>
                                                    <th>Rate (₹)</th>
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
                                                                value={item.productId || ''}
                                                                onChange={e => updateLineItem(index, 'productId', Number(e.target.value))}
                                                            >
                                                                <option value="">Select Product</option>
                                                                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                            </select>
                                                        </td>
                                                        <td><input type="number" className="form-input" value={item.quantity} onChange={e => updateLineItem(index, 'quantity', Number(e.target.value))} min="1" style={{ width: '70px' }} /></td>
                                                        <td><input type="number" className="form-input" value={item.rate} onChange={e => updateLineItem(index, 'rate', Number(e.target.value))} style={{ width: '90px' }} /></td>
                                                        <td>
                                                            <select className="form-input form-select" value={item.gstRate} onChange={e => updateLineItem(index, 'gstRate', Number(e.target.value))} style={{ width: '70px' }}>
                                                                {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
                                                            </select>
                                                        </td>
                                                        <td>₹{item.total.toFixed(2)}</td>
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
                                    <div style={{ width: '280px', background: 'var(--md-sys-color-surface-container-high)', padding: 'var(--md-sys-spacing-md)', borderRadius: 'var(--md-sys-shape-corner-md)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span className="text-muted">Subtotal</span>
                                            <span>₹{totals.subtotal.toFixed(2)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span className="text-muted">CGST + SGST</span>
                                            <span>₹{totals.totalTax.toFixed(2)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--md-sys-color-outline-variant)', fontWeight: 600 }}>
                                            <span>Grand Total</span>
                                            <span>₹{totals.grandTotal.toLocaleString('en-IN')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outlined" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-filled" disabled={lineItems.length === 0 || !purchaseForm.partyId || !purchaseForm.billNumber}>
                                    <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>save</span>
                                    Save Purchase
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
