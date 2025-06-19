import React from 'react';

const SkeletonDetail: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Back Navigation Skeleton */}
      <div className="flex items-center">
        <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
        <div className="h-4 bg-gray-200 rounded w-32"></div>
      </div>

      {/* Header Section Skeleton */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between space-y-4 lg:space-y-0">
          <div className="flex-1">
            {/* Title */}
            <div className="h-8 bg-gray-200 rounded mb-3 w-4/5"></div>
            
            {/* OCID and Bid Number */}
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="h-4 bg-gray-200 rounded w-48"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>

            {/* Category */}
            <div className="h-6 bg-gray-100 rounded w-24"></div>
          </div>

          {/* Status and Urgency */}
          <div className="flex flex-col items-end space-y-2">
            <div className="h-6 bg-gray-100 rounded w-16"></div>
            <div className="h-5 bg-gray-100 rounded w-20"></div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description Skeleton */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="h-6 bg-gray-200 rounded mb-4 w-32"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/5"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>

          {/* Documents Skeleton */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="h-6 bg-gray-200 rounded mb-4 w-28"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-gray-200 rounded"></div>
                    <div className="space-y-1">
                      <div className="h-4 bg-gray-200 rounded w-48"></div>
                      <div className="h-3 bg-gray-200 rounded w-32"></div>
                    </div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-12"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Key Information Skeleton */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="h-6 bg-gray-200 rounded mb-4 w-36"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-gray-200 rounded mt-0.5"></div>
                  <div className="space-y-1 flex-1">
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Buyer Information Skeleton */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="h-6 bg-gray-200 rounded mb-4 w-40"></div>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 bg-gray-200 rounded mt-0.5"></div>
                <div className="space-y-1 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-48"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                </div>
              </div>
              
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-36"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonDetail;