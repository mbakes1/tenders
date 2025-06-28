import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Home, Search, RefreshCw, AlertTriangle, Wifi, WifiOff } from 'lucide-react';

interface ErrorPageProps {
  type?: '404' | '500' | 'network' | 'search';
  title?: string;
  message?: string;
  showRetry?: boolean;
  onRetry?: () => void;
}

const ErrorPage: React.FC<ErrorPageProps> = ({ 
  type = '404', 
  title,
  message,
  showRetry = false,
  onRetry
}) => {
  const getErrorConfig = () => {
    switch (type) {
      case '404':
        return {
          icon: Building2,
          title: title || "Tender Not Found",
          message: message || "Looks like this tender has gone missing! It might have been closed, removed, or the link might be incorrect.",
          primaryAction: { text: "Browse Open Tenders", to: "/" },
          secondaryAction: { text: "Search Tenders", to: "/?search=true" },
          illustration: "🏗️",
          bgColor: "bg-blue-50",
          iconColor: "text-blue-600",
          borderColor: "border-blue-200",
          gradient: "from-blue-100 to-blue-50"
        };
      case '500':
        return {
          icon: AlertTriangle,
          title: title || "Something Went Wrong",
          message: message || "Our tender processing system encountered an unexpected error. Don't worry, our team has been notified and is working on a fix!",
          primaryAction: { text: "Try Again", onClick: onRetry },
          secondaryAction: { text: "Go Home", to: "/" },
          illustration: "⚠️",
          bgColor: "bg-red-50",
          iconColor: "text-red-600",
          borderColor: "border-red-200",
          gradient: "from-red-100 to-red-50"
        };
      case 'network':
        return {
          icon: WifiOff,
          title: title || "Connection Problem",
          message: message || "Unable to connect to our tender database. Please check your internet connection and try again.",
          primaryAction: { text: "Retry Connection", onClick: onRetry },
          secondaryAction: { text: "Go Offline", to: "/" },
          illustration: "📡",
          bgColor: "bg-amber-50",
          iconColor: "text-amber-600",
          borderColor: "border-amber-200",
          gradient: "from-amber-100 to-amber-50"
        };
      case 'search':
        return {
          icon: Search,
          title: title || "No Tenders Found",
          message: message || "We couldn't find any tenders matching your search. Try different keywords or browse all available opportunities.",
          primaryAction: { text: "Clear Search", onClick: onRetry },
          secondaryAction: { text: "View All Tenders", to: "/" },
          illustration: "🔍",
          bgColor: "bg-gray-50",
          iconColor: "text-gray-600",
          borderColor: "border-gray-200",
          gradient: "from-gray-100 to-gray-50"
        };
      default:
        return {
          icon: Building2,
          title: "Oops!",
          message: "Something unexpected happened.",
          primaryAction: { text: "Go Home", to: "/" },
          secondaryAction: null,
          illustration: "🤔",
          bgColor: "bg-gray-50",
          iconColor: "text-gray-600",
          borderColor: "border-gray-200",
          gradient: "from-gray-100 to-gray-50"
        };
    }
  };

  const config = getErrorConfig();
  const IconComponent = config.icon;

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-8 sm:py-12">
      <div className={`max-w-md w-full ${config.bgColor} ${config.borderColor} border rounded-xl p-6 sm:p-8 text-center relative overflow-hidden gpu-accelerated`}>
        {/* Background Gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-50`}></div>
        
        {/* Content */}
        <div className="relative z-10">
          {/* Illustration */}
          <div className="text-4xl sm:text-6xl mb-4 animate-bounce-gentle">
            {config.illustration}
          </div>
          
          {/* Icon */}
          <div className={`w-12 h-12 sm:w-16 sm:h-16 ${config.bgColor} rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 border-2 ${config.borderColor} shadow-mobile`}>
            <IconComponent className={`w-6 h-6 sm:w-8 sm:h-8 ${config.iconColor}`} />
          </div>

          {/* Content */}
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
            {config.title}
          </h1>
          
          <p className="text-gray-600 mb-6 sm:mb-8 leading-relaxed text-sm sm:text-base">
            {config.message}
          </p>

          {/* Actions */}
          <div className="space-y-3">
            {/* Primary Action */}
            {config.primaryAction.to ? (
              <Link
                to={config.primaryAction.to}
                className="btn btn-primary w-full flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4 sm:w-5 sm:h-5" />
                {config.primaryAction.text}
              </Link>
            ) : (
              <button
                onClick={config.primaryAction.onClick}
                className="btn btn-primary w-full flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
                {config.primaryAction.text}
              </button>
            )}

            {/* Secondary Action */}
            {config.secondaryAction && (
              <>
                {config.secondaryAction.to ? (
                  <Link
                    to={config.secondaryAction.to}
                    className={`btn btn-secondary w-full flex items-center justify-center gap-2 ${config.borderColor}`}
                  >
                    <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                    {config.secondaryAction.text}
                  </Link>
                ) : (
                  <button
                    onClick={config.secondaryAction.onClick}
                    className={`btn btn-secondary w-full flex items-center justify-center gap-2 ${config.borderColor}`}
                  >
                    {config.secondaryAction.text}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Fun Footer */}
          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-2 text-xs sm:text-sm text-gray-500">
              <span>💡</span>
              <span><strong>Tip:</strong> Bookmark interesting tenders to never lose track!</span>
            </div>
          </div>

          {/* Additional Help for Mobile */}
          <div className="mt-4 mobile-only">
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
              <div className="flex items-center space-x-1">
                <Wifi className="w-3 h-3" />
                <span>Check connection</span>
              </div>
              <div className="flex items-center space-x-1">
                <RefreshCw className="w-3 h-3" />
                <span>Pull to refresh</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;