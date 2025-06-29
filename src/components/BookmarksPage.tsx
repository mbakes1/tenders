import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bookmark, AlertCircle, Zap } from 'lucide-react';
import { useBookmarks, useCurrentUser } from '../lib/queries';
import TenderCard from './TenderCard';
import SkeletonCard from './SkeletonCard';
import ErrorPage from './ErrorPage';

const BookmarksPage: React.FC = () => {
  // Use TanStack Query for data fetching
  const { data: currentUser } = useCurrentUser();
  const {
    data: bookmarks = [],
    isLoading,
    isError,
    error,
    refetch
  } = useBookmarks(1, 24);

  const user = currentUser?.user;

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Header Skeleton */}
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-64"></div>
        </div>

        {/* Bookmarks Grid Skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <ErrorPage
        type="404"
        title="Authentication Required"
        message="Please sign in to view your bookmarked opportunities. Join BidBase to save and track government tenders that match your business goals."
      />
    );
  }

  if (isError) {
    return (
      <ErrorPage
        type="500"
        title="Error Loading Bookmarks"
        message={error instanceof Error ? error.message : 'Failed to load bookmarks'}
        showRetry={true}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Back Navigation */}
      <Link
        to="/"
        className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors font-medium text-sm sm:text-base"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Opportunities
      </Link>

      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <Bookmark className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Saved Opportunities</h1>
            <p className="text-sm sm:text-base text-gray-600">
              {bookmarks.length} {bookmarks.length === 1 ? 'opportunity' : 'opportunities'} saved for later
            </p>
          </div>
        </div>
      </div>

      {/* Bookmarks Grid */}
      {bookmarks.length === 0 ? (
        <div className="text-center py-12 sm:py-16 px-4">
          <div className="bg-white rounded-lg border border-gray-200 p-8 sm:p-12 max-w-md mx-auto">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Zap className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Saved Opportunities Yet</h3>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">
              Start building your opportunity pipeline! Bookmark government tenders that align with your business expertise and growth goals.
            </p>
            <Link
              to="/"
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
            >
              Discover Opportunities
            </Link>
            
            {/* Tip */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                💡 <strong>Pro Tip:</strong> Saved opportunities sync across all your devices and help you track application deadlines!
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bookmarks.map((tender, index) => (
            <div key={tender.ocid} className="animate-slide-up" style={{ animationDelay: `${index * 25}ms` }}>
              <TenderCard tender={tender} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookmarksPage;