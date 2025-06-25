import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Home, Search, RefreshCw, AlertTriangle } from 'lucide-react';

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
          borderColor: "border-blue-200"
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
          borderColor: "border-red-200"
        };
      case 'network':
        return {
          icon: RefreshCw,
          title: title || "Connection Problem",
          message: message || "Unable to connect to our tender database. Please check your internet connection and try again.",
          primaryAction: { text: "Retry Connection", onClick: onRetry },
          secondaryAction: { text: "Go Offline", to: "/" },
          illustration: "📡",
          bgColor: "bg-amber-50",
          iconColor: "text-amber-600",
          borderColor: "border-amber-200"
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
          borderColor: "border-gray-200"
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
          borderColor: "border-gray-200"
        };
    }
  };

  const config = getErrorConfig();
  const IconComponent = config.icon;

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className={`max-w-md w-full ${config.bgColor} ${config.borderColor} border rounded-xl p-8 text-center`}>
        {/* Illustration */}
        <div className="text-6xl mb-4">
          {config.illustration}
        </div>
        
        {/* Icon */}
        <div className={`w-16 h-16 ${config.bgColor} rounded-full flex items-center justify-center mx-auto mb-6 border-2 ${config.borderColor}`}>
          <IconComponent className={`w-8 h-8 ${config.iconColor}`} />
        </div>

        {/* Content */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {config.title}
        </h1>
        
        <p className="text-gray-600 mb-8 leading-relaxed">
          {config.message}
        </p>

        {/* Actions */}
        <div className="space-y-3">
          {/* Primary Action */}
          {config.primaryAction.to ? (
            <Link
              to={config.primaryAction.to}
              className={`w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors`}
            >
              <Home className="w-5 h-5 mr-2" />
              {config.primaryAction.text}
            </Link>
          ) : (
            <button
              onClick={config.primaryAction.onClick}
              className={`w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors`}
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              {config.primaryAction.text}
            </button>
          )}

          {/* Secondary Action */}
          {config.secondaryAction && (
            <>
              {config.secondaryAction.to ? (
                <Link
                  to={config.secondaryAction.to}
                  className={`w-full inline-flex items-center justify-center px-6 py-3 border ${config.borderColor} text-base font-medium rounded-lg ${config.iconColor} bg-white hover:bg-gray-50 transition-colors`}
                >
                  <Search className="w-5 h-5 mr-2" />
                  {config.secondaryAction.text}
                </Link>
              ) : (
                <button
                  onClick={config.secondaryAction.onClick}
                  className={`w-full inline-flex items-center justify-center px-6 py-3 border ${config.borderColor} text-base font-medium rounded-lg ${config.iconColor} bg-white hover:bg-gray-50 transition-colors`}
                >
                  {config.secondaryAction.text}
                </button>
              )}
            </>
          )}
        </div>

        {/* Fun Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            💡 <strong>Tip:</strong> Bookmark interesting tenders to never lose track of opportunities!
          </p>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;