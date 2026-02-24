import { useState, useEffect } from 'react';
import db from '../db/database';
import type { Unit, UnitType } from '../types';
import { useCompany } from '../context/CompanyContext';
import { useConfirm } from '../components/ConfirmModal';
import { useToast } from '../components/Toast';

export default function Units() {
    const { activeCompany } = useCompany();
    const confirm = useConfirm();
    const { showToast } = useToast();
    const [units, setUnits] = useState<Unit[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Unit | null>(null);
    const [form, setForm] = useState({ symbol: '', formalName: '', type: 'simple' as UnitType, decimalPlaces: 0, baseUnitId: undefined as number | undefined, conversionFactor: undefined as number | undefined });
    const companyId = activeCompany?.id;

    const load = async () => { if (!companyId) return; setUnits(await db.units.where({ companyId }).toArray()); };
    useEffect(() => { load(); }, [companyId]);

    const simpleUnits = units.filter(u => u.type === 'simple');
    const compoundUnits = units.filter(u => u.type === 'compound');

    const openCreate = (type: UnitType = 'simple') => {
        setForm({ symbol: '', formalName: '', type, decimalPlaces: 0, baseUnitId: undefined, conversionFactor: undefined });
        setEditing(null); setShowForm(true);
    };
    const openEdit = (u: Unit) => {
        setForm({ symbol: u.symbol, formalName: u.formalName, type: u.type, decimalPlaces: u.decimalPlaces, baseUnitId: u.baseUnitId, conversionFactor: u.conversionFactor });
        setEditing(u); setShowForm(true);
    };

    const save = async () => {
        if (!companyId || !form.symbol.trim() || !form.formalName.trim()) { showToast('error', 'Fill symbol and name'); return; }
        if (form.type === 'compound' && (!form.baseUnitId || !form.conversionFactor)) { showToast('error', 'Select base unit and factor'); return; }
        const now = new Date();
        if (editing) {
            await db.units.update(editing.id!, { symbol: form.symbol.trim(), formalName: form.formalName.trim(), type: form.type, decimalPlaces: form.decimalPlaces, baseUnitId: form.baseUnitId, conversionFactor: form.conversionFactor });
            showToast('success', 'Unit updated');
        } else {
            await db.units.add({ companyId, symbol: form.symbol.trim(), formalName: form.formalName.trim(), type: form.type, decimalPlaces: form.decimalPlaces, baseUnitId: form.baseUnitId, conversionFactor: form.conversionFactor, isDefault: false, createdAt: now } as Unit);
            showToast('success', 'Unit created');
        }
        setShowForm(false); load();
    };

    const del = async (u: Unit) => {
        if (u.isDefault) { showToast('error', 'Cannot delete default units'); return; }
        const items = await db.stockItems.where({ companyId: companyId!, unitId: u.id! }).count();
        if (items > 0) { showToast('error', `${items} items use this unit`); return; }
        const ok = await confirm({ title: 'Delete Unit', message: `Delete "${u.symbol}"?`, confirmText: 'Delete', variant: 'danger' });
        if (ok) { await db.units.delete(u.id!); showToast('success', 'Deleted'); load(); }
    };

    if (!activeCompany) return <div className="page-container"><div className="empty-state"><span className="material-symbols-rounded" style={{ fontSize: '64px', opacity: 0.3 }}>business</span><h3>No Company Selected</h3></div></div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h2 className="page-title"><span className="material-symbols-rounded" style={{ color: '#06b6d4' }}>straighten</span> Units of Measurement</h2>
                    <p className="page-subtitle">{units.length} units ({simpleUnits.length} simple, {compoundUnits.length} compound)</p>
                </div>
                <div className="page-header-actions">
                    <button className="btn btn-outlined" onClick={() => openCreate('compound')}><span className="material-symbols-rounded">link</span> Compound Unit</button>
                    <button className="btn btn-primary" onClick={() => openCreate('simple')}><span className="material-symbols-rounded">add</span> Simple Unit</button>
                </div>
            </div>

            {/* Simple Units */}
            <h3 className="section-title" style={{ marginTop: '16px' }}>Simple Units</h3>
            <div className="units-grid">
                {simpleUnits.map(u => (
                    <div key={u.id} className="card unit-card">
                        <div className="unit-card-header">
                            <div className="unit-symbol">{u.symbol}</div>
                            <div className="unit-card-actions">
                                {!u.isDefault && <><button className="icon-btn" onClick={() => openEdit(u)}><span className="material-symbols-rounded">edit</span></button>
                                    <button className="icon-btn danger" onClick={() => del(u)}><span className="material-symbols-rounded">delete</span></button></>}
                                {u.isDefault && <span className="tree-tag">System</span>}
                            </div>
                        </div>
                        <div className="unit-name">{u.formalName}</div>
                        <div className="unit-meta">Decimals: {u.decimalPlaces}</div>
                    </div>
                ))}
            </div>

            {/* Compound Units */}
            {compoundUnits.length > 0 && <>
                <h3 className="section-title" style={{ marginTop: '24px' }}>Compound Units</h3>
                <div className="units-grid">
                    {compoundUnits.map(u => {
                        const base = simpleUnits.find(s => s.id === u.baseUnitId);
                        return (
                            <div key={u.id} className="card unit-card compound">
                                <div className="unit-card-header">
                                    <div className="unit-symbol">{u.symbol}</div>
                                    <div className="unit-card-actions">
                                        {!u.isDefault && <><button className="icon-btn" onClick={() => openEdit(u)}><span className="material-symbols-rounded">edit</span></button>
                                            <button className="icon-btn danger" onClick={() => del(u)}><span className="material-symbols-rounded">delete</span></button></>}
                                    </div>
                                </div>
                                <div className="unit-name">{u.formalName}</div>
                                <div className="unit-meta">1 {u.symbol} = {u.conversionFactor} {base?.symbol || '?'}</div>
                            </div>
                        );
                    })}
                </div>
            </>}

            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '460px' }}>
                        <div className="modal-header">
                            <h3>{editing ? 'Edit Unit' : `Create ${form.type === 'compound' ? 'Compound' : 'Simple'} Unit`}</h3>
                            <button className="modal-close" onClick={() => setShowForm(false)}><span className="material-symbols-rounded">close</span></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-row">
                                <div className="form-group" style={{ flex: 1 }}><label className="form-label">Symbol *</label>
                                    <input type="text" className="form-input" value={form.symbol} onChange={e => setForm(p => ({ ...p, symbol: e.target.value }))} placeholder="Kg, Nos, Box" autoFocus /></div>
                                <div className="form-group" style={{ flex: 2 }}><label className="form-label">Formal Name *</label>
                                    <input type="text" className="form-input" value={form.formalName} onChange={e => setForm(p => ({ ...p, formalName: e.target.value }))} placeholder="Kilograms, Numbers" /></div>
                            </div>
                            <div className="form-group"><label className="form-label">Decimal Places</label>
                                <select className="form-input" value={form.decimalPlaces} onChange={e => setForm(p => ({ ...p, decimalPlaces: Number(e.target.value) }))}>
                                    {[0, 1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
                                </select></div>
                            {form.type === 'compound' && <>
                                <div className="form-group"><label className="form-label">Base Unit *</label>
                                    <select className="form-input" value={form.baseUnitId || ''} onChange={e => setForm(p => ({ ...p, baseUnitId: Number(e.target.value) }))}>
                                        <option value="">— Select —</option>
                                        {simpleUnits.map(u => <option key={u.id} value={u.id}>{u.symbol} ({u.formalName})</option>)}
                                    </select></div>
                                <div className="form-group"><label className="form-label">Conversion Factor *</label>
                                    <input type="number" className="form-input" value={form.conversionFactor || ''} onChange={e => setForm(p => ({ ...p, conversionFactor: Number(e.target.value) || undefined }))} placeholder="e.g. 10 (1 Box = 10 Nos)" /></div>
                            </>}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-outlined" onClick={() => setShowForm(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={save}><span className="material-symbols-rounded">save</span> {editing ? 'Update' : 'Create'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
