import React from 'react';
import { createPortal } from 'react-dom';
import Toast, { type ToastProps } from './Toast';

interface ToastContainerProps {
  toasts: ToastProps[];
  onRemoveToast: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemoveToast }) => {
  if (toasts.length === 0) return null;

  const toastPortal = (
    <div className="fixed top-4 right-4 z-50 pointer-events-none">
      <div className="flex flex-col space-y-3">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              {...toast}
              onClose={onRemoveToast}
            />
          </div>
        ))}
      </div>
    </div>
  );

  return createPortal(toastPortal, document.body);
};

export default ToastContainer;
