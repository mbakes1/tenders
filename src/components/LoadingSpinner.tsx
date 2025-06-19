import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center">
      <div className="relative">
        <div className="w-8 h-8 border-2 border-gray-200 rounded-full animate-spin"></div>
        <div className="absolute top-0 left-0 w-8 h-8 border-2 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
      </div>
      <span className="ml-3 text-gray-700 font-medium">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;