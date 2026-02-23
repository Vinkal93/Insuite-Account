import { createContext, useContext, useState, useCallback, useEffect } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
    id: number;
    type: ToastType;
    title: string;
    message?: string;
    duration: number;
}

interface ToastContextType {
    showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => { } });

export const useToast = () => useContext(ToastContext);

let toastIdCounter = 0;

function ToastItem({ toast, onRemove }: { toast: ToastItem; onRemove: (id: number) => void }) {
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setExiting(true), toast.duration - 300);
        const removeTimer = setTimeout(() => onRemove(toast.id), toast.duration);
        return () => { clearTimeout(timer); clearTimeout(removeTimer); };
    }, [toast, onRemove]);

    const icons: Record<ToastType, string> = {
        success: 'check_circle', error: 'error', warning: 'warning', info: 'info'
    };

    return (
        <div className={`toast-item toast-${toast.type} ${exiting ? 'toast-exit' : 'toast-enter'}`}>
            <span className="material-symbols-rounded toast-icon">{icons[toast.type]}</span>
            <div className="toast-content">
                <div className="toast-title">{toast.title}</div>
                {toast.message && <div className="toast-message">{toast.message}</div>}
            </div>
            <button className="toast-close" onClick={() => onRemove(toast.id)}>
                <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>close</span>
            </button>
            <div className="toast-progress" style={{ animationDuration: `${toast.duration}ms` }} />
        </div>
    );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const showToast = useCallback((type: ToastType, title: string, message?: string, duration = 3500) => {
        const id = ++toastIdCounter;
        setToasts(prev => [...prev.slice(-4), { id, type, title, message, duration }]);
    }, []);

    const removeToast = useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="toast-container">
                {toasts.map(t => <ToastItem key={t.id} toast={t} onRemove={removeToast} />)}
            </div>
        </ToastContext.Provider>
    );
}
