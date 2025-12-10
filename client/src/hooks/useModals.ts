import { useState, useCallback } from 'react';

export type ModalType =
  | 'history'
  | 'impact'
  | 'resetConfirm'
  | 'logoutConfirm'
  | 'beerManagement'
  | 'adminManagement'
  | 'presetManagement';

export function useModals() {
  const [openModal, setOpenModal] = useState<ModalType | null>(null);

  const open = useCallback((modal: ModalType) => {
    setOpenModal(modal);
  }, []);

  const close = useCallback(() => {
    setOpenModal(null);
  }, []);

  const isOpen = useCallback((modal: ModalType) => {
    return openModal === modal;
  }, [openModal]);

  const toggle = useCallback((modal: ModalType) => {
    setOpenModal(prev => prev === modal ? null : modal);
  }, []);

  return {
    openModal,
    open,
    close,
    isOpen,
    toggle,
    // Convenience getters for each modal
    showHistory: openModal === 'history',
    showImpact: openModal === 'impact',
    showResetConfirm: openModal === 'resetConfirm',
    showLogoutConfirm: openModal === 'logoutConfirm',
    showBeerManagement: openModal === 'beerManagement',
    showAdminManagement: openModal === 'adminManagement',
    showPresetManagement: openModal === 'presetManagement',
  };
}
