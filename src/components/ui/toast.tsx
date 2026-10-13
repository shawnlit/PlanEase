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
      <div className="fixed bottom-4 right-4 z-50 flex max-w-md flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-lg backdrop-blur-md transition-all animate-in slide-in-from-bottom-5 duration-200',
              t.type === 'success' &&
                'border-emerald-200 bg-white/95 text-emerald-950 dark:border-emerald-900/60 dark:bg-zinc-950/95 dark:text-emerald-100',
              t.type === 'error' &&
                'border-red-200 bg-white/95 text-red-950 dark:border-red-900/60 dark:bg-zinc-950/95 dark:text-red-100',
              t.type === 'info' &&
                'border-zinc-200 bg-white/95 text-zinc-950 dark:border-zinc-800 dark:bg-zinc-950/95 dark:text-zinc-100'
            )}
          >
            <div className="mt-0.5">
              {t.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
              {t.type === 'error' && <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />}
              {t.type === 'info' && <Info className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{t.title}</p>
              {t.description && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{t.description}</p>}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
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
