'use client';

import { ModalProvider } from '@/components/ui/Modal';
import { ToastProvider } from '@/components/ui/Toast';
import GlobalLoader from '@/components/GlobalLoader';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ModalProvider>
        <GlobalLoader>
          {children}
        </GlobalLoader>
      </ModalProvider>
    </ToastProvider>
  );
}
