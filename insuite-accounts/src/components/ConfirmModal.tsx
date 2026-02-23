import { useState, useCallback, createContext, useContext, type ReactNode } from 'react';

interface ConfirmOptions {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    icon?: string;
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function useConfirm() {
    const context = useContext(ConfirmContext);
    if (!context) throw new Error('useConfirm must be used within ConfirmProvider');
    return context.confirm;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<{
        isOpen: boolean;
        options: ConfirmOptions;
        resolve: ((value: boolean) => void) | null;
    }>({
        isOpen: false,
        options: { message: '' },
        resolve: null,
    });

    const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setState({ isOpen: true, options, resolve });
        });
    }, []);

    const handleClose = (result: boolean) => {
        state.resolve?.(result);
        setState({ isOpen: false, options: { message: '' }, resolve: null });
    };

    const variantColors = {
        danger: { bg: 'linear-gradient(135deg, #f43f5e 0%, #dc2626 100%)', icon: 'delete_forever', color: '#f43f5e' },
        warning: { bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', icon: 'warning', color: '#f59e0b' },
        info: { bg: 'linear-gradient(135deg, var(--md-sys-color-primary) 0%, #4a9ab8 100%)', icon: 'info', color: 'var(--md-sys-color-primary)' },
    };

    const v = variantColors[state.options.variant || 'danger'];

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            {state.isOpen && (
                <div className="modal-overlay" onClick={() => handleClose(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px', textAlign: 'center' }}>
                        <div className="modal-body" style={{ padding: 'var(--md-sys-spacing-xl) var(--md-sys-spacing-lg)' }}>
                            {/* Icon */}
                            <div style={{
                                width: '64px', height: '64px', borderRadius: '50%',
                                background: v.bg, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', margin: '0 auto var(--md-sys-spacing-lg)',
                                boxShadow: `0 8px 24px ${v.color}30`,
                            }}>
                                <span className="material-symbols-rounded" style={{ fontSize: '28px', color: '#fff' }}>
                                    {state.options.icon || v.icon}
                                </span>
                            </div>

                            {/* Title */}
                            <h3 className="text-title-large" style={{ marginBottom: 'var(--md-sys-spacing-sm)' }}>
                                {state.options.title || 'Are you sure?'}
                            </h3>

                            {/* Message */}
                            <p className="text-body-medium text-muted" style={{ marginBottom: 'var(--md-sys-spacing-xl)', lineHeight: 1.6 }}>
                                {state.options.message}
                            </p>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: 'var(--md-sys-spacing-md)', justifyContent: 'center' }}>
                                <button
                                    className="btn btn-outlined"
                                    onClick={() => handleClose(false)}
                                    style={{ flex: 1, maxWidth: '160px' }}
                                >
                                    {state.options.cancelText || 'Cancel'}
                                </button>
                                <button
                                    className="btn"
                                    onClick={() => handleClose(true)}
                                    style={{
                                        flex: 1, maxWidth: '160px',
                                        background: v.bg, color: '#fff',
                                        boxShadow: `0 4px 16px ${v.color}30`
                                    }}
                                >
                                    {state.options.confirmText || 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
}
