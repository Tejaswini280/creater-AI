import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Modal Z-Index hierarchy
export const MODAL_Z_INDEX = {
  BASE: 1000,
  OVERLAY: 1050,
  CONTENT: 1060,
  TOOLTIP: 1070,
  DROPDOWN: 1080,
  POPOVER: 1090,
} as const;

interface ModalState {
  id: string;
  isOpen: boolean;
  zIndex: number;
}

interface ModalContextType {
  activeModals: ModalState[];
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;
  closeAllModals: () => void;
  getModalZIndex: (modalId: string) => number;
  isModalOpen: (modalId: string) => boolean;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [activeModals, setActiveModals] = useState<ModalState[]>([]);

  const openModal = useCallback((modalId: string) => {
    setActiveModals(prev => {
      // Remove if already exists
      const filtered = prev.filter(modal => modal.id !== modalId);

      // Calculate z-index based on position in stack
      const baseZIndex = MODAL_Z_INDEX.BASE;
      const zIndexIncrement = 10; // Increment per modal level
      const newZIndex = baseZIndex + (filtered.length * zIndexIncrement);

      // Add new modal with calculated z-index
      return [...filtered, {
        id: modalId,
        isOpen: true,
        zIndex: newZIndex
      }];
    });
  }, []);

  const closeModal = useCallback((modalId: string) => {
    setActiveModals(prev => prev.filter(modal => modal.id !== modalId));
  }, []);

  const closeAllModals = useCallback(() => {
    setActiveModals([]);
  }, []);

  const getModalZIndex = useCallback((modalId: string) => {
    const modal = activeModals.find(m => m.id === modalId);
    return modal?.zIndex || MODAL_Z_INDEX.BASE;
  }, [activeModals]);

  const isModalOpen = useCallback((modalId: string) => {
    return activeModals.some(modal => modal.id === modalId && modal.isOpen);
  }, [activeModals]);

  const value: ModalContextType = {
    activeModals,
    openModal,
    closeModal,
    closeAllModals,
    getModalZIndex,
    isModalOpen,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
};

// Higher-order component for modal management
export const withModalManager = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return React.forwardRef<any, P>((props, ref) => (
    <ModalProvider>
      <Component {...props} ref={ref} />
    </ModalProvider>
  ));
};

// Modal backdrop component with proper z-index
interface ModalBackdropProps {
  modalId: string;
  onClose?: () => void;
  children: ReactNode;
  className?: string;
}

export const ModalBackdrop: React.FC<ModalBackdropProps> = ({
  modalId,
  onClose,
  children,
  className = ''
}) => {
  const { getModalZIndex, closeModal } = useModal();
  const zIndex = getModalZIndex(modalId);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  }, [onClose]);

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && onClose) {
      onClose();
    }
  }, [onClose]);

  React.useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleEscape]);

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity ${className}`}
      style={{ zIndex: zIndex - 1 }}
      onClick={handleBackdropClick}
    >
      {children}
    </div>
  );
};

// Modal content wrapper with proper z-index
interface ModalContentProps {
  modalId: string;
  children: ReactNode;
  className?: string;
}

export const ModalContent: React.FC<ModalContentProps> = ({
  modalId,
  children,
  className = ''
}) => {
  const { getModalZIndex } = useModal();
  const zIndex = getModalZIndex(modalId);

  return (
    <div
      className={`relative ${className}`}
      style={{ zIndex }}
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>
  );
};

export default ModalProvider;
