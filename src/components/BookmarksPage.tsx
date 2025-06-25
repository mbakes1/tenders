import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bookmark, AlertCircle } from 'lucide-react';
import { getUserBookmarks } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import TenderCard from './TenderCard';
import SkeletonCard from './SkeletonCard';
import ErrorPage from './ErrorPage';

const BookmarksPage: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuthAndFetchBookmarks = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          const { data, error } = await getUserBookmarks();
          if (error) {
            setError(error.message);
          } else {
            setBookmarks(data || []);
          }
        }
      } catch (err) {
        setError('Failed to load bookmarks');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchBookmarks();
  }, []);

  if (loading) {
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
        message="Please sign in to view your bookmarked tenders. Create an account to save and track interesting opportunities."
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
        Back to Tenders
      </Link>

      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Bookmark className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Bookmarks</h1>
            <p className="text-sm sm:text-base text-gray-600">
              {bookmarks.length} {bookmarks.length === 1 ? 'tender' : 'tenders'} bookmarked
            </p>
          </div>
        </div>
      </div>

      {/* Bookmarks Grid */}
      {error ? (
        <ErrorPage
          type="500"
          title="Error Loading Bookmarks"
          message={error}
          showRetry={true}
          onRetry={() => window.location.reload()}
        />
      ) : bookmarks.length === 0 ? (
        <div className="text-center py-12 sm:py-16 px-4">
          <div className="bg-white rounded-lg border border-gray-200 p-8 sm:p-12 max-w-md mx-auto">
            <div className="text-6xl mb-4">📌</div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Bookmark className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Bookmarks Yet</h3>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">
              Start bookmarking tenders you're interested in to see them here. Click the bookmark button on any tender card to save it for later.
            </p>
            <Link
              to="/"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Browse Tenders
            </Link>
            
            {/* Tip */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                💡 <strong>Tip:</strong> Bookmarked tenders are saved to your account and sync across all your devices!
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