'use client';

import { createContext, useContext, useState, useCallback } from 'react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

interface ToastContextType {
  toasts: Toast[];
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

const ICONS = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
const COLORS = {
  success: { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)', color: 'var(--low)' },
  error: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', color: 'var(--critical)' },
  warning: { bg: 'rgba(234,179,8,0.12)', border: 'rgba(234,179,8,0.3)', color: 'var(--medium)' },
  info: { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)', color: 'var(--brand-primary-light)' },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const add = useCallback((type: Toast['type'], title: string, message?: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const ctx: ToastContextType = {
    toasts,
    success: (t, m) => add('success', t, m),
    error: (t, m) => add('error', t, m),
    warning: (t, m) => add('warning', t, m),
    info: (t, m) => add('info', t, m),
    dismiss,
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {/* Toast Renderer */}
      <div
        id="toast-container"
        style={{
          position: 'fixed',
          bottom: 24, right: 24,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          pointerEvents: 'none',
        }}
      >
        {toasts.map(toast => {
          const c = COLORS[toast.type];
          return (
            <div
              key={toast.id}
              className="animate-fade-in"
              style={{
                background: c.bg,
                border: `1px solid ${c.border}`,
                borderRadius: 'var(--radius-md)',
                padding: '14px 18px',
                backdropFilter: 'blur(16px)',
                boxShadow: 'var(--shadow-lg)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                minWidth: 280, maxWidth: 380,
                pointerEvents: 'all',
                cursor: 'pointer',
              }}
              onClick={() => dismiss(toast.id)}
              id={`toast-${toast.id}`}
            >
              <span style={{ fontSize: '1.125rem', flexShrink: 0 }}>{ICONS[toast.type]}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: c.color, marginBottom: toast.message ? 3 : 0 }}>
                  {toast.title}
                </div>
                {toast.message && (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {toast.message}
                  </div>
                )}
              </div>
              <button
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.875rem', flexShrink: 0, padding: '0 2px' }}
                id={`toast-dismiss-${toast.id}`}
              >✕</button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
