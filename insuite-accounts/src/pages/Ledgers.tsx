import { useState, useEffect, useMemo } from 'react';
import db from '../db/database';
import type { Ledger, LedgerGroup, LedgerGroupNature } from '../types';
import { useCompany } from '../context/CompanyContext';
import { useConfirm } from '../components/ConfirmModal';
import { useToast } from '../components/Toast';

const NATURE_COLORS: Record<LedgerGroupNature, string> = {
    assets: '#10b981',
    liabilities: '#ef4444',
    income: '#3b82f6',
    expense: '#f59e0b',
    equity: '#8b5cf6',
};

interface LedgerWithGroup extends Ledger {
    groupName?: string;
    groupNature?: LedgerGroupNature;
}

const EMPTY_FORM = {
    name: '',
    groupId: 0,
    openingBalance: 0,
    balanceType: 'Dr' as 'Dr' | 'Cr',
    gstApplicable: false,
    gstin: '',
    gstType: '' as string,
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    pan: '',
    phone: '',
    email: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    creditLimit: 0,
    creditDays: 0,
};

const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu and Kashmir', 'Ladakh',
];

export default function Ledgers() {
    const { activeCompany } = useCompany();
    const confirm = useConfirm();
    const { showToast } = useToast();

    const [ledgers, setLedgers] = useState<LedgerWithGroup[]>([]);
    const [groups, setGroups] = useState<LedgerGroup[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterGroupId, setFilterGroupId] = useState<number | 'all'>('all');
    const [showForm, setShowForm] = useState(false);
    const [editingLedger, setEditingLedger] = useState<Ledger | null>(null);
    const [formData, setFormData] = useState({ ...EMPTY_FORM });
    const [activeTab, setActiveTab] = useState<'basic' | 'gst' | 'contact' | 'bank'>('basic');

    const companyId = activeCompany?.id;

    const loadData = async () => {
        if (!companyId) return;
        const allGroups = await db.ledgerGroups.where({ companyId }).toArray();
        setGroups(allGroups);

        const allLedgers = await db.ledgers.where({ companyId }).toArray();
        const groupMap = new Map(allGroups.map(g => [g.id!, g]));

        const enriched: LedgerWithGroup[] = allLedgers.map(l => ({
            ...l,
            groupName: groupMap.get(l.groupId)?.name || 'Unknown',
            groupNature: groupMap.get(l.groupId)?.nature,
        }));
        setLedgers(enriched);
    };

    useEffect(() => {
        loadData();
    }, [companyId]);

    const filteredLedgers = useMemo(() => {
        let result = ledgers;
        if (filterGroupId !== 'all') {
            result = result.filter(l => l.groupId === filterGroupId);
        }
        if (searchTerm.trim()) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(l =>
                l.name.toLowerCase().includes(lower) ||
                l.groupName?.toLowerCase().includes(lower) ||
                l.gstin?.toLowerCase().includes(lower) ||
                l.pan?.toLowerCase().includes(lower)
            );
        }
        return result.sort((a, b) => a.name.localeCompare(b.name));
    }, [ledgers, filterGroupId, searchTerm]);

    // Group ledgers by their group name for display
    const groupedLedgers = useMemo(() => {
        const map = new Map<string, LedgerWithGroup[]>();
        filteredLedgers.forEach(l => {
            const key = l.groupName || 'Unknown';
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(l);
        });
        return map;
    }, [filteredLedgers]);

    const openCreateForm = (groupId?: number) => {
        setFormData({ ...EMPTY_FORM, groupId: groupId || (groups[0]?.id || 0) });
        setEditingLedger(null);
        setActiveTab('basic');
        setShowForm(true);
    };

    const openEditForm = (ledger: Ledger) => {
        setFormData({
            name: ledger.name,
            groupId: ledger.groupId,
            openingBalance: ledger.openingBalance,
            balanceType: ledger.balanceType,
            gstApplicable: ledger.gstApplicable,
            gstin: ledger.gstin || '',
            gstType: ledger.gstType || '',
            address: ledger.address || '',
            city: ledger.city || '',
            state: ledger.state || '',
            pincode: ledger.pincode || '',
            country: ledger.country || 'India',
            pan: ledger.pan || '',
            phone: ledger.phone || '',
            email: ledger.email || '',
            bankName: ledger.bankName || '',
            accountNumber: ledger.accountNumber || '',
            ifscCode: ledger.ifscCode || '',
            creditLimit: ledger.creditLimit || 0,
            creditDays: ledger.creditDays || 0,
        });
        setEditingLedger(ledger);
        setActiveTab('basic');
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!companyId || !formData.name.trim()) {
            showToast('error', 'Please enter a ledger name');
            return;
        }
        if (!formData.groupId) {
            showToast('error', 'Please select a group');
            return;
        }

        const now = new Date();
        const ledgerData: Partial<Ledger> = {
            companyId,
            name: formData.name.trim(),
            groupId: formData.groupId,
            openingBalance: formData.openingBalance,
            balanceType: formData.balanceType,
            currentBalance: formData.openingBalance,
            currentBalanceType: formData.balanceType,
            gstApplicable: formData.gstApplicable,
            gstin: formData.gstin || undefined,
            gstType: (formData.gstType || undefined) as Ledger['gstType'],
            address: formData.address || undefined,
            city: formData.city || undefined,
            state: formData.state || undefined,
            pincode: formData.pincode || undefined,
            country: formData.country || undefined,
            pan: formData.pan || undefined,
            phone: formData.phone || undefined,
            email: formData.email || undefined,
            bankName: formData.bankName || undefined,
            accountNumber: formData.accountNumber || undefined,
            ifscCode: formData.ifscCode || undefined,
            creditLimit: formData.creditLimit || undefined,
            creditDays: formData.creditDays || undefined,
            isActive: true,
            updatedAt: now,
        };

        if (editingLedger) {
            await db.ledgers.update(editingLedger.id!, ledgerData);
            showToast('success', 'Ledger updated successfully');
        } else {
            await db.ledgers.add({ ...ledgerData, createdAt: now } as Ledger);
            showToast('success', 'Ledger created successfully');
        }

        setShowForm(false);
        loadData();
    };

    const handleDelete = async (ledger: Ledger) => {
        const ok = await confirm({
            title: 'Delete Ledger',
            message: `Are you sure you want to delete "${ledger.name}"? This action cannot be undone.`,
            confirmText: 'Delete',
            variant: 'danger',
        });
        if (ok) {
            await db.ledgers.delete(ledger.id!);
            showToast('success', 'Ledger deleted');
            loadData();
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const isBankGroup = (groupId: number) => {
        return groups.find(g => g.id === groupId)?.name === 'Bank Accounts';
    };

    if (!activeCompany) {
        return (
            <div className="page-container">
                <div className="empty-state">
                    <span className="material-symbols-rounded" style={{ fontSize: '64px', opacity: 0.3 }}>business</span>
                    <h3>No Company Selected</h3>
                    <p>Please create or select a company first.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h2 className="page-title">
                        <span className="material-symbols-rounded" style={{ color: 'var(--primary)' }}>menu_book</span>
                        Ledgers
                    </h2>
                    <p className="page-subtitle">
                        {filteredLedgers.length} ledger{filteredLedgers.length !== 1 ? 's' : ''} •
                        {groupedLedgers.size} group{groupedLedgers.size !== 1 ? 's' : ''}
                    </p>
                </div>
                <div className="page-header-actions">
                    <button className="btn btn-primary" onClick={() => openCreateForm()}>
                        <span className="material-symbols-rounded">add</span>
                        New Ledger
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-row">
                <div className="search-bar" style={{ flex: 1 }}>
                    <span className="material-symbols-rounded search-icon">search</span>
                    <input
                        type="text"
                        placeholder="Search ledgers by name, GSTIN, PAN..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    {searchTerm && (
                        <button className="search-clear" onClick={() => setSearchTerm('')}>
                            <span className="material-symbols-rounded">close</span>
                        </button>
                    )}
                </div>
                <select
                    className="form-input"
                    value={filterGroupId}
                    onChange={e => setFilterGroupId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    style={{ maxWidth: '250px' }}
                >
                    <option value="all">All Groups</option>
                    {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                </select>
            </div>

            {/* Ledger Cards */}
            {filteredLedgers.length === 0 ? (
                <div className="card empty-state" style={{ padding: '64px' }}>
                    <span className="material-symbols-rounded" style={{ fontSize: '64px', opacity: 0.3 }}>menu_book</span>
                    <h3>{searchTerm || filterGroupId !== 'all' ? 'No matching ledgers' : 'No ledgers yet'}</h3>
                    <p>Create your first ledger to start accounting</p>
                    <button className="btn btn-primary" onClick={() => openCreateForm()} style={{ marginTop: '16px' }}>
                        <span className="material-symbols-rounded">add</span>
                        Create Ledger
                    </button>
                </div>
            ) : (
                <div className="ledger-list">
                    {Array.from(groupedLedgers.entries()).map(([groupName, groupLedgers]) => (
                        <div key={groupName} className="ledger-group-section">
                            <div className="ledger-group-header">
                                <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>folder</span>
                                {groupName}
                                <span className="ledger-group-count">{groupLedgers.length}</span>
                            </div>
                            <div className="ledger-cards-grid">
                                {groupLedgers.map(ledger => (
                                    <div key={ledger.id} className="ledger-card card">
                                        <div className="ledger-card-header">
                                            <div>
                                                <h4 className="ledger-card-name">{ledger.name}</h4>
                                                <span className="ledger-card-group" style={{
                                                    color: NATURE_COLORS[ledger.groupNature || 'assets']
                                                }}>
                                                    {ledger.groupName}
                                                </span>
                                            </div>
                                            <div className="ledger-card-actions">
                                                <button className="icon-btn" title="Edit" onClick={() => openEditForm(ledger)}>
                                                    <span className="material-symbols-rounded">edit</span>
                                                </button>
                                                <button className="icon-btn danger" title="Delete" onClick={() => handleDelete(ledger)}>
                                                    <span className="material-symbols-rounded">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="ledger-card-balance">
                                            <span className={`balance-amount ${ledger.currentBalanceType === 'Dr' ? 'debit' : 'credit'}`}>
                                                {formatCurrency(ledger.currentBalance)}
                                            </span>
                                            <span className={`balance-type ${ledger.currentBalanceType === 'Dr' ? 'debit' : 'credit'}`}>
                                                {ledger.currentBalanceType}
                                            </span>
                                        </div>
                                        <div className="ledger-card-meta">
                                            {ledger.gstin && <span title="GSTIN">🧾 {ledger.gstin}</span>}
                                            {ledger.phone && <span title="Phone">📞 {ledger.phone}</span>}
                                            {ledger.city && <span title="City">📍 {ledger.city}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal-content ledger-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
                        <div className="modal-header">
                            <h3>{editingLedger ? 'Edit Ledger' : 'Create Ledger'}</h3>
                            <button className="modal-close" onClick={() => setShowForm(false)}>
                                <span className="material-symbols-rounded">close</span>
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="modal-tabs">
                            {(['basic', 'gst', 'contact', 'bank'] as const).map(tab => (
                                <button
                                    key={tab}
                                    className={`modal-tab ${activeTab === tab ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {tab === 'basic' ? '📋 Basic' :
                                        tab === 'gst' ? '🧾 GST' :
                                            tab === 'contact' ? '📍 Contact' : '🏦 Bank'}
                                </button>
                            ))}
                        </div>

                        <div className="modal-body">
                            {activeTab === 'basic' && (
                                <>
                                    <div className="form-group">
                                        <label className="form-label">Ledger Name *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.name}
                                            onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                            placeholder="E.g. Ravi Traders, SBI Bank"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Under Group *</label>
                                        <select
                                            className="form-input"
                                            value={formData.groupId}
                                            onChange={e => setFormData(p => ({ ...p, groupId: Number(e.target.value) }))}
                                        >
                                            <option value={0}>— Select Group —</option>
                                            {groups.map(g => (
                                                <option key={g.id} value={g.id}>{g.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group" style={{ flex: 2 }}>
                                            <label className="form-label">Opening Balance</label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                value={formData.openingBalance || ''}
                                                onChange={e => setFormData(p => ({ ...p, openingBalance: Number(e.target.value) || 0 }))}
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div className="form-group" style={{ flex: 1 }}>
                                            <label className="form-label">Type</label>
                                            <select
                                                className="form-input"
                                                value={formData.balanceType}
                                                onChange={e => setFormData(p => ({ ...p, balanceType: e.target.value as 'Dr' | 'Cr' }))}
                                            >
                                                <option value="Dr">Dr (Debit)</option>
                                                <option value="Cr">Cr (Credit)</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group" style={{ flex: 1 }}>
                                            <label className="form-label">Credit Limit</label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                value={formData.creditLimit || ''}
                                                onChange={e => setFormData(p => ({ ...p, creditLimit: Number(e.target.value) || 0 }))}
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div className="form-group" style={{ flex: 1 }}>
                                            <label className="form-label">Credit Days</label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                value={formData.creditDays || ''}
                                                onChange={e => setFormData(p => ({ ...p, creditDays: Number(e.target.value) || 0 }))}
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {activeTab === 'gst' && (
                                <>
                                    <div className="form-group">
                                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <input
                                                type="checkbox"
                                                checked={formData.gstApplicable}
                                                onChange={e => setFormData(p => ({ ...p, gstApplicable: e.target.checked }))}
                                            />
                                            GST Applicable
                                        </label>
                                    </div>
                                    {formData.gstApplicable && (
                                        <>
                                            <div className="form-group">
                                                <label className="form-label">GSTIN</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={formData.gstin}
                                                    onChange={e => setFormData(p => ({ ...p, gstin: e.target.value.toUpperCase() }))}
                                                    placeholder="22AAAAA0000A1Z5"
                                                    maxLength={15}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">GST Registration Type</label>
                                                <select
                                                    className="form-input"
                                                    value={formData.gstType}
                                                    onChange={e => setFormData(p => ({ ...p, gstType: e.target.value }))}
                                                >
                                                    <option value="">— Select —</option>
                                                    <option value="regular">Regular</option>
                                                    <option value="composition">Composition</option>
                                                    <option value="unregistered">Unregistered</option>
                                                </select>
                                            </div>
                                        </>
                                    )}
                                    <div className="form-group">
                                        <label className="form-label">PAN</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.pan}
                                            onChange={e => setFormData(p => ({ ...p, pan: e.target.value.toUpperCase() }))}
                                            placeholder="ABCDE1234F"
                                            maxLength={10}
                                        />
                                    </div>
                                </>
                            )}

                            {activeTab === 'contact' && (
                                <>
                                    <div className="form-group">
                                        <label className="form-label">Address</label>
                                        <textarea
                                            className="form-input"
                                            value={formData.address}
                                            onChange={e => setFormData(p => ({ ...p, address: e.target.value }))}
                                            placeholder="Street address"
                                            rows={2}
                                        />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group" style={{ flex: 1 }}>
                                            <label className="form-label">City</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={formData.city}
                                                onChange={e => setFormData(p => ({ ...p, city: e.target.value }))}
                                            />
                                        </div>
                                        <div className="form-group" style={{ flex: 1 }}>
                                            <label className="form-label">State</label>
                                            <select
                                                className="form-input"
                                                value={formData.state}
                                                onChange={e => setFormData(p => ({ ...p, state: e.target.value }))}
                                            >
                                                <option value="">— Select State —</option>
                                                {INDIAN_STATES.map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group" style={{ flex: 1 }}>
                                            <label className="form-label">Pincode</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={formData.pincode}
                                                onChange={e => setFormData(p => ({ ...p, pincode: e.target.value }))}
                                                maxLength={6}
                                            />
                                        </div>
                                        <div className="form-group" style={{ flex: 1 }}>
                                            <label className="form-label">Country</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={formData.country}
                                                onChange={e => setFormData(p => ({ ...p, country: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group" style={{ flex: 1 }}>
                                            <label className="form-label">Phone</label>
                                            <input
                                                type="tel"
                                                className="form-input"
                                                value={formData.phone}
                                                onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                                            />
                                        </div>
                                        <div className="form-group" style={{ flex: 1 }}>
                                            <label className="form-label">Email</label>
                                            <input
                                                type="email"
                                                className="form-input"
                                                value={formData.email}
                                                onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {activeTab === 'bank' && (
                                <>
                                    {!isBankGroup(formData.groupId) && (
                                        <div className="info-box">
                                            <span className="material-symbols-rounded">info</span>
                                            Bank details are typically used for ledgers under the "Bank Accounts" group.
                                        </div>
                                    )}
                                    <div className="form-group">
                                        <label className="form-label">Bank Name</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.bankName}
                                            onChange={e => setFormData(p => ({ ...p, bankName: e.target.value }))}
                                            placeholder="State Bank of India"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Account Number</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.accountNumber}
                                            onChange={e => setFormData(p => ({ ...p, accountNumber: e.target.value }))}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">IFSC Code</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.ifscCode}
                                            onChange={e => setFormData(p => ({ ...p, ifscCode: e.target.value.toUpperCase() }))}
                                            placeholder="SBIN0001234"
                                            maxLength={11}
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-outlined" onClick={() => setShowForm(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSave}>
                                <span className="material-symbols-rounded">save</span>
                                {editingLedger ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
