'use client';

import * as React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  type?: 'success' | 'error' | 'info';
}

interface ToastContextType {
  toast: (options: Omit<Toast, 'id'>) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback(
    ({ title, description, type = 'info' }: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: Toast = { id, title, description, type };
      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast]
  );

  const success = React.useCallback(
    (title: string, description?: string) => {
      toast({ title, description, type: 'success' });
    },
    [toast]
  );

  const error = React.useCallback(
    (title: string, description?: string) => {
      toast({ title, description, type: 'error' });
    },
    [toast]
  );

  const info = React.useCallback(
    (title: string, description?: string) => {
      toast({ title, description, type: 'info' });
    },
    [toast]
  );

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      {children}
      {/* Toast viewport */}
      <div
        className="fixed bottom-4 right-4 z-50 flex max-w-sm w-full flex-col gap-2 pointer-events-none px-4 sm:px-0"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.type === 'error' ? 'alert' : 'status'}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-lg border p-3.5 shadow-md transition-all',
              t.type === 'success' &&
                'border-emerald-300 bg-white text-emerald-950 dark:border-emerald-800 dark:bg-zinc-900 dark:text-emerald-100',
              t.type === 'error' &&
                'border-red-300 bg-white text-red-950 dark:border-red-800 dark:bg-zinc-900 dark:text-red-100',
              t.type === 'info' &&
                'border-zinc-300 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100'
            )}
          >
            <div className="mt-0.5 shrink-0">
              {t.type === 'success' && (
                <CheckCircle2 className="h-4 w-4 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
              )}
              {t.type === 'error' && (
                <AlertCircle className="h-4 w-4 text-red-700 dark:text-red-400" aria-hidden="true" />
              )}
              {t.type === 'info' && (
                <Info className="h-4 w-4 text-zinc-700 dark:text-zinc-400" aria-hidden="true" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold leading-tight">{t.title}</p>
              {t.description && (
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 leading-normal">
                  {t.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              aria-label="Dismiss notification"
              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer p-0.5 rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="sr-only">Dismiss</span>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
