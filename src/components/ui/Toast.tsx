'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface Toast {
  id: number;
  message: string;
  type: 'ok' | 'err';
}

interface ToastContextType {
  toast: (message: string, type?: 'ok' | 'err') => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });
export const useToast = () => useContext(ToastContext);

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: 'ok' | 'err' = 'ok') => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`} style={{ bottom: `${22 + toasts.indexOf(t) * 50}px` }}>
          {t.message}
        </div>
      ))}
    </ToastContext.Provider>
  );
}
