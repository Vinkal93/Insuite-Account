import { useState, useEffect, useMemo } from 'react';
import { db } from '../db/database';
import type { StockItem, StockGroup, Unit } from '../types';
import { useCompany } from '../context/CompanyContext';
import { useConfirm } from '../components/ConfirmModal';
import { useToast } from '../components/Toast';

const GST_RATES = [0, 5, 12, 18, 28];

interface StockItemView extends StockItem {
    groupName?: string;
    unitSymbol?: string;
}

const EMPTY_FORM = {
    name: '', groupId: 0, unitId: 0,
    openingQuantity: 0, openingRate: 0, openingValue: 0,
    gstRate: 18, hsnCode: '', salePrice: 0, purchasePrice: 0, mrp: 0,
    minimumStock: 0, reorderLevel: 0, barcode: '', description: '', partNumber: '',
};

export default function StockItems() {
    const { activeCompany } = useCompany();
    const confirm = useConfirm();
    const { showToast } = useToast();

    const [items, setItems] = useState<StockItemView[]>([]);
    const [groups, setGroups] = useState<StockGroup[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterGroupId, setFilterGroupId] = useState<number | 'all'>('all');
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<StockItem | null>(null);
    const [formData, setFormData] = useState({ ...EMPTY_FORM });
    const [activeTab, setActiveTab] = useState<'basic' | 'pricing' | 'stock' | 'extra'>('basic');

    const companyId = activeCompany?.id;

    const loadData = async () => {
        if (!companyId) return;
        const [allGroups, allUnits, allItems] = await Promise.all([
            db.stockGroups.where({ companyId }).toArray(),
            db.units.where({ companyId }).toArray(),
            db.stockItems.where({ companyId }).toArray(),
        ]);
        setGroups(allGroups);
        setUnits(allUnits);

        const groupMap = new Map(allGroups.map(g => [g.id!, g.name]));
        const unitMap = new Map(allUnits.map(u => [u.id!, u.symbol]));

        setItems(allItems.map(i => ({
            ...i,
            groupName: groupMap.get(i.groupId) || 'Unknown',
            unitSymbol: unitMap.get(i.unitId) || '?',
        })));
    };

    useEffect(() => { loadData(); }, [companyId]);

    const filtered = useMemo(() => {
        let result = items;
        if (filterGroupId !== 'all') result = result.filter(i => i.groupId === filterGroupId);
        if (searchTerm.trim()) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(i =>
                i.name.toLowerCase().includes(lower) ||
                i.hsnCode?.toLowerCase().includes(lower) ||
                i.barcode?.toLowerCase().includes(lower)
            );
        }
        return result.sort((a, b) => a.name.localeCompare(b.name));
    }, [items, filterGroupId, searchTerm]);

    const lowStockItems = items.filter(i => i.minimumStock && i.currentStock <= i.minimumStock);

    const openCreate = () => {
        setFormData({ ...EMPTY_FORM, groupId: groups[0]?.id || 0, unitId: units[0]?.id || 0 });
        setEditing(null);
        setActiveTab('basic');
        setShowForm(true);
    };

    const openEdit = (item: StockItem) => {
        setFormData({
            name: item.name, groupId: item.groupId, unitId: item.unitId,
            openingQuantity: item.openingQuantity, openingRate: item.openingRate,
            openingValue: item.openingValue, gstRate: item.gstRate,
            hsnCode: item.hsnCode || '', salePrice: item.salePrice,
            purchasePrice: item.purchasePrice, mrp: item.mrp || 0,
            minimumStock: item.minimumStock || 0, reorderLevel: item.reorderLevel || 0,
            barcode: item.barcode || '', description: item.description || '',
            partNumber: item.partNumber || '',
        });
        setEditing(item);
        setActiveTab('basic');
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!companyId || !formData.name.trim()) { showToast('error', 'Enter item name'); return; }
        if (!formData.groupId) { showToast('error', 'Select a stock group'); return; }
        if (!formData.unitId) { showToast('error', 'Select a unit'); return; }

        const openingValue = formData.openingQuantity * formData.openingRate;
        const now = new Date();

        if (editing) {
            await db.stockItems.update(editing.id!, {
                name: formData.name.trim(), groupId: formData.groupId, unitId: formData.unitId,
                openingQuantity: formData.openingQuantity, openingRate: formData.openingRate,
                openingValue, gstRate: formData.gstRate, hsnCode: formData.hsnCode || undefined,
                salePrice: formData.salePrice, purchasePrice: formData.purchasePrice,
                mrp: formData.mrp || undefined, minimumStock: formData.minimumStock || undefined,
                reorderLevel: formData.reorderLevel || undefined, barcode: formData.barcode || undefined,
                description: formData.description || undefined, partNumber: formData.partNumber || undefined,
                updatedAt: now,
            });
            showToast('success', 'Stock item updated');
        } else {
            await db.stockItems.add({
                companyId, name: formData.name.trim(), groupId: formData.groupId, unitId: formData.unitId,
                openingQuantity: formData.openingQuantity, openingRate: formData.openingRate,
                openingValue, currentStock: formData.openingQuantity,
                gstRate: formData.gstRate, hsnCode: formData.hsnCode || undefined,
                salePrice: formData.salePrice, purchasePrice: formData.purchasePrice,
                mrp: formData.mrp || undefined, minimumStock: formData.minimumStock || undefined,
                reorderLevel: formData.reorderLevel || undefined, barcode: formData.barcode || undefined,
                description: formData.description || undefined, partNumber: formData.partNumber || undefined,
                isActive: true, createdAt: now, updatedAt: now,
            });
            showToast('success', 'Stock item created');
        }
        setShowForm(false);
        loadData();
    };

    const handleDelete = async (item: StockItem) => {
        const ok = await confirm({
            title: 'Delete Stock Item', message: `Delete "${item.name}"? This cannot be undone.`,
            confirmText: 'Delete', variant: 'danger',
        });
        if (ok) { await db.stockItems.delete(item.id!); showToast('success', 'Deleted'); loadData(); }
    };

    const formatCurrency = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(n);

    if (!activeCompany) return (
        <div className="page-container"><div className="empty-state">
            <span className="material-symbols-rounded" style={{ fontSize: '64px', opacity: 0.3 }}>business</span>
            <h3>No Company Selected</h3><p>Please create or select a company first.</p>
        </div></div>
    );

    return (
        <div className="page-container">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h2 className="page-title">
                        <span className="material-symbols-rounded" style={{ color: '#8b5cf6' }}>inventory_2</span>
                        Stock Items
                    </h2>
                    <p className="page-subtitle">
                        {filtered.length} item{filtered.length !== 1 ? 's' : ''}
                        {lowStockItems.length > 0 && <span style={{ color: 'var(--md-sys-color-error)', marginLeft: '8px' }}>⚠ {lowStockItems.length} low stock</span>}
                    </p>
                </div>
                <div className="page-header-actions">
                    <button className="btn btn-primary" onClick={openCreate}>
                        <span className="material-symbols-rounded">add</span> New Item
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-row">
                <div className="search-bar" style={{ flex: 1 }}>
                    <span className="material-symbols-rounded search-icon">search</span>
                    <input type="text" placeholder="Search by name, HSN, barcode..." value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)} className="search-input" />
                    {searchTerm && <button className="search-clear" onClick={() => setSearchTerm('')}>
                        <span className="material-symbols-rounded">close</span></button>}
                </div>
                <select className="form-input" value={filterGroupId} style={{ maxWidth: '220px' }}
                    onChange={e => setFilterGroupId(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
                    <option value="all">All Groups</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
            </div>

            {/* Low Stock Alert */}
            {lowStockItems.length > 0 && (
                <div className="info-box" style={{ background: 'var(--md-sys-color-error-container)', color: 'var(--md-sys-color-on-error-container)', marginBottom: '16px' }}>
                    <span className="material-symbols-rounded">warning</span>
                    <strong>{lowStockItems.length} item{lowStockItems.length !== 1 ? 's' : ''} below minimum stock:</strong>
                    {' '}{lowStockItems.slice(0, 5).map(i => i.name).join(', ')}{lowStockItems.length > 5 ? '...' : ''}
                </div>
            )}

            {/* Item Cards */}
            {filtered.length === 0 ? (
                <div className="card empty-state" style={{ padding: '64px' }}>
                    <span className="material-symbols-rounded" style={{ fontSize: '64px', opacity: 0.3 }}>inventory_2</span>
                    <h3>{searchTerm || filterGroupId !== 'all' ? 'No matching items' : 'No stock items yet'}</h3>
                    <p>Create your first stock item</p>
                    <button className="btn btn-primary" onClick={openCreate} style={{ marginTop: '16px' }}>
                        <span className="material-symbols-rounded">add</span> Create Item
                    </button>
                </div>
            ) : (
                <div className="stock-items-grid">
                    {filtered.map(item => {
                        const isLow = item.minimumStock && item.currentStock <= item.minimumStock;
                        return (
                            <div key={item.id} className={`card stock-item-card ${isLow ? 'low-stock' : ''}`}>
                                <div className="stock-item-header">
                                    <div style={{ flex: 1 }}>
                                        <h4 className="stock-item-name">{item.name}</h4>
                                        <div className="stock-item-meta">
                                            <span className="stock-item-group">{item.groupName}</span>
                                            {item.hsnCode && <span className="stock-item-hsn">HSN: {item.hsnCode}</span>}
                                        </div>
                                    </div>
                                    <div className="stock-item-actions">
                                        <button className="icon-btn" title="Edit" onClick={() => openEdit(item)}>
                                            <span className="material-symbols-rounded">edit</span>
                                        </button>
                                        <button className="icon-btn danger" title="Delete" onClick={() => handleDelete(item)}>
                                            <span className="material-symbols-rounded">delete</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="stock-item-body">
                                    <div className="stock-item-prices">
                                        <div className="price-tag sale">
                                            <span className="price-label">Sale</span>
                                            <span className="price-value">{formatCurrency(item.salePrice)}</span>
                                        </div>
                                        <div className="price-tag purchase">
                                            <span className="price-label">Purchase</span>
                                            <span className="price-value">{formatCurrency(item.purchasePrice)}</span>
                                        </div>
                                    </div>
                                    <div className="stock-item-stock-row">
                                        <div className={`stock-qty ${isLow ? 'low' : ''}`}>
                                            <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>
                                                {isLow ? 'warning' : 'inventory'}
                                            </span>
                                            {item.currentStock} {item.unitSymbol}
                                        </div>
                                        <span className="badge badge-primary">{item.gstRate}% GST</span>
                                        {item.barcode && <span className="stock-item-barcode" title={item.barcode}>
                                            <span className="material-symbols-rounded" style={{ fontSize: '14px' }}>qr_code_2</span>
                                        </span>}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
                        <div className="modal-header">
                            <h3>{editing ? 'Edit Stock Item' : 'Create Stock Item'}</h3>
                            <button className="modal-close" onClick={() => setShowForm(false)}>
                                <span className="material-symbols-rounded">close</span></button>
                        </div>

                        <div className="modal-tabs">
                            {(['basic', 'pricing', 'stock', 'extra'] as const).map(tab => (
                                <button key={tab} className={`modal-tab ${activeTab === tab ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab)}>
                                    {tab === 'basic' ? '📋 Basic' : tab === 'pricing' ? '💰 Pricing' :
                                        tab === 'stock' ? '📦 Stock' : '🔧 Extra'}
                                </button>
                            ))}
                        </div>

                        <div className="modal-body" style={{ maxHeight: '55vh', overflowY: 'auto' }}>
                            {activeTab === 'basic' && <>
                                <div className="form-group">
                                    <label className="form-label">Item Name *</label>
                                    <input type="text" className="form-input" value={formData.name}
                                        onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                        placeholder="E.g. Samsung LED TV 55 inch" autoFocus />
                                </div>
                                <div className="form-row">
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Under Group *</label>
                                        <select className="form-input" value={formData.groupId}
                                            onChange={e => setFormData(p => ({ ...p, groupId: Number(e.target.value) }))}>
                                            <option value={0}>— Select Group —</option>
                                            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Unit *</label>
                                        <select className="form-input" value={formData.unitId}
                                            onChange={e => setFormData(p => ({ ...p, unitId: Number(e.target.value) }))}>
                                            <option value={0}>— Select Unit —</option>
                                            {units.map(u => <option key={u.id} value={u.id}>{u.symbol} ({u.formalName})</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">HSN Code</label>
                                        <input type="text" className="form-input" value={formData.hsnCode}
                                            onChange={e => setFormData(p => ({ ...p, hsnCode: e.target.value }))} placeholder="8528" />
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">GST Rate</label>
                                        <select className="form-input" value={formData.gstRate}
                                            onChange={e => setFormData(p => ({ ...p, gstRate: Number(e.target.value) }))}>
                                            {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea className="form-input" rows={2} value={formData.description}
                                        onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                        placeholder="Optional description" />
                                </div>
                            </>}

                            {activeTab === 'pricing' && <>
                                <div className="form-row">
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Sale Price (₹)</label>
                                        <input type="number" className="form-input" value={formData.salePrice || ''}
                                            onChange={e => setFormData(p => ({ ...p, salePrice: Number(e.target.value) || 0 }))}
                                            placeholder="0.00" step="0.01" />
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Purchase Price (₹)</label>
                                        <input type="number" className="form-input" value={formData.purchasePrice || ''}
                                            onChange={e => setFormData(p => ({ ...p, purchasePrice: Number(e.target.value) || 0 }))}
                                            placeholder="0.00" step="0.01" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">MRP (₹)</label>
                                    <input type="number" className="form-input" value={formData.mrp || ''}
                                        onChange={e => setFormData(p => ({ ...p, mrp: Number(e.target.value) || 0 }))}
                                        placeholder="Maximum Retail Price (optional)" step="0.01" />
                                </div>
                                {formData.salePrice > 0 && formData.purchasePrice > 0 && (
                                    <div className="info-box">
                                        <span className="material-symbols-rounded">trending_up</span>
                                        Margin: {formatCurrency(formData.salePrice - formData.purchasePrice)}
                                        ({((formData.salePrice - formData.purchasePrice) / formData.purchasePrice * 100).toFixed(1)}%)
                                    </div>
                                )}
                            </>}

                            {activeTab === 'stock' && <>
                                <div className="form-row">
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Opening Quantity</label>
                                        <input type="number" className="form-input"
                                            value={formData.openingQuantity || ''}
                                            onChange={e => {
                                                const qty = Number(e.target.value) || 0;
                                                setFormData(p => ({ ...p, openingQuantity: qty, openingValue: qty * p.openingRate }));
                                            }} placeholder="0" />
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Opening Rate (₹)</label>
                                        <input type="number" className="form-input"
                                            value={formData.openingRate || ''}
                                            onChange={e => {
                                                const rate = Number(e.target.value) || 0;
                                                setFormData(p => ({ ...p, openingRate: rate, openingValue: p.openingQuantity * rate }));
                                            }} placeholder="0.00" step="0.01" />
                                    </div>
                                </div>
                                {formData.openingQuantity > 0 && formData.openingRate > 0 && (
                                    <div className="info-box">
                                        <span className="material-symbols-rounded">calculate</span>
                                        Opening Value: {formatCurrency(formData.openingQuantity * formData.openingRate)}
                                    </div>
                                )}
                                <div className="form-row">
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Minimum Stock Alert</label>
                                        <input type="number" className="form-input" value={formData.minimumStock || ''}
                                            onChange={e => setFormData(p => ({ ...p, minimumStock: Number(e.target.value) || 0 }))}
                                            placeholder="Alert below this qty" />
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Reorder Level</label>
                                        <input type="number" className="form-input" value={formData.reorderLevel || ''}
                                            onChange={e => setFormData(p => ({ ...p, reorderLevel: Number(e.target.value) || 0 }))}
                                            placeholder="Order when below this" />
                                    </div>
                                </div>
                            </>}

                            {activeTab === 'extra' && <>
                                <div className="form-group">
                                    <label className="form-label">Barcode</label>
                                    <input type="text" className="form-input" value={formData.barcode}
                                        onChange={e => setFormData(p => ({ ...p, barcode: e.target.value }))}
                                        placeholder="Scan or enter barcode" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Part Number</label>
                                    <input type="text" className="form-input" value={formData.partNumber}
                                        onChange={e => setFormData(p => ({ ...p, partNumber: e.target.value }))}
                                        placeholder="Manufacturer part number" />
                                </div>
                            </>}
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-outlined" onClick={() => setShowForm(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSave}>
                                <span className="material-symbols-rounded">save</span>
                                {editing ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
