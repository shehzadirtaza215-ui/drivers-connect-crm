'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ModalState {
  isOpen: boolean;
  title: string;
  content: ReactNode;
  footer: ReactNode;
}

interface ModalContextType {
  openModal: (title: string, content: ReactNode, footer: ReactNode) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType>({ openModal: () => {}, closeModal: () => {} });
export const useModal = () => useContext(ModalContext);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalState>({ isOpen: false, title: '', content: null, footer: null });

  const openModal = useCallback((title: string, content: ReactNode, footer: ReactNode) => {
    setModal({ isOpen: true, title, content, footer });
  }, []);

  const closeModal = useCallback(() => {
    setModal({ isOpen: false, title: '', content: null, footer: null });
  }, []);

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      {modal.isOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="modal-box">
            <div className="modal-header">
              <span style={{ fontWeight: 600, fontSize: '14px' }}>{modal.title}</span>
              <button className="btn btn-ghost" onClick={closeModal} style={{ fontSize: '16px', lineHeight: 1 }}>✕</button>
            </div>
            <div className="modal-body">{modal.content}</div>
            <div className="modal-footer">{modal.footer}</div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}
