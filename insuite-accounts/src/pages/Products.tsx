import { useState, useEffect } from 'react';
import { db } from '../db/database';
import type { Product } from '../types';
import { useConfirm } from '../components/ConfirmModal';

const GST_RATES = [0, 5, 12, 18, 28];
const UNITS = ['Pcs', 'Kg', 'Ltr', 'Mtr', 'Box', 'Dozen', 'Pack', 'Set', 'Pair'];

export default function Products() {
    const [products, setProducts] = useState<Product[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        name: '',
        hsn: '',
        unit: 'Pcs',
        salePrice: 0,
        purchasePrice: 0,
        gstRate: 18,
        stock: 0,
        description: ''
    });

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        setLoading(true);
        const data = await db.products.toArray();
        setProducts(data);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (editingProduct?.id) {
            await db.products.update(editingProduct.id, {
                ...formData,
                updatedAt: new Date()
            });
        } else {
            await db.products.add({
                ...formData,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        setShowModal(false);
        resetForm();
        loadProducts();
    };

    const resetForm = () => {
        setFormData({
            name: '',
            hsn: '',
            unit: 'Pcs',
            salePrice: 0,
            purchasePrice: 0,
            gstRate: 18,
            stock: 0,
            description: ''
        });
        setEditingProduct(null);
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            hsn: product.hsn || '',
            unit: product.unit,
            salePrice: product.salePrice,
            purchasePrice: product.purchasePrice,
            gstRate: product.gstRate,
            stock: product.stock,
            description: product.description || ''
        });
        setShowModal(true);
    };

    const confirm = useConfirm();

    const handleDelete = async (id: number) => {
        const ok = await confirm({ message: 'This product will be permanently removed from your catalog.', title: 'Delete Product?', variant: 'danger' });
        if (ok) {
            await db.products.delete(id);
            loadProducts();
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.hsn && p.hsn.includes(searchTerm))
    );

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--md-sys-spacing-lg)' }}>
                <div>
                    <h1 className="text-headline-medium">Products & Items</h1>
                    <p className="text-body-medium text-muted">Manage your product catalog</p>
                </div>
                <button className="btn btn-filled" onClick={() => { resetForm(); setShowModal(true); }}>
                    <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>add</span>
                    Add Product
                </button>
            </div>

            {/* Search & Filter */}
            <div className="card" style={{ marginBottom: 'var(--md-sys-spacing-lg)' }}>
                <div style={{ display: 'flex', gap: 'var(--md-sys-spacing-md)', alignItems: 'center' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <span className="material-symbols-rounded" style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--md-sys-color-on-surface-variant)'
                        }}>search</span>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search by name or HSN..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '44px' }}
                        />
                    </div>
                    <span className="text-label-medium text-muted">
                        {filteredProducts.length} products
                    </span>
                </div>
            </div>

            {/* Products Table */}
            {loading ? (
                <div className="card" style={{ padding: 'var(--md-sys-spacing-xl)', textAlign: 'center' }}>
                    <div className="skeleton" style={{ width: '100%', height: '200px' }} />
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 'var(--md-sys-spacing-xl)' }}>
                    <span className="material-symbols-rounded" style={{ fontSize: '4rem', color: 'var(--md-sys-color-primary)', marginBottom: 'var(--md-sys-spacing-md)', display: 'block' }}>inventory_2</span>
                    <h3 className="text-title-large">No products found</h3>
                    <p className="text-body-medium text-muted" style={{ marginBottom: 'var(--md-sys-spacing-lg)' }}>
                        {searchTerm ? 'Try a different search term' : 'Add your first product to get started'}
                    </p>
                    {!searchTerm && (
                        <button className="btn btn-filled" onClick={() => setShowModal(true)}>
                            <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>add</span>
                            Add Product
                        </button>
                    )}
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Product Name</th>
                                <th>HSN</th>
                                <th>Sale Price</th>
                                <th>Purchase Price</th>
                                <th>GST</th>
                                <th>Stock</th>
                                <th style={{ width: '100px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map(product => (
                                <tr key={product.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '8px',
                                                background: 'linear-gradient(135deg, var(--md-sys-color-primary-container), var(--md-sys-color-secondary-container))',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                <span className="material-symbols-rounded" style={{ fontSize: '20px', color: 'var(--md-sys-color-on-primary-container)' }}>package_2</span>
                                            </div>
                                            <div>
                                                <div className="text-label-large">{product.name}</div>
                                                <div className="text-label-medium text-muted">{product.unit}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="text-muted">{product.hsn || '-'}</td>
                                    <td className="text-success">₹{product.salePrice.toLocaleString('en-IN')}</td>
                                    <td>₹{product.purchasePrice.toLocaleString('en-IN')}</td>
                                    <td>
                                        <span className="badge badge-primary">{product.gstRate}%</span>
                                    </td>
                                    <td>
                                        <span style={{
                                            color: product.stock < 10 ? 'var(--md-sys-color-error)' : 'inherit',
                                            fontWeight: product.stock < 10 ? 600 : 400
                                        }}>
                                            {product.stock} {product.unit}
                                        </span>
                                        {product.stock < 10 && (
                                            <span className="material-symbols-rounded" style={{
                                                fontSize: '16px',
                                                color: 'var(--md-sys-color-error)',
                                                marginLeft: '4px',
                                                verticalAlign: 'middle'
                                            }}>warning</span>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <button className="btn btn-icon" onClick={() => handleEdit(product)} title="Edit">
                                                <span className="material-symbols-rounded">edit</span>
                                            </button>
                                            <button className="btn btn-icon" onClick={() => product.id && handleDelete(product.id)} title="Delete">
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
            <button className="fab" title="Add Product" onClick={() => { resetForm(); setShowModal(true); }}>
                <span className="material-symbols-rounded" style={{ fontSize: '28px' }}>add</span>
            </button>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {editingProduct ? 'Edit Product' : 'Add New Product'}
                            </h2>
                            <button className="btn btn-icon" onClick={() => setShowModal(false)}>
                                <span className="material-symbols-rounded">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--md-sys-spacing-md)' }}>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label className="form-label form-label-required">Product Name</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Enter product name"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">HSN Code</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.hsn}
                                            onChange={e => setFormData({ ...formData, hsn: e.target.value })}
                                            placeholder="e.g. 8471"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Unit</label>
                                        <select
                                            className="form-input form-select"
                                            value={formData.unit}
                                            onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                        >
                                            {UNITS.map(unit => (
                                                <option key={unit} value={unit}>{unit}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label form-label-required">Sale Price (₹)</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={formData.salePrice}
                                            onChange={e => setFormData({ ...formData, salePrice: Number(e.target.value) })}
                                            min="0"
                                            step="0.01"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Purchase Price (₹)</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={formData.purchasePrice}
                                            onChange={e => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">GST Rate</label>
                                        <select
                                            className="form-input form-select"
                                            value={formData.gstRate}
                                            onChange={e => setFormData({ ...formData, gstRate: Number(e.target.value) })}
                                        >
                                            {GST_RATES.map(rate => (
                                                <option key={rate} value={rate}>{rate}%</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Opening Stock</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={formData.stock}
                                            onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                                            min="0"
                                        />
                                    </div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label className="form-label">Description</label>
                                        <textarea
                                            className="form-input"
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Product description (optional)"
                                            rows={3}
                                            style={{ resize: 'vertical' }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outlined" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-filled">
                                    <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>
                                        {editingProduct ? 'save' : 'add'}
                                    </span>
                                    {editingProduct ? 'Save Changes' : 'Add Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
