import { useState, useCallback } from 'react';
import { type ToastProps } from '../components/Toast';

interface ToastOptions {
  type?: 'success' | 'error' | 'info' | 'warning';
  message?: string;
  duration?: number;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = useCallback((title: string, options: ToastOptions = {}) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastProps = {
      id,
      title,
      type: options.type || 'info',
      message: options.message,
      duration: options.duration || 4000,
      onClose: () => {}, // Will be set by the container
    };

    setToasts(prev => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const success = useCallback((title: string, message?: string, duration?: number) => {
    return addToast(title, { type: 'success', message, duration });
  }, [addToast]);

  const error = useCallback((title: string, message?: string, duration?: number) => {
    return addToast(title, { type: 'error', message, duration });
  }, [addToast]);

  const warning = useCallback((title: string, message?: string, duration?: number) => {
    return addToast(title, { type: 'warning', message, duration });
  }, [addToast]);

  const info = useCallback((title: string, message?: string, duration?: number) => {
    return addToast(title, { type: 'info', message, duration });
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    warning,
    info,
  };
};
