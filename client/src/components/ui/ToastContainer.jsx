import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { removeToast, selectToasts } from '../../features/ui/uiSlice';

const Toast = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, toast.duration || 5000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertCircle
  };

  const styles = {
    success: 'bg-success-50 border-success-200 text-success-800',
    error: 'bg-danger-50 border-danger-200 text-danger-800',
    info: 'bg-primary-50 border-primary-200 text-primary-800',
    warning: 'bg-warning-50 border-warning-200 text-warning-800'
  };

  const Icon = icons[toast.type] || Info;

  return (
    <div className={`flex items-center p-4 mb-3 rounded-lg border shadow-sm ${styles[toast.type] || styles.info}`}>
      <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
      <p className="flex-1 text-sm">{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        className="ml-3 flex-shrink-0 hover:opacity-70"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

const ToastContainer = () => {
  const dispatch = useDispatch();
  const toasts = useSelector(selectToasts);

  const handleClose = (id) => {
    dispatch(removeToast(id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 w-96">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={handleClose} />
      ))}
    </div>
  );
};

export default ToastContainer;
