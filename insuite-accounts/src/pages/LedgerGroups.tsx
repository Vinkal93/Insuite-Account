import { useState, useEffect, useMemo } from 'react';
import db from '../db/database';
import type { LedgerGroup, LedgerGroupNature } from '../types';
import { useCompany } from '../context/CompanyContext';
import { useConfirm } from '../components/ConfirmModal';
import { useToast } from '../components/Toast';

interface TreeNode extends LedgerGroup {
    children: TreeNode[];
    ledgerCount: number;
}

const NATURE_LABELS: Record<LedgerGroupNature, string> = {
    assets: 'Assets',
    liabilities: 'Liabilities',
    income: 'Income',
    expense: 'Expense',
    equity: 'Equity',
};

const NATURE_COLORS: Record<LedgerGroupNature, string> = {
    assets: '#10b981',
    liabilities: '#ef4444',
    income: '#3b82f6',
    expense: '#f59e0b',
    equity: '#8b5cf6',
};

export default function LedgerGroups() {
    const { activeCompany } = useCompany();
    const confirm = useConfirm();
    const { showToast } = useToast();

    const [groups, setGroups] = useState<LedgerGroup[]>([]);
    const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingGroup, setEditingGroup] = useState<LedgerGroup | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        parentId: undefined as number | undefined,
        nature: 'assets' as LedgerGroupNature,
        affectsGrossProfit: false,
    });

    const companyId = activeCompany?.id;

    const loadGroups = async () => {
        if (!companyId) return;
        const allGroups = await db.ledgerGroups.where({ companyId }).toArray();
        setGroups(allGroups);
        // Auto-expand all on first load
        if (expandedNodes.size === 0) {
            setExpandedNodes(new Set(allGroups.map(g => g.id!)));
        }
    };

    useEffect(() => {
        loadGroups();
    }, [companyId]);

    // Build tree
    const tree = useMemo(() => {
        const nodeMap = new Map<number, TreeNode>();
        groups.forEach(g => nodeMap.set(g.id!, { ...g, children: [], ledgerCount: 0 }));

        const roots: TreeNode[] = [];
        groups.forEach(g => {
            const node = nodeMap.get(g.id!)!;
            if (g.parentId && nodeMap.has(g.parentId)) {
                nodeMap.get(g.parentId)!.children.push(node);
            } else {
                roots.push(node);
            }
        });

        // Sort by sortOrder
        const sortFn = (a: TreeNode, b: TreeNode) => a.sortOrder - b.sortOrder;
        roots.sort(sortFn);
        const sortChildren = (nodes: TreeNode[]) => {
            nodes.sort(sortFn);
            nodes.forEach(n => sortChildren(n.children));
        };
        sortChildren(roots);

        return roots;
    }, [groups]);

    // Filter tree based on search
    const filteredTree = useMemo(() => {
        if (!searchTerm.trim()) return tree;
        const lower = searchTerm.toLowerCase();

        const filterNode = (node: TreeNode): TreeNode | null => {
            const matchesSelf = node.name.toLowerCase().includes(lower);
            const filteredChildren = node.children
                .map(c => filterNode(c))
                .filter(Boolean) as TreeNode[];

            if (matchesSelf || filteredChildren.length > 0) {
                return { ...node, children: filteredChildren };
            }
            return null;
        };

        return tree.map(r => filterNode(r)).filter(Boolean) as TreeNode[];
    }, [tree, searchTerm]);

    const toggleExpand = (id: number) => {
        setExpandedNodes(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const expandAll = () => {
        setExpandedNodes(new Set(groups.map(g => g.id!)));
    };

    const collapseAll = () => {
        setExpandedNodes(new Set());
    };

    const openCreateForm = (parentId?: number) => {
        const parent = parentId ? groups.find(g => g.id === parentId) : undefined;
        setFormData({
            name: '',
            parentId,
            nature: parent?.nature || 'assets',
            affectsGrossProfit: parent?.affectsGrossProfit || false,
        });
        setEditingGroup(null);
        setShowForm(true);
    };

    const openEditForm = (group: LedgerGroup) => {
        setFormData({
            name: group.name,
            parentId: group.parentId,
            nature: group.nature,
            affectsGrossProfit: group.affectsGrossProfit,
        });
        setEditingGroup(group);
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!companyId || !formData.name.trim()) {
            showToast('error', 'Please enter a group name');
            return;
        }

        // Check for duplicate names under same parent
        const existing = groups.find(g =>
            g.name.toLowerCase() === formData.name.trim().toLowerCase() &&
            g.parentId === formData.parentId &&
            g.id !== editingGroup?.id
        );
        if (existing) {
            showToast('error', 'A group with this name already exists under the same parent');
            return;
        }

        const now = new Date();
        if (editingGroup) {
            await db.ledgerGroups.update(editingGroup.id!, {
                name: formData.name.trim(),
                parentId: formData.parentId,
                nature: formData.nature,
                affectsGrossProfit: formData.affectsGrossProfit,
                updatedAt: now,
            });
            showToast('success', 'Group updated successfully');
        } else {
            await db.ledgerGroups.add({
                companyId,
                name: formData.name.trim(),
                parentId: formData.parentId,
                nature: formData.nature,
                affectsGrossProfit: formData.affectsGrossProfit,
                isDefault: false,
                sortOrder: groups.length + 1,
                createdAt: now,
                updatedAt: now,
            });
            showToast('success', 'Group created successfully');
        }

        setShowForm(false);
        loadGroups();
    };

    const handleDelete = async (group: LedgerGroup) => {
        if (group.isDefault) {
            showToast('error', 'Cannot delete default system groups');
            return;
        }

        // Check for child groups
        const children = groups.filter(g => g.parentId === group.id);
        if (children.length > 0) {
            showToast('error', 'Cannot delete group with sub-groups. Delete sub-groups first.');
            return;
        }

        // Check for ledgers under this group
        const ledgers = await db.ledgers.where({ companyId: companyId!, groupId: group.id! }).count();
        if (ledgers > 0) {
            showToast('error', `Cannot delete group with ${ledgers} ledger(s). Move or delete them first.`);
            return;
        }

        const ok = await confirm({
            title: 'Delete Group',
            message: `Are you sure you want to delete "${group.name}"?`,
            confirmText: 'Delete',
            variant: 'danger',
        });
        if (ok) {
            await db.ledgerGroups.delete(group.id!);
            showToast('success', 'Group deleted');
            loadGroups();
        }
    };

    const renderTreeNode = (node: TreeNode, depth: number = 0) => {
        const isExpanded = expandedNodes.has(node.id!);
        const hasChildren = node.children.length > 0;

        return (
            <div key={node.id} className="tree-node-wrapper">
                <div
                    className={`tree-node ${hasChildren ? 'has-children' : ''}`}
                    style={{ paddingLeft: `${depth * 24 + 16}px` }}
                >
                    <button
                        className="tree-toggle"
                        onClick={() => toggleExpand(node.id!)}
                        style={{ visibility: hasChildren ? 'visible' : 'hidden' }}
                    >
                        <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>
                            {isExpanded ? 'expand_more' : 'chevron_right'}
                        </span>
                    </button>

                    <span className="material-symbols-rounded tree-icon" style={{ color: NATURE_COLORS[node.nature] }}>
                        {node.nature === 'assets' ? 'account_balance_wallet' :
                            node.nature === 'liabilities' ? 'credit_card' :
                                node.nature === 'income' ? 'trending_up' :
                                    node.nature === 'expense' ? 'trending_down' : 'savings'}
                    </span>

                    <span className="tree-label">{node.name}</span>

                    <span className="tree-badge" style={{ background: NATURE_COLORS[node.nature] + '22', color: NATURE_COLORS[node.nature] }}>
                        {NATURE_LABELS[node.nature]}
                    </span>

                    {node.isDefault && (
                        <span className="tree-tag">System</span>
                    )}

                    <div className="tree-actions">
                        <button className="tree-action-btn" title="Add Sub-Group" onClick={() => openCreateForm(node.id!)}>
                            <span className="material-symbols-rounded">add</span>
                        </button>
                        {!node.isDefault && (
                            <>
                                <button className="tree-action-btn" title="Edit" onClick={() => openEditForm(node)}>
                                    <span className="material-symbols-rounded">edit</span>
                                </button>
                                <button className="tree-action-btn danger" title="Delete" onClick={() => handleDelete(node)}>
                                    <span className="material-symbols-rounded">delete</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {isExpanded && hasChildren && (
                    <div className="tree-children">
                        {node.children.map(child => renderTreeNode(child, depth + 1))}
                    </div>
                )}
            </div>
        );
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
                        <span className="material-symbols-rounded" style={{ color: 'var(--primary)' }}>account_tree</span>
                        Ledger Groups
                    </h2>
                    <p className="page-subtitle">
                        Manage accounting groups — {groups.length} groups
                    </p>
                </div>
                <div className="page-header-actions">
                    <button className="btn btn-outlined" onClick={expandAll} title="Expand All">
                        <span className="material-symbols-rounded">unfold_more</span>
                        Expand
                    </button>
                    <button className="btn btn-outlined" onClick={collapseAll} title="Collapse All">
                        <span className="material-symbols-rounded">unfold_less</span>
                        Collapse
                    </button>
                    <button className="btn btn-primary" onClick={() => openCreateForm()}>
                        <span className="material-symbols-rounded">add</span>
                        New Group
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="search-bar" style={{ marginBottom: '16px' }}>
                <span className="material-symbols-rounded search-icon">search</span>
                <input
                    type="text"
                    placeholder="Search groups..."
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

            {/* Tree View */}
            <div className="card tree-container">
                {filteredTree.length === 0 ? (
                    <div className="empty-state" style={{ padding: '48px' }}>
                        <span className="material-symbols-rounded" style={{ fontSize: '48px', opacity: 0.3 }}>folder_off</span>
                        <p>{searchTerm ? 'No matching groups found' : 'No ledger groups yet'}</p>
                    </div>
                ) : (
                    filteredTree.map(node => renderTreeNode(node))
                )}
            </div>

            {/* Create/Edit Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h3>{editingGroup ? 'Edit Group' : 'Create Ledger Group'}</h3>
                            <button className="modal-close" onClick={() => setShowForm(false)}>
                                <span className="material-symbols-rounded">close</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Group Name *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.name}
                                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                    placeholder="Enter group name"
                                    autoFocus
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Under Group (Parent)</label>
                                <select
                                    className="form-input"
                                    value={formData.parentId || ''}
                                    onChange={e => setFormData(p => ({
                                        ...p,
                                        parentId: e.target.value ? Number(e.target.value) : undefined
                                    }))}
                                >
                                    <option value="">— Primary (Root Level) —</option>
                                    {groups
                                        .filter(g => g.id !== editingGroup?.id)
                                        .map(g => (
                                            <option key={g.id} value={g.id}>{g.name}</option>
                                        ))
                                    }
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Nature</label>
                                <select
                                    className="form-input"
                                    value={formData.nature}
                                    onChange={e => setFormData(p => ({ ...p, nature: e.target.value as LedgerGroupNature }))}
                                >
                                    {Object.entries(NATURE_LABELS).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.affectsGrossProfit}
                                        onChange={e => setFormData(p => ({ ...p, affectsGrossProfit: e.target.checked }))}
                                    />
                                    Affects Gross Profit
                                </label>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-outlined" onClick={() => setShowForm(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSave}>
                                <span className="material-symbols-rounded">save</span>
                                {editingGroup ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
