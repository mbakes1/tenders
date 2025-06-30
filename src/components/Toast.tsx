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
    }, 200); // Faster exit animation
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
        relative max-w-xs w-full ${config.bgColor} ${config.borderColor} border rounded-lg shadow-lg p-3
        transform transition-all duration-200 ease-in-out
        ${isVisible && !isExiting 
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-full opacity-0 scale-95'
        }
      `} /* Smaller max width, padding, and faster animation */
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start space-x-2"> {/* Reduced spacing */}
        <div className={`flex-shrink-0 w-4 h-4 ${config.iconColor} mt-0.5`}> {/* Smaller icon */}
          <IconComponent className="w-4 h-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className={`text-xs font-semibold ${config.titleColor} leading-tight`}> {/* Smaller text */}
            {title}
          </h4>
          {message && (
            <p className={`text-xs ${config.messageColor} mt-0.5 leading-relaxed`}> {/* Smaller text and margin */}
              {message}
            </p>
          )}
        </div>
        
        <button
          onClick={handleDismiss}
          className={`flex-shrink-0 p-0.5 rounded-md hover:bg-black hover:bg-opacity-10 transition-colors ${config.iconColor}`} /* Smaller padding */
          aria-label="Dismiss notification"
        >
          <X className="w-3 h-3" /> {/* Smaller icon */}
        </button>
      </div>
      
      {/* Progress bar for timed dismissal */}
      {duration > 0 && (
        <div className={`absolute bottom-0 left-0 h-0.5 ${config.borderColor} bg-opacity-30 rounded-b-lg overflow-hidden`}> {/* Thinner progress bar */}
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