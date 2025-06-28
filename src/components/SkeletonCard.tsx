import React from 'react';

const SkeletonCard: React.FC = () => {
  return (
    <div className="card p-3 sm:p-4 lg:p-5 h-full flex flex-col animate-pulse gpu-accelerated">
      {/* Header */}
      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="flex-1 min-w-0">
          {/* Title skeleton */}
          <div className="h-4 sm:h-5 bg-gray-200 rounded mb-2 w-4/5"></div>
          <div className="h-3 sm:h-4 bg-gray-200 rounded mb-2 w-3/5"></div>
          
          {/* Tags skeleton */}
          <div className="flex items-center gap-2 mb-2">
            <div className="h-5 sm:h-6 bg-gray-100 rounded w-16 sm:w-20"></div>
            <div className="h-5 sm:h-6 bg-gray-100 rounded w-12 sm:w-16"></div>
          </div>
        </div>
        <div className="flex-shrink-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-lg"></div>
        </div>
      </div>

      {/* Description skeleton */}
      <div className="mb-4 flex-1">
        <div className="h-3 sm:h-4 bg-gray-200 rounded mb-2 w-full"></div>
        <div className="h-3 sm:h-4 bg-gray-200 rounded mb-2 w-5/6"></div>
        <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4"></div>
      </div>

      {/* Details skeleton */}
      <div className="space-y-3 mt-auto">
        {/* Buyer */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-100 rounded flex-shrink-0"></div>
          <div className="h-3 sm:h-4 bg-gray-200 rounded w-2/3"></div>
        </div>

        {/* Closing Date */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-100 rounded flex-shrink-0"></div>
            <div className="h-3 sm:h-4 bg-gray-200 rounded w-28 sm:w-32"></div>
          </div>
          <div className="h-5 sm:h-6 bg-gray-100 rounded w-12 sm:w-16 flex-shrink-0"></div>
        </div>
      </div>

      {/* Footer skeleton */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2 flex-1">
            <div className="h-5 sm:h-6 bg-gray-100 rounded w-12 sm:w-16"></div>
            <div className="h-3 bg-gray-100 rounded w-16 sm:w-20"></div>
          </div>
          <div className="h-6 sm:h-8 bg-gray-100 rounded w-16 sm:w-20 flex-shrink-0"></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;