import React, { useState } from 'react';
import { Bookmark, BookmarkCheck, AlertCircle } from 'lucide-react';
import { useIsBookmarked, useAddBookmark, useRemoveBookmark } from '../lib/queries';
import { useCurrentUser } from '../lib/queries';

interface BookmarkButtonProps {
  tenderOcid: string;
  onAuthRequired: () => void;
  className?: string;
}

const BookmarkButton: React.FC<BookmarkButtonProps> = ({ 
  tenderOcid, 
  onAuthRequired, 
  className = "" 
}) => {
  const [error, setError] = useState<string | null>(null);

  // Use TanStack Query for state management
  const { data: currentUser } = useCurrentUser();
  const { data: bookmarkData, isLoading: isCheckingBookmark } = useIsBookmarked(tenderOcid);
  const addBookmarkMutation = useAddBookmark();
  const removeBookmarkMutation = useRemoveBookmark();

  const user = currentUser?.user;
  const isBookmarked = bookmarkData?.isBookmarked || false;
  const isLoading = isCheckingBookmark || addBookmarkMutation.isPending || removeBookmarkMutation.isPending;

  // Validate OCID format
  const isValidOcid = (ocid: string) => {
    return ocid && typeof ocid === 'string' && ocid.trim().length > 0;
  };

  const handleBookmarkToggle = async () => {
    // Clear any previous errors
    setError(null);

    // Validation checks
    if (!isValidOcid(tenderOcid)) {
      setError('Invalid tender reference');
      return;
    }

    if (!user) {
      onAuthRequired();
      return;
    }

    if (isLoading) {
      return; // Prevent double-clicks
    }

    try {
      if (isBookmarked) {
        await removeBookmarkMutation.mutateAsync(tenderOcid);
      } else {
        await addBookmarkMutation.mutateAsync(tenderOcid);
      }
    } catch (err) {
      console.error('Bookmark operation failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Bookmark operation failed';
      
      // Show user-friendly error messages
      if (errorMessage.includes('duplicate')) {
        setError('This tender is already bookmarked');
      } else if (errorMessage.includes('not found')) {
        setError('Tender not found');
      } else if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
        setError('Connection issue - please try again');
      } else {
        setError('Unable to update bookmark - please try again');
      }
    }
  };

  // Don't render if OCID is invalid
  if (!isValidOcid(tenderOcid)) {
    return null;
  }

  // Clear error when bookmark status changes successfully
  React.useEffect(() => {
    if (!addBookmarkMutation.isError && !removeBookmarkMutation.isError) {
      setError(null);
    }
  }, [addBookmarkMutation.isError, removeBookmarkMutation.isError]);

  return (
    <div className="relative">
      <button
        onClick={handleBookmarkToggle}
        disabled={isLoading}
        className={`flex items-center space-x-1 px-3 py-1.5 rounded-md transition-colors font-medium text-sm disabled:opacity-50 ${
          isBookmarked
            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        } ${className}`}
        title={
          !user 
            ? 'Sign in to bookmark' 
            : error 
              ? `Error: ${error}` 
              : isBookmarked 
                ? 'Remove bookmark' 
                : 'Add bookmark'
        }
        aria-label={
          !user 
            ? 'Sign in to bookmark this tender' 
            : isBookmarked 
              ? 'Remove bookmark' 
              : 'Add bookmark'
        }
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
        ) : error ? (
          <AlertCircle className="w-4 h-4" />
        ) : isBookmarked ? (
          <BookmarkCheck className="w-4 h-4" />
        ) : (
          <Bookmark className="w-4 h-4" />
        )}
        <span>
          {isLoading 
            ? 'Saving...' 
            : error 
              ? 'Error' 
              : isBookmarked 
                ? 'Bookmarked' 
                : 'Bookmark'
          }
        </span>
      </button>

      {/* Error tooltip */}
      {error && (
        <div className="absolute top-full left-0 mt-1 z-10 bg-red-50 border border-red-200 rounded-md p-2 shadow-lg min-w-max">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-red-800 font-medium">Bookmark Error</p>
              <p className="text-xs text-red-700">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-xs text-red-600 hover:text-red-700 underline mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookmarkButton;