import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
  onDismiss: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onDismiss
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(id);
    }, 300); // Match exit animation duration
  };

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          iconColor: 'text-green-600',
          titleColor: 'text-green-800',
          messageColor: 'text-green-700'
        };
      case 'error':
        return {
          icon: AlertCircle,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-600',
          titleColor: 'text-red-800',
          messageColor: 'text-red-700'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          iconColor: 'text-amber-600',
          titleColor: 'text-amber-800',
          messageColor: 'text-amber-700'
        };
      case 'info':
      default:
        return {
          icon: Info,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-600',
          titleColor: 'text-blue-800',
          messageColor: 'text-blue-700'
        };
    }
  };

  const config = getToastConfig();
  const IconComponent = config.icon;

  return (
    <div
      className={`
        relative max-w-sm w-full ${config.bgColor} ${config.borderColor} border rounded-lg shadow-lg p-4
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isExiting 
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-full opacity-0 scale-95'
        }
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start space-x-3">
        <div className={`flex-shrink-0 w-5 h-5 ${config.iconColor} mt-0.5`}>
          <IconComponent className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-semibold ${config.titleColor} leading-tight`}>
            {title}
          </h4>
          {message && (
            <p className={`text-sm ${config.messageColor} mt-1 leading-relaxed`}>
              {message}
            </p>
          )}
        </div>
        
        <button
          onClick={handleDismiss}
          className={`flex-shrink-0 p-1 rounded-md hover:bg-black hover:bg-opacity-10 transition-colors ${config.iconColor}`}
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {/* Progress bar for timed dismissal */}
      {duration > 0 && (
        <div className={`absolute bottom-0 left-0 h-1 ${config.borderColor} bg-opacity-30 rounded-b-lg overflow-hidden`}>
          <div 
            className={`h-full ${config.iconColor.replace('text-', 'bg-')} bg-opacity-60 animate-shrink-width`}
            style={{ 
              animation: `shrink-width ${duration}ms linear forwards`
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Toast;