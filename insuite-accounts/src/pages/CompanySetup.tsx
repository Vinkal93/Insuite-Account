import { useState, useEffect, useRef, useCallback } from 'react';
import db, { createCompany, deleteCompany } from '../db/database';
import type { Company, FinancialYear } from '../types';
import { useCompany } from '../context/CompanyContext';
import { useConfirm } from '../components/ConfirmModal';
import { useToast } from '../components/Toast';
import { encryptData, decryptData, downloadFile, readFileAsArrayBuffer } from '../utils/backup';

const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu and Kashmir', 'Ladakh',
];

const EMPTY_FORM = {
    name: '', address: '', city: '', state: '', pincode: '', country: 'India',
    phone: '', email: '', website: '', gstin: '', pan: '', logo: '',
    baseCurrency: 'INR', currencySymbol: '₹',
    booksBeginningDate: new Date().toISOString().split('T')[0],
};

type ModalView = 'none' | 'welcome' | 'create' | 'import';

export default function CompanySetup() {
    const { companies, activeCompany, setActiveCompany, refreshCompanies } = useCompany();
    const confirm = useConfirm();
    const { showToast } = useToast();
    const [modalView, setModalView] = useState<ModalView>('none');
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);
    const [formData, setFormData] = useState({ ...EMPTY_FORM });
    const [saving, setSaving] = useState(false);
    const [financialYears, setFinancialYears] = useState<FinancialYear[]>([]);
    const [exporting, setExporting] = useState<number | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [importing, setImporting] = useState(false);
    const importFileRef = useRef<HTMLInputElement>(null);

    // Show welcome when no companies
    useEffect(() => {
        if (companies.length === 0 && modalView === 'none') {
            setModalView('welcome');
        }
    }, [companies, modalView]);

    useEffect(() => {
        if (activeCompany?.id) {
            db.financialYears.where({ companyId: activeCompany.id }).toArray().then(setFinancialYears);
        }
    }, [activeCompany]);

    const openCreate = () => {
        setFormData({ ...EMPTY_FORM });
        setEditingCompany(null);
        setModalView('create');
    };

    const openEdit = (c: Company) => {
        setFormData({
            name: c.name, address: c.address, city: c.city, state: c.state,
            pincode: c.pincode, country: c.country, phone: c.phone || '',
            email: c.email || '', website: c.website || '', gstin: c.gstin || '',
            pan: c.pan || '', logo: c.logo || '', baseCurrency: c.baseCurrency,
            currencySymbol: c.currencySymbol, booksBeginningDate: c.booksBeginningDate,
        });
        setEditingCompany(c);
        setModalView('create');
    };

    const closeModal = () => {
        setModalView(companies.length === 0 ? 'welcome' : 'none');
    };

    const handleSave = async () => {
        if (!formData.name.trim()) { showToast('error', 'Company name is required'); return; }
        if (!formData.booksBeginningDate) { showToast('error', 'Books beginning date is required'); return; }
        setSaving(true);
        try {
            if (editingCompany) {
                await db.companies.update(editingCompany.id!, { ...formData, updatedAt: new Date() });
                showToast('success', 'Company updated');
            } else {
                const id = await createCompany(formData as any);
                await setActiveCompany(id);
                showToast('success', 'Company created with default ledger groups, stock groups & units');
            }
            await refreshCompanies();
            setModalView('none');
        } catch (err) {
            showToast('error', 'Failed to save: ' + (err as Error).message);
        } finally { setSaving(false); }
    };

    const handleDelete = async (c: Company) => {
        const ok = await confirm({
            title: 'Delete Company',
            message: `Delete "${c.name}" and ALL its data? This cannot be undone!`,
            confirmText: 'Delete Everything', variant: 'danger',
        });
        if (ok) {
            await deleteCompany(c.id!);
            showToast('success', 'Company deleted');
            await refreshCompanies();
        }
    };

    const handleSelect = async (c: Company) => {
        await setActiveCompany(c.id!);
        showToast('success', `Switched to ${c.name}`);
    };

    // ─── EXPORT ────────────────────────────────────────────────
    const handleExport = async (c: Company) => {
        setExporting(c.id!);
        try {
            const companyId = c.id!;

            // Collect ALL data for this company — use toArray + filter for tables
            // that may not have companyId (older data)
            const collectFor = async (table: any) => {
                try {
                    return await table.where({ companyId }).toArray();
                } catch {
                    // fallback: get all and filter
                    const all = await table.toArray();
                    return all.filter((r: any) => r.companyId === companyId);
                }
            };

            const [fys, ledgerGroups, ledgers, stockGroups, units, stockItems,
                vouchers, products, parties, invoices, purchases,
                expenses, transactions] = await Promise.all([
                    collectFor(db.financialYears),
                    collectFor(db.ledgerGroups),
                    collectFor(db.ledgers),
                    collectFor(db.stockGroups),
                    collectFor(db.units),
                    collectFor(db.stockItems),
                    collectFor(db.vouchers),
                    collectFor(db.products),
                    collectFor(db.parties),
                    collectFor(db.invoices),
                    collectFor(db.purchases),
                    collectFor(db.expenses),
                    collectFor(db.transactions),
                ]);

            const backup = JSON.stringify({
                version: 2,
                app: 'InSuite Accounts',
                exportDate: new Date().toISOString(),
                company: c,
                financialYears: fys,
                ledgerGroups,
                ledgers,
                stockGroups,
                units,
                stockItems,
                vouchers,
                products,
                parties,
                invoices,
                purchases,
                expenses,
                transactions,
            });

            const encrypted = await encryptData(backup);
            const safeName = c.name.replace(/[^a-zA-Z0-9]/g, '_');
            const dateStr = new Date().toISOString().split('T')[0];
            downloadFile(encrypted, `${safeName}_${dateStr}.insuite`);
            showToast('success', `"${c.name}" exported successfully`);
        } catch (err) {
            showToast('error', 'Export failed: ' + (err as Error).message);
        } finally {
            setExporting(null);
        }
    };

    // ─── IMPORT ────────────────────────────────────────────────
    const processImportFile = useCallback(async (file: File) => {
        if (!file.name.endsWith('.insuite')) {
            showToast('error', 'Invalid file. Only .insuite backup files are accepted.');
            return;
        }
        setImporting(true);
        try {
            const buffer = await readFileAsArrayBuffer(file);
            const jsonStr = await decryptData(buffer);
            const data = JSON.parse(jsonStr);
            if (!data.company?.name) {
                throw new Error('Invalid backup data: missing company info');
            }

            // Create the company fresh (without the old ID)
            const { id: _oldId, ...companyData } = data.company;
            const newId = await createCompany(companyData);

            // Helper to re-key records
            const rekey = (arr: any[]) => arr?.map((item: any) => {
                const { id: _oid, companyId: _cid, ...rest } = item;
                return { ...rest, companyId: newId };
            }) || [];

            // Bulk insert ALL data
            const tables: [string, any][] = [
                ['ledgerGroups', data.ledgerGroups],
                ['ledgers', data.ledgers],
                ['stockGroups', data.stockGroups],
                ['units', data.units],
                ['stockItems', data.stockItems],
                ['vouchers', data.vouchers],
                ['products', data.products],
                ['parties', data.parties],
                ['invoices', data.invoices],
                ['purchases', data.purchases],
                ['expenses', data.expenses],
                ['transactions', data.transactions],
            ];
            for (const [tableName, records] of tables) {
                if (records?.length) {
                    await (db as any)[tableName].bulkAdd(rekey(records));
                }
            }

            await setActiveCompany(newId);
            await refreshCompanies();
            setModalView('none');
            showToast('success', `"${data.company.name}" imported successfully with all data`);
        } catch (err) {
            showToast('error', (err as Error).message);
        } finally {
            setImporting(false);
        }
    }, [refreshCompanies, setActiveCompany, showToast]);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processImportFile(file);
        e.target.value = '';
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) processImportFile(file);
    }, [processImportFile]);

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
    const handleDragLeave = () => setDragOver(false);

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h2 className="page-title">
                        <span className="material-symbols-rounded" style={{ color: 'var(--md-sys-color-primary)' }}>business</span>
                        Company Management
                    </h2>
                    <p className="page-subtitle">{companies.length} compan{companies.length !== 1 ? 'ies' : 'y'} configured</p>
                </div>
                <div className="page-header-actions">
                    <button className="btn btn-outlined" onClick={() => setModalView('import')}>
                        <span className="material-symbols-rounded">upload</span> Import
                    </button>
                    <button className="btn btn-primary" onClick={openCreate}>
                        <span className="material-symbols-rounded">add</span> New Company
                    </button>
                </div>
            </div>

            {/* Company Cards */}
            {companies.length === 0 ? (
                <div className="card empty-state" style={{ padding: '64px', textAlign: 'center' }}>
                    <span className="material-symbols-rounded" style={{ fontSize: '80px', opacity: 0.15, display: 'block', marginBottom: '16px' }}>business</span>
                    <h3 style={{ marginBottom: '8px' }}>No Companies Yet</h3>
                    <p style={{ color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '24px' }}>Create a new company or import a backup to get started</p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        <button className="btn btn-primary" onClick={openCreate}>
                            <span className="material-symbols-rounded">add</span> Create Company
                        </button>
                        <button className="btn btn-outlined" onClick={() => setModalView('import')}>
                            <span className="material-symbols-rounded">upload</span> Import Backup
                        </button>
                    </div>
                </div>
            ) : (
                <div className="company-cards-grid">
                    {companies.map(c => (
                        <div key={c.id} className={`card company-card ${activeCompany?.id === c.id ? 'active-company' : ''}`}>
                            <div className="company-card-header">
                                <div className="company-card-logo">
                                    {c.logo ? <img src={c.logo} alt="" /> : <span>{c.name.charAt(0).toUpperCase()}</span>}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 className="company-card-name">{c.name}</h3>
                                    <span className="company-card-city">{c.city}{c.state ? `, ${c.state}` : ''}</span>
                                </div>
                                {activeCompany?.id === c.id && (
                                    <span className="company-active-badge">
                                        <span className="material-symbols-rounded" style={{ fontSize: '14px' }}>check_circle</span>
                                        Active
                                    </span>
                                )}
                            </div>
                            <div className="company-card-details">
                                {c.gstin && <div className="company-detail"><span className="label">GSTIN:</span> {c.gstin}</div>}
                                {c.pan && <div className="company-detail"><span className="label">PAN:</span> {c.pan}</div>}
                                {c.phone && <div className="company-detail"><span className="label">Phone:</span> {c.phone}</div>}
                                <div className="company-detail"><span className="label">FY Start:</span> {c.booksBeginningDate}</div>
                            </div>
                            <div className="company-card-actions">
                                {activeCompany?.id !== c.id && (
                                    <button className="btn btn-primary btn-sm" onClick={() => handleSelect(c)}>
                                        <span className="material-symbols-rounded">swap_horiz</span> Switch
                                    </button>
                                )}
                                <button className="btn btn-outlined btn-sm" onClick={() => handleExport(c)} disabled={exporting === c.id}>
                                    <span className="material-symbols-rounded">{exporting === c.id ? 'hourglass_empty' : 'download'}</span>
                                    {exporting === c.id ? 'Exporting...' : 'Export'}
                                </button>
                                <button className="btn btn-outlined btn-sm" onClick={() => openEdit(c)}>
                                    <span className="material-symbols-rounded">edit</span> Edit
                                </button>
                                <button className="btn btn-outlined btn-sm danger" onClick={() => handleDelete(c)}>
                                    <span className="material-symbols-rounded">delete</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Financial Years Section */}
            {activeCompany && financialYears.length > 0 && (
                <div style={{ marginTop: '32px' }}>
                    <h3 className="section-title">
                        <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>calendar_month</span>
                        Financial Years — {activeCompany.name}
                    </h3>
                    <div className="fy-list">
                        {financialYears.map(fy => (
                            <div key={fy.id} className="card fy-card">
                                <div className="fy-label">{fy.label}</div>
                                <div className="fy-dates">{fy.startDate} → {fy.endDate}</div>
                                <div className="fy-status">
                                    {fy.isClosed ? <span className="badge badge-danger">Closed</span> :
                                        fy.isFrozen ? <span className="badge badge-warning">Frozen</span> :
                                            <span className="badge badge-success">Active</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ═══ WELCOME MODAL ═══ */}
            {modalView === 'welcome' && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '480px', textAlign: 'center' }}>
                        <div className="modal-body" style={{ padding: '48px 32px' }}>
                            <div style={{
                                width: '80px', height: '80px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--md-sys-color-primary), var(--md-sys-color-tertiary, #7c4dff))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 24px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
                            }}>
                                <span className="material-symbols-rounded" style={{ fontSize: '40px', color: '#fff' }}>business</span>
                            </div>
                            <h2 style={{ marginBottom: '8px', fontSize: '1.5rem' }}>Welcome to InSuite Accounts</h2>
                            <p style={{ color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '32px', lineHeight: 1.6 }}>
                                Start by creating a new company or import an existing backup file
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <button className="btn btn-primary" onClick={openCreate} style={{ padding: '14px 24px', fontSize: '1rem', justifyContent: 'center' }}>
                                    <span className="material-symbols-rounded">add_business</span>
                                    Create New Company
                                </button>
                                <button className="btn btn-outlined" onClick={() => setModalView('import')} style={{ padding: '14px 24px', fontSize: '1rem', justifyContent: 'center' }}>
                                    <span className="material-symbols-rounded">upload_file</span>
                                    Import Company Backup
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ IMPORT MODAL (Drag & Drop) ═══ */}
            {modalView === 'import' && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
                        <div className="modal-header">
                            <h3>Import Company Backup</h3>
                            <button className="modal-close" onClick={closeModal}>
                                <span className="material-symbols-rounded">close</span>
                            </button>
                        </div>
                        <div className="modal-body" style={{ padding: '24px' }}>
                            <input type="file" ref={importFileRef} accept=".insuite" onChange={handleFileInput} style={{ display: 'none' }} />

                            <div
                                className={`drop-zone ${dragOver ? 'drag-active' : ''} ${importing ? 'importing' : ''}`}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onClick={() => !importing && importFileRef.current?.click()}
                            >
                                {importing ? (
                                    <>
                                        <span className="material-symbols-rounded drop-zone-icon spinning">sync</span>
                                        <h4>Importing...</h4>
                                        <p>Decrypting and restoring company data</p>
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-rounded drop-zone-icon">cloud_upload</span>
                                        <h4>Drag & Drop your .insuite file here</h4>
                                        <p>or click to browse files</p>
                                        <div className="drop-zone-badge">
                                            <span className="material-symbols-rounded" style={{ fontSize: '14px' }}>lock</span>
                                            Encrypted InSuite Backup (.insuite)
                                        </div>
                                    </>
                                )}
                            </div>

                            <div style={{ marginTop: '16px', padding: '12px 16px', background: 'var(--md-sys-color-surface-container)', borderRadius: 'var(--md-sys-shape-corner-md)', fontSize: '0.8125rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <span className="material-symbols-rounded" style={{ fontSize: '16px', color: 'var(--md-sys-color-primary)' }}>info</span>
                                    <strong>What gets imported?</strong>
                                </div>
                                <p style={{ margin: 0 }}>Company details, ledger groups, ledgers, stock items, parties, invoices, purchases, and all associated records.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ CREATE/EDIT COMPANY MODAL ═══ */}
            {modalView === 'create' && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
                        <div className="modal-header">
                            <h3>{editingCompany ? 'Edit Company' : 'Create New Company'}</h3>
                            <button className="modal-close" onClick={closeModal}>
                                <span className="material-symbols-rounded">close</span>
                            </button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                            <div className="form-group">
                                <label className="form-label">Company Name *</label>
                                <input type="text" className="form-input" value={formData.name}
                                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                    placeholder="Your Business Name" autoFocus />
                            </div>
                            <div className="form-row">
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">Books Beginning Date *</label>
                                    <input type="date" className="form-input" value={formData.booksBeginningDate}
                                        onChange={e => setFormData(p => ({ ...p, booksBeginningDate: e.target.value }))} />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">Currency</label>
                                    <select className="form-input form-select" value={formData.baseCurrency}
                                        onChange={e => setFormData(p => ({ ...p, baseCurrency: e.target.value }))}>
                                        <option value="INR">INR (₹)</option>
                                        <option value="USD">USD ($)</option>
                                        <option value="EUR">EUR (€)</option>
                                        <option value="GBP">GBP (£)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Address</label>
                                <textarea className="form-input" rows={2} value={formData.address}
                                    onChange={e => setFormData(p => ({ ...p, address: e.target.value }))} placeholder="Street address" />
                            </div>
                            <div className="form-row">
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">City</label>
                                    <input type="text" className="form-input" value={formData.city}
                                        onChange={e => setFormData(p => ({ ...p, city: e.target.value }))} />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">State</label>
                                    <select className="form-input form-select" value={formData.state}
                                        onChange={e => setFormData(p => ({ ...p, state: e.target.value }))}>
                                        <option value="">Select State</option>
                                        {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">Pincode</label>
                                    <input type="text" className="form-input" value={formData.pincode} maxLength={6}
                                        onChange={e => setFormData(p => ({ ...p, pincode: e.target.value.replace(/\D/g, '') }))} />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">Phone</label>
                                    <input type="tel" className="form-input" value={formData.phone}
                                        onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">GSTIN</label>
                                    <input type="text" className="form-input" value={formData.gstin} maxLength={15}
                                        onChange={e => setFormData(p => ({ ...p, gstin: e.target.value.toUpperCase() }))} placeholder="22AAAAA0000A1Z5" />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">PAN</label>
                                    <input type="text" className="form-input" value={formData.pan} maxLength={10}
                                        onChange={e => setFormData(p => ({ ...p, pan: e.target.value.toUpperCase() }))} placeholder="ABCDE1234F" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input type="email" className="form-input" value={formData.email}
                                    onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-outlined" onClick={closeModal}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                <span className="material-symbols-rounded">{saving ? 'hourglass_empty' : 'save'}</span>
                                {saving ? 'Saving...' : editingCompany ? 'Update' : 'Create Company'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
