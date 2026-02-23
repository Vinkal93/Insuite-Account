import { useEffect, useState } from 'react';
import db from '../db/database';
import { useConfirm } from '../components/ConfirmModal';
import type { Party } from '../types';

export default function Parties() {
    const [parties, setParties] = useState<Party[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'customer' | 'vendor'>('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingParty, setEditingParty] = useState<Party | null>(null);

    const confirm = useConfirm();

    useEffect(() => {
        loadParties();
    }, []);

    async function loadParties() {
        const allParties = await db.parties.toArray();
        setParties(allParties);
    }

    const handleDelete = async (id: number) => {
        const ok = await confirm({ message: 'This party and all related data will be removed.', title: 'Delete Party?', variant: 'danger' });
        if (ok) {
            await db.parties.delete(id);
            loadParties();
        }
    };

    const filteredParties = parties.filter(party => {
        const matchesSearch = party.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            party.gstin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            party.phone?.includes(searchTerm);
        const matchesType = filterType === 'all' || party.type === filterType || party.type === 'both';
        return matchesSearch && matchesType;
    });

    const stats = {
        total: parties.length,
        customers: parties.filter(p => p.type === 'customer' || p.type === 'both').length,
        vendors: parties.filter(p => p.type === 'vendor' || p.type === 'both').length,
        receivable: parties.filter(p => p.balanceType === 'dr').reduce((sum, p) => sum + p.openingBalance, 0),
        payable: parties.filter(p => p.balanceType === 'cr').reduce((sum, p) => sum + p.openingBalance, 0)
    };

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--md-sys-spacing-lg)' }}>
                <div>
                    <h1 className="text-headline-medium">Parties</h1>
                    <p className="text-body-medium text-muted">Manage your customers and vendors</p>
                </div>
                <button className="btn btn-filled" onClick={() => { setEditingParty(null); setShowAddModal(true); }}>
                    <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>person_add</span>
                    Add Party
                </button>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--md-sys-spacing-md)', marginBottom: 'var(--md-sys-spacing-lg)' }}>
                <div className="card card-gradient" style={{ padding: 'var(--md-sys-spacing-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className="material-symbols-rounded" style={{ fontSize: '28px', color: 'var(--md-sys-color-primary)' }}>groups</span>
                        <div>
                            <div className="text-label-medium text-muted">Total Parties</div>
                            <div className="text-headline-medium">{stats.total}</div>
                        </div>
                    </div>
                </div>
                <div className="card" style={{ padding: 'var(--md-sys-spacing-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className="material-symbols-rounded" style={{ fontSize: '28px', color: 'var(--md-sys-color-success)' }}>person</span>
                        <div>
                            <div className="text-label-medium text-muted">Customers</div>
                            <div className="text-headline-medium">{stats.customers}</div>
                        </div>
                    </div>
                </div>
                <div className="card" style={{ padding: 'var(--md-sys-spacing-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className="material-symbols-rounded" style={{ fontSize: '28px', color: '#f59e0b' }}>storefront</span>
                        <div>
                            <div className="text-label-medium text-muted">Vendors</div>
                            <div className="text-headline-medium">{stats.vendors}</div>
                        </div>
                    </div>
                </div>
                <div className="card" style={{ padding: 'var(--md-sys-spacing-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className="material-symbols-rounded" style={{ fontSize: '28px', color: 'var(--md-sys-color-success)' }}>arrow_downward</span>
                        <div>
                            <div className="text-label-medium text-muted">Receivable</div>
                            <div className="text-headline-medium text-success">₹{stats.receivable.toLocaleString('en-IN')}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: 'var(--md-sys-spacing-lg)' }}>
                <div style={{ display: 'flex', gap: 'var(--md-sys-spacing-md)', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
                        <span className="material-symbols-rounded" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--md-sys-color-on-surface-variant)' }}>search</span>
                        <input
                            type="text"
                            className="form-input"
                            style={{ paddingLeft: '44px' }}
                            placeholder="Search by name, GSTIN, or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--md-sys-spacing-sm)' }}>
                        <button className={`btn ${filterType === 'all' ? 'btn-filled' : 'btn-outlined'}`} onClick={() => setFilterType('all')}>
                            All
                        </button>
                        <button className={`btn ${filterType === 'customer' ? 'btn-filled' : 'btn-outlined'}`} onClick={() => setFilterType('customer')}>
                            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>person</span>
                            Customers
                        </button>
                        <button className={`btn ${filterType === 'vendor' ? 'btn-filled' : 'btn-outlined'}`} onClick={() => setFilterType('vendor')}>
                            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>storefront</span>
                            Vendors
                        </button>
                    </div>
                </div>
            </div>

            {/* Party List */}
            {filteredParties.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 'var(--md-sys-spacing-xl)' }}>
                    <span className="material-symbols-rounded" style={{ fontSize: '4rem', color: 'var(--md-sys-color-primary)', marginBottom: 'var(--md-sys-spacing-md)', display: 'block' }}>groups</span>
                    <h3 className="text-title-large">No parties found</h3>
                    <p className="text-body-medium text-muted" style={{ marginBottom: 'var(--md-sys-spacing-lg)' }}>
                        {searchTerm ? 'Try a different search term' : 'Add your first customer or vendor'}
                    </p>
                    <button className="btn btn-filled" onClick={() => setShowAddModal(true)}>
                        <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>person_add</span>
                        Add Party
                    </button>
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Type</th>
                                <th>GSTIN</th>
                                <th>Phone</th>
                                <th>Balance</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredParties.map((party) => (
                                <tr key={party.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                background: party.type === 'customer' ? 'linear-gradient(135deg, var(--md-sys-color-primary), var(--md-sys-color-secondary))' : 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#fff'
                                            }}>
                                                <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>
                                                    {party.type === 'customer' ? 'person' : party.type === 'vendor' ? 'storefront' : 'sync_alt'}
                                                </span>
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 500 }}>{party.name}</div>
                                                {party.city && <div className="text-label-medium text-muted">{party.city}</div>}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${party.type === 'customer' ? 'badge-primary' : party.type === 'vendor' ? 'badge-warning' : 'badge-success'}`}>
                                            {party.type}
                                        </span>
                                    </td>
                                    <td>{party.gstin || '-'}</td>
                                    <td>{party.phone || '-'}</td>
                                    <td>
                                        <span className={party.balanceType === 'dr' ? 'text-success' : 'text-error'} style={{ fontWeight: 500 }}>
                                            ₹{party.openingBalance.toLocaleString('en-IN')} {party.balanceType.toUpperCase()}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <button className="btn btn-icon" title="View Ledger">
                                                <span className="material-symbols-rounded" style={{ color: 'var(--md-sys-color-primary)' }}>menu_book</span>
                                            </button>
                                            <button className="btn btn-icon" title="Edit" onClick={() => { setEditingParty(party); setShowAddModal(true); }}>
                                                <span className="material-symbols-rounded" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>edit</span>
                                            </button>
                                            <button className="btn btn-icon" title="Delete" onClick={() => party.id && handleDelete(party.id)}>
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

            {/* Add Party Modal */}
            {showAddModal && (
                <AddPartyModal onClose={() => setShowAddModal(false)} onSave={loadParties} party={editingParty} />
            )}

            {/* FAB */}
            <button className="fab" onClick={() => { setEditingParty(null); setShowAddModal(true); }} title="Add Party">
                <span className="material-symbols-rounded" style={{ fontSize: '28px' }}>add</span>
            </button>
        </div>
    );
}

// Add Party Modal Component
function AddPartyModal({ onClose, onSave, party }: { onClose: () => void; onSave: () => void; party?: Party | null }) {
    const [formData, setFormData] = useState({
        name: party?.name || '',
        type: party?.type || 'customer' as 'customer' | 'vendor' | 'both',
        gstin: party?.gstin || '',
        pan: party?.pan || '',
        phone: party?.phone || '',
        email: party?.email || '',
        address: party?.address || '',
        city: party?.city || '',
        state: party?.state || '',
        pincode: party?.pincode || '',
        openingBalance: party?.openingBalance || 0,
        balanceType: party?.balanceType || 'dr' as 'dr' | 'cr',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (party?.id) {
            await db.parties.update(party.id, { ...formData, updatedAt: new Date() });
        } else {
            await db.parties.add({ ...formData, createdAt: new Date(), updatedAt: new Date() });
        }
        onSave();
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <h2 className="modal-title">{party ? 'Edit Party' : 'Add New Party'}</h2>
                    <button className="btn btn-icon" onClick={onClose}>
                        <span className="material-symbols-rounded">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--md-sys-spacing-md)' }}>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="form-label form-label-required">Party Name</label>
                                <input type="text" className="form-input" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter party name" />
                            </div>

                            <div className="form-group">
                                <label className="form-label form-label-required">Party Type</label>
                                <select className="form-input form-select" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as 'customer' | 'vendor' | 'both' })}>
                                    <option value="customer">Customer</option>
                                    <option value="vendor">Vendor</option>
                                    <option value="both">Both</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Phone</label>
                                <input type="tel" className="form-input" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="10-digit mobile" />
                            </div>

                            <div className="form-group">
                                <label className="form-label">GSTIN</label>
                                <input type="text" className="form-input" value={formData.gstin} onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })} placeholder="15-digit GSTIN" maxLength={15} />
                            </div>

                            <div className="form-group">
                                <label className="form-label">PAN</label>
                                <input type="text" className="form-input" value={formData.pan} onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })} placeholder="10-digit PAN" maxLength={10} />
                            </div>

                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="form-label">Email</label>
                                <input type="email" className="form-input" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="party@example.com" />
                            </div>

                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="form-label">Address</label>
                                <textarea className="form-input" rows={2} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Street address" />
                            </div>

                            <div className="form-group">
                                <label className="form-label">City</label>
                                <input type="text" className="form-input" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                            </div>

                            <div className="form-group">
                                <label className="form-label">State</label>
                                <input type="text" className="form-input" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Opening Balance</label>
                                <input type="number" className="form-input" value={formData.openingBalance} onChange={(e) => setFormData({ ...formData, openingBalance: parseFloat(e.target.value) || 0 })} />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Balance Type</label>
                                <select className="form-input form-select" value={formData.balanceType} onChange={(e) => setFormData({ ...formData, balanceType: e.target.value as 'dr' | 'cr' })}>
                                    <option value="dr">Debit (To Receive)</option>
                                    <option value="cr">Credit (To Pay)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-outlined" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-filled">
                            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>save</span>
                            {party ? 'Update Party' : 'Save Party'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
