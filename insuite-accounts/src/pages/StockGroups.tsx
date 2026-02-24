import { useState, useEffect, useMemo } from 'react';
import db from '../db/database';
import type { StockGroup } from '../types';
import { useCompany } from '../context/CompanyContext';
import { useConfirm } from '../components/ConfirmModal';
import { useToast } from '../components/Toast';

interface TreeNode extends StockGroup { children: TreeNode[]; itemCount: number; }

export default function StockGroups() {
    const { activeCompany } = useCompany();
    const confirm = useConfirm();
    const { showToast } = useToast();
    const [groups, setGroups] = useState<StockGroup[]>([]);
    const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingGroup, setEditingGroup] = useState<StockGroup | null>(null);
    const [formData, setFormData] = useState({ name: '', parentId: undefined as number | undefined });
    const companyId = activeCompany?.id;

    const load = async () => {
        if (!companyId) return;
        const all = await db.stockGroups.where({ companyId }).toArray();
        setGroups(all);
        if (expandedNodes.size === 0) setExpandedNodes(new Set(all.map(g => g.id!)));
    };
    useEffect(() => { load(); }, [companyId]);

    const tree = useMemo(() => {
        const map = new Map<number, TreeNode>();
        groups.forEach(g => map.set(g.id!, { ...g, children: [], itemCount: 0 }));
        const roots: TreeNode[] = [];
        groups.forEach(g => {
            const node = map.get(g.id!)!;
            if (g.parentId && map.has(g.parentId)) map.get(g.parentId)!.children.push(node);
            else roots.push(node);
        });
        const s = (a: TreeNode, b: TreeNode) => a.sortOrder - b.sortOrder;
        roots.sort(s);
        const sortC = (n: TreeNode[]) => { n.sort(s); n.forEach(c => sortC(c.children)); };
        sortC(roots);
        return roots;
    }, [groups]);

    const filtered = useMemo(() => {
        if (!searchTerm.trim()) return tree;
        const l = searchTerm.toLowerCase();
        const f = (n: TreeNode): TreeNode | null => {
            const m = n.name.toLowerCase().includes(l);
            const c = n.children.map(x => f(x)).filter(Boolean) as TreeNode[];
            return (m || c.length > 0) ? { ...n, children: c } : null;
        };
        return tree.map(r => f(r)).filter(Boolean) as TreeNode[];
    }, [tree, searchTerm]);

    const save = async () => {
        if (!companyId || !formData.name.trim()) { showToast('error', 'Enter group name'); return; }
        const now = new Date();
        if (editingGroup) {
            await db.stockGroups.update(editingGroup.id!, { name: formData.name.trim(), parentId: formData.parentId, updatedAt: now });
            showToast('success', 'Updated');
        } else {
            await db.stockGroups.add({ companyId, name: formData.name.trim(), parentId: formData.parentId, isDefault: false, sortOrder: groups.length + 1, createdAt: now, updatedAt: now });
            showToast('success', 'Created');
        }
        setShowForm(false); load();
    };

    const del = async (g: StockGroup) => {
        if (g.isDefault) { showToast('error', 'Cannot delete default groups'); return; }
        if (groups.some(x => x.parentId === g.id)) { showToast('error', 'Delete sub-groups first'); return; }
        const ok = await confirm({ title: 'Delete', message: `Delete "${g.name}"?`, confirmText: 'Delete', variant: 'danger' });
        if (ok) { await db.stockGroups.delete(g.id!); showToast('success', 'Deleted'); load(); }
    };

    const renderNode = (n: TreeNode, d: number = 0) => {
        const exp = expandedNodes.has(n.id!);
        const has = n.children.length > 0;
        return (
            <div key={n.id} className="tree-node-wrapper">
                <div className={`tree-node ${has ? 'has-children' : ''}`} style={{ paddingLeft: `${d * 24 + 16}px` }}>
                    <button className="tree-toggle" onClick={() => { setExpandedNodes(p => { const s = new Set(p); s.has(n.id!) ? s.delete(n.id!) : s.add(n.id!); return s; }); }} style={{ visibility: has ? 'visible' : 'hidden' }}>
                        <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>{exp ? 'expand_more' : 'chevron_right'}</span>
                    </button>
                    <span className="material-symbols-rounded tree-icon" style={{ color: '#f59e0b' }}>inventory_2</span>
                    <span className="tree-label">{n.name}</span>
                    {n.isDefault && <span className="tree-tag">System</span>}
                    <div className="tree-actions">
                        <button className="tree-action-btn" onClick={() => { setFormData({ name: '', parentId: n.id }); setEditingGroup(null); setShowForm(true); }}><span className="material-symbols-rounded">add</span></button>
                        {!n.isDefault && <>
                            <button className="tree-action-btn" onClick={() => { setFormData({ name: n.name, parentId: n.parentId }); setEditingGroup(n); setShowForm(true); }}><span className="material-symbols-rounded">edit</span></button>
                            <button className="tree-action-btn danger" onClick={() => del(n)}><span className="material-symbols-rounded">delete</span></button>
                        </>}
                    </div>
                </div>
                {exp && has && <div className="tree-children">{n.children.map(c => renderNode(c, d + 1))}</div>}
            </div>
        );
    };

    if (!activeCompany) return <div className="page-container"><div className="empty-state"><span className="material-symbols-rounded" style={{ fontSize: '64px', opacity: 0.3 }}>business</span><h3>No Company Selected</h3></div></div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <div><h2 className="page-title"><span className="material-symbols-rounded" style={{ color: '#f59e0b' }}>category</span> Stock Groups</h2>
                    <p className="page-subtitle">{groups.length} stock groups</p></div>
                <div className="page-header-actions">
                    <button className="btn btn-outlined" onClick={() => setExpandedNodes(new Set(groups.map(g => g.id!)))}><span className="material-symbols-rounded">unfold_more</span> Expand</button>
                    <button className="btn btn-outlined" onClick={() => setExpandedNodes(new Set())}><span className="material-symbols-rounded">unfold_less</span> Collapse</button>
                    <button className="btn btn-primary" onClick={() => { setFormData({ name: '', parentId: undefined }); setEditingGroup(null); setShowForm(true); }}><span className="material-symbols-rounded">add</span> New Group</button>
                </div>
            </div>
            <div className="search-bar" style={{ marginBottom: '16px' }}>
                <span className="material-symbols-rounded search-icon">search</span>
                <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="search-input" />
                {searchTerm && <button className="search-clear" onClick={() => setSearchTerm('')}><span className="material-symbols-rounded">close</span></button>}
            </div>
            <div className="card tree-container">
                {filtered.length === 0 ? <div className="empty-state" style={{ padding: '48px' }}><p>{searchTerm ? 'No match' : 'No groups'}</p></div>
                    : filtered.map(n => renderNode(n))}
            </div>
            {showForm && <div className="modal-overlay" onClick={() => setShowForm(false)}><div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
                <div className="modal-header"><h3>{editingGroup ? 'Edit' : 'Create'} Stock Group</h3><button className="modal-close" onClick={() => setShowForm(false)}><span className="material-symbols-rounded">close</span></button></div>
                <div className="modal-body">
                    <div className="form-group"><label className="form-label">Name *</label><input type="text" className="form-input" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} autoFocus /></div>
                    <div className="form-group"><label className="form-label">Under</label><select className="form-input" value={formData.parentId || ''} onChange={e => setFormData(p => ({ ...p, parentId: e.target.value ? Number(e.target.value) : undefined }))}><option value="">— Root —</option>{groups.filter(g => g.id !== editingGroup?.id).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
                </div>
                <div className="modal-footer"><button className="btn btn-outlined" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary" onClick={save}><span className="material-symbols-rounded">save</span> {editingGroup ? 'Update' : 'Create'}</button></div>
            </div></div>}
        </div>
    );
}
