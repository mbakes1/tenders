import React from 'react';
import { FallbackProps } from 'react-error-boundary';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

export function GlobalErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  // Log the error for debugging (in production, you'd send this to a service like Sentry)
  console.error("🚨 Caught by Global Error Boundary:", error);
  
  // Extract useful error information
  const errorMessage = error?.message || 'An unexpected error occurred';
  const errorStack = error?.stack;
  const isChunkError = errorMessage.includes('Loading chunk') || errorMessage.includes('ChunkLoadError');
  const isNetworkError = errorMessage.includes('fetch') || errorMessage.includes('network');

  // Handle different types of errors with specific messaging
  const getErrorConfig = () => {
    if (isChunkError) {
      return {
        title: "App Update Available",
        message: "A new version of the app is available. Please refresh to get the latest updates.",
        icon: RefreshCw,
        primaryAction: "Refresh Page",
        showTechnicalDetails: false,
        bgColor: "bg-blue-50",
        iconColor: "text-blue-600",
        borderColor: "border-blue-200"
      };
    }
    
    if (isNetworkError) {
      return {
        title: "Connection Problem",
        message: "Unable to connect to our servers. Please check your internet connection and try again.",
        icon: AlertTriangle,
        primaryAction: "Try Again",
        showTechnicalDetails: false,
        bgColor: "bg-amber-50",
        iconColor: "text-amber-600",
        borderColor: "border-amber-200"
      };
    }
    
    return {
      title: "Something Went Wrong",
      message: "An unexpected error occurred while loading the page. Our team has been notified and is working on a fix.",
      icon: Bug,
      primaryAction: "Try Again",
      showTechnicalDetails: true,
      bgColor: "bg-red-50",
      iconColor: "text-red-600",
      borderColor: "border-red-200"
    };
  };

  const config = getErrorConfig();
  const IconComponent = config.icon;

  const handleRefresh = () => {
    if (isChunkError) {
      // For chunk errors, do a hard refresh to get the latest code
      window.location.reload();
    } else {
      // For other errors, try the error boundary reset first
      resetErrorBoundary();
    }
  };

  const handleGoHome = () => {
    // Use window.location to navigate home instead of React Router Link
    // This ensures navigation works even when router context is not available
    window.location.href = '/';
  };

  const handleReportError = () => {
    // In production, you could send this to an error reporting service
    const errorReport = {
      message: errorMessage,
      stack: errorStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
    
    console.log('Error Report:', errorReport);
    
    // For now, copy to clipboard for easy reporting
    navigator.clipboard?.writeText(JSON.stringify(errorReport, null, 2))
      .then(() => alert('Error details copied to clipboard'))
      .catch(() => alert('Unable to copy error details'));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className={`max-w-lg w-full ${config.bgColor} ${config.borderColor} border rounded-xl p-8 text-center shadow-lg`}>
        {/* Error Icon */}
        <div className={`w-16 h-16 ${config.bgColor} rounded-full flex items-center justify-center mx-auto mb-6 border-2 ${config.borderColor}`}>
          <IconComponent className={`w-8 h-8 ${config.iconColor}`} />
        </div>

        {/* Error Content */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {config.title}
        </h1>
        
        <p className="text-gray-600 mb-8 leading-relaxed">
          {config.message}
        </p>

        {/* Action Buttons */}
        <div className="space-y-3 mb-6">
          {/* Primary Action */}
          <button
            onClick={handleRefresh}
            className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            {config.primaryAction}
          </button>

          {/* Secondary Actions */}
          <div className="flex space-x-3">
            <button
              onClick={handleGoHome}
              className={`flex-1 inline-flex items-center justify-center px-4 py-2 border ${config.borderColor} text-sm font-medium rounded-lg ${config.iconColor} bg-white hover:bg-gray-50 transition-colors`}
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </button>
            
            {config.showTechnicalDetails && (
              <button
                onClick={handleReportError}
                className={`flex-1 inline-flex items-center justify-center px-4 py-2 border ${config.borderColor} text-sm font-medium rounded-lg ${config.iconColor} bg-white hover:bg-gray-50 transition-colors`}
              >
                <Bug className="w-4 h-4 mr-2" />
                Report Issue
              </button>
            )}
          </div>
        </div>

        {/* Technical Details (Collapsible) */}
        {config.showTechnicalDetails && (
          <details className="text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 mb-3">
              Show technical details
            </summary>
            <div className="bg-gray-100 rounded-lg p-4 text-xs font-mono text-gray-700 overflow-auto max-h-32">
              <div className="mb-2">
                <strong>Error:</strong> {errorMessage}
              </div>
              {errorStack && (
                <div>
                  <strong>Stack:</strong>
                  <pre className="whitespace-pre-wrap mt-1">{errorStack}</pre>
                </div>
              )}
            </div>
          </details>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            If this problem persists, please contact support with the error details above.
          </p>
        </div>
      </div>
    </div>
  );
}

// Optional: Create a custom hook for error reporting
export const useErrorReporting = () => {
  const reportError = React.useCallback((error: Error, errorInfo?: any) => {
    // In production, send to error reporting service (Sentry, LogRocket, etc.)
    console.error('Error reported:', { error, errorInfo });
    
    // Example: Send to analytics or error tracking service
    // analytics.track('error_occurred', {
    //   error_message: error.message,
    //   error_stack: error.stack,
    //   component_stack: errorInfo?.componentStack,
    //   url: window.location.href
    // });
  }, []);

  return { reportError };
};