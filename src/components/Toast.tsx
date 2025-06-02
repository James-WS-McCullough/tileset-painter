"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastMessage;
  onRemove: (id: string) => void;
}

function Toast({ toast, onRemove }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (toast.duration !== 0) {
      const timer = setTimeout(() => {
        setIsLeaving(true);
        setTimeout(() => {
          onRemove(toast.id);
        }, 300);
      }, toast.duration || 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, toast.id, onRemove]);

  const handleRemove = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300);
  };

  const getToastStyles = () => {
    switch (toast.type) {
      case "success":
        return "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800";
      case "error":
        return "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800";
      case "warning":
        return "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800";
      case "info":
        return "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800";
      default:
        return "bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800";
    }
  };

  const getIconColor = () => {
    switch (toast.type) {
      case "success":
        return "text-green-600 dark:text-green-400";
      case "error":
        return "text-red-600 dark:text-red-400";
      case "warning":
        return "text-yellow-600 dark:text-yellow-400";
      case "info":
        return "text-blue-600 dark:text-blue-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <CheckCircle className="w-5 h-5" />;
      case "error":
      case "warning":
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <CheckCircle className="w-5 h-5" />;
    }
  };

  const getTitleColor = () => {
    switch (toast.type) {
      case "success":
        return "text-green-800 dark:text-green-200";
      case "error":
        return "text-red-800 dark:text-red-200";
      case "warning":
        return "text-yellow-800 dark:text-yellow-200";
      case "info":
        return "text-blue-800 dark:text-blue-200";
      default:
        return "text-gray-800 dark:text-gray-200";
    }
  };

  const getMessageColor = () => {
    switch (toast.type) {
      case "success":
        return "text-green-700 dark:text-green-300";
      case "error":
        return "text-red-700 dark:text-red-300";
      case "warning":
        return "text-yellow-700 dark:text-yellow-300";
      case "info":
        return "text-blue-700 dark:text-blue-300";
      default:
        return "text-gray-700 dark:text-gray-300";
    }
  };

  return (
    <div
      className={`relative flex items-start p-4 mb-3 border rounded-lg shadow-lg transition-all duration-300 ease-in-out transform ${getToastStyles()} ${
        isVisible && !isLeaving
          ? "translate-x-0 opacity-100"
          : isLeaving
          ? "translate-x-full opacity-0"
          : "translate-x-full opacity-0"
      }`}
    >
      <div className={`flex-shrink-0 ${getIconColor()}`}>{getIcon()}</div>
      <div className="ml-3 flex-1">
        <h4 className={`text-sm font-medium ${getTitleColor()}`}>
          {toast.title}
        </h4>
        {toast.message && (
          <p className={`mt-1 text-sm ${getMessageColor()}`}>{toast.message}</p>
        )}
      </div>
      <button
        onClick={handleRemove}
        className={`ml-4 inline-flex text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 w-96 max-w-sm">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

// Hook for managing toasts
export function useToasts() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, "id">) => {
    const id = Math.random().toString(36).substring(2, 15);
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const showSuccess = (title: string, message?: string, duration?: number) => {
    addToast({ type: "success", title, message, duration });
  };

  const showError = (title: string, message?: string, duration?: number) => {
    addToast({ type: "error", title, message, duration });
  };

  const showWarning = (title: string, message?: string, duration?: number) => {
    addToast({ type: "warning", title, message, duration });
  };

  const showInfo = (title: string, message?: string, duration?: number) => {
    addToast({ type: "info", title, message, duration });
  };

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}
