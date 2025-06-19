import React from 'react';

const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 h-full flex flex-col animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          {/* Title skeleton */}
          <div className="h-5 bg-gray-200 rounded mb-2 w-4/5"></div>
          <div className="h-4 bg-gray-200 rounded mb-2 w-3/5"></div>
          {/* Category skeleton */}
          <div className="h-6 bg-gray-100 rounded w-20"></div>
        </div>
        <div className="ml-3 flex-shrink-0">
          <div className="w-6 h-6 bg-gray-100 rounded"></div>
        </div>
      </div>

      {/* Description skeleton */}
      <div className="mb-4 flex-1">
        <div className="h-4 bg-gray-200 rounded mb-2 w-full"></div>
        <div className="h-4 bg-gray-200 rounded mb-2 w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>

      {/* Details skeleton */}
      <div className="space-y-3 mt-auto">
        {/* Buyer */}
        <div className="flex items-center">
          <div className="w-6 h-6 bg-gray-100 rounded mr-2 flex-shrink-0"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>

        {/* Closing Date */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-6 h-6 bg-gray-100 rounded mr-2 flex-shrink-0"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="h-6 bg-gray-100 rounded w-16"></div>
        </div>
      </div>

      {/* Footer skeleton */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-100 rounded w-12"></div>
          <div className="h-4 bg-gray-100 rounded w-20"></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;