import React from 'react';

const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 h-full flex flex-col animate-pulse"> {/* Reduced padding */}
      {/* Header */}
      <div className="flex items-start justify-between mb-2"> {/* Reduced margin */}
        <div className="flex-1 min-w-0">
          {/* Title skeleton */}
          <div className="h-4 bg-gray-200 rounded mb-1.5 w-4/5"></div> {/* Smaller height and margin */}
          <div className="h-3 bg-gray-200 rounded mb-1.5 w-3/5"></div> {/* Smaller height and margin */}
          {/* Category skeleton */}
          <div className="h-5 bg-gray-100 rounded w-16"></div> {/* Smaller height and width */}
        </div>
        <div className="ml-2 flex-shrink-0"> {/* Reduced margin */}
          <div className="w-5 h-5 bg-gray-100 rounded"></div> {/* Smaller size */}
        </div>
      </div>

      {/* Description skeleton */}
      <div className="mb-3 flex-1"> {/* Reduced margin */}
        <div className="h-3 bg-gray-200 rounded mb-1.5 w-full"></div> {/* Smaller height and margin */}
        <div className="h-3 bg-gray-200 rounded mb-1.5 w-5/6"></div> {/* Smaller height and margin */}
        <div className="h-3 bg-gray-200 rounded w-3/4"></div> {/* Smaller height */}
      </div>

      {/* Details skeleton */}
      <div className="space-y-2 mt-auto"> {/* Reduced spacing */}
        {/* Buyer */}
        <div className="flex items-center">
          <div className="w-4 h-4 bg-gray-100 rounded mr-1.5 flex-shrink-0"></div> {/* Smaller size and margin */}
          <div className="h-3 bg-gray-200 rounded w-2/3"></div> {/* Smaller height */}
        </div>

        {/* Closing Date */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-100 rounded mr-1.5 flex-shrink-0"></div> {/* Smaller size and margin */}
            <div className="h-3 bg-gray-200 rounded w-24"></div> {/* Smaller height and width */}
          </div>
          <div className="h-5 bg-gray-100 rounded w-12"></div> {/* Smaller height and width */}
        </div>
      </div>

      {/* Footer skeleton */}
      <div className="mt-3 pt-2 border-t border-gray-100"> {/* Reduced margin and padding */}
        <div className="flex items-center justify-between">
          <div className="h-5 bg-gray-100 rounded w-10"></div> {/* Smaller height and width */}
          <div className="h-3 bg-gray-100 rounded w-16"></div> {/* Smaller height and width */}
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;