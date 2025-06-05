import { useState, useCallback } from 'react';
import ConfirmationModal from '../components/ConfirmationModal';

interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  icon?: React.ReactNode;
}

interface ConfirmationState extends ConfirmationOptions {
  isOpen: boolean;
  onConfirm: () => void;
}

export const useConfirmation = () => {
  const [confirmationState, setConfirmationState] = useState<ConfirmationState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showConfirmation = useCallback((options: ConfirmationOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmationState({
        ...options,
        isOpen: true,
        onConfirm: () => {
          resolve(true);
          setConfirmationState(prev => ({ ...prev, isOpen: false }));
        },
      });
    });
  }, []);

  const hideConfirmation = useCallback(() => {
    setConfirmationState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const ConfirmationComponent = useCallback(() => (
    <ConfirmationModal
      isOpen={confirmationState.isOpen}
      onClose={hideConfirmation}
      onConfirm={confirmationState.onConfirm}
      title={confirmationState.title}
      message={confirmationState.message}
      confirmText={confirmationState.confirmText}
      cancelText={confirmationState.cancelText}
      type={confirmationState.type}
      icon={confirmationState.icon}
    />
  ), [confirmationState, hideConfirmation]);

  return {
    showConfirmation,
    ConfirmationComponent,
  };
};

export default useConfirmation;
