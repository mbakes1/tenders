import React, { useState, useEffect, useCallback } from 'react';
import { Bookmark, BookmarkCheck, AlertCircle } from 'lucide-react';
import { addBookmark, removeBookmark, checkIfBookmarked } from '../lib/supabase';
import { supabase } from '../lib/supabase';

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
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Validate OCID format
  const isValidOcid = useCallback((ocid: string) => {
    return ocid && typeof ocid === 'string' && ocid.trim().length > 0;
  }, []);

  // Check bookmark status with error handling and retry logic
  const checkBookmarkStatus = useCallback(async (userId: string) => {
    if (!isValidOcid(tenderOcid)) {
      console.warn('Invalid OCID provided to BookmarkButton:', tenderOcid);
      return;
    }

    try {
      const { isBookmarked, error } = await checkIfBookmarked(tenderOcid);
      if (error) {
        throw new Error(error.message);
      }
      setIsBookmarked(isBookmarked || false);
      setError(null);
      setRetryCount(0);
    } catch (err) {
      console.error('Error checking bookmark status:', err);
      setError(err instanceof Error ? err.message : 'Failed to check bookmark status');
      
      // Retry logic for transient failures
      if (retryCount < 2) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          checkBookmarkStatus(userId);
        }, 1000 * (retryCount + 1)); // Exponential backoff
      }
    }
  }, [tenderOcid, isValidOcid, retryCount]);

  // Initialize auth state and bookmark status
  useEffect(() => {
    const initializeBookmarkState = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user && isValidOcid(tenderOcid)) {
          await checkBookmarkStatus(user.id);
        } else if (!user) {
          setIsBookmarked(false);
          setError(null);
        }
      } catch (err) {
        console.error('Error initializing bookmark state:', err);
        setError('Failed to initialize bookmark state');
      }
    };

    initializeBookmarkState();
  }, [tenderOcid, checkBookmarkStatus, isValidOcid]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const newUser = session?.user || null;
        setUser(newUser);
        
        if (newUser && isValidOcid(tenderOcid)) {
          await checkBookmarkStatus(newUser.id);
        } else {
          setIsBookmarked(false);
          setError(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [tenderOcid, checkBookmarkStatus, isValidOcid]);

  const handleBookmarkToggle = async () => {
    // Validation checks
    if (!isValidOcid(tenderOcid)) {
      setError('Invalid tender reference');
      return;
    }

    if (!user) {
      onAuthRequired();
      return;
    }

    if (loading) {
      return; // Prevent double-clicks
    }

    setLoading(true);
    setError(null);

    try {
      let result;
      const previousState = isBookmarked;

      if (isBookmarked) {
        // Optimistic update
        setIsBookmarked(false);
        result = await removeBookmark(tenderOcid);
        
        if (result.error) {
          // Revert on error
          setIsBookmarked(true);
          throw new Error(result.error.message);
        }
      } else {
        // Optimistic update
        setIsBookmarked(true);
        result = await addBookmark(tenderOcid);
        
        if (result.error) {
          // Revert on error
          setIsBookmarked(false);
          throw new Error(result.error.message);
        }
      }

      // Success feedback
      setError(null);
      setRetryCount(0);

    } catch (err) {
      console.error('Bookmark operation failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Bookmark operation failed';
      setError(errorMessage);

      // Show user-friendly error messages
      if (errorMessage.includes('duplicate')) {
        setError('This tender is already bookmarked');
        setIsBookmarked(true);
      } else if (errorMessage.includes('not found')) {
        setError('Tender not found');
      } else if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
        setError('Connection issue - please try again');
      } else {
        setError('Unable to update bookmark - please try again');
      }
    } finally {
      setLoading(false);
    }
  };

  // Retry failed bookmark check
  const handleRetryCheck = () => {
    if (user && isValidOcid(tenderOcid)) {
      setError(null);
      setRetryCount(0);
      checkBookmarkStatus(user.id);
    }
  };

  // Don't render if OCID is invalid
  if (!isValidOcid(tenderOcid)) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={handleBookmarkToggle}
        disabled={loading}
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
        {loading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
        ) : error ? (
          <AlertCircle className="w-4 h-4" />
        ) : isBookmarked ? (
          <BookmarkCheck className="w-4 h-4" />
        ) : (
          <Bookmark className="w-4 h-4" />
        )}
        <span>
          {loading 
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
              {retryCount < 2 && (
                <button
                  onClick={handleRetryCheck}
                  className="text-xs text-red-600 hover:text-red-700 underline mt-1"
                >
                  Try again
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookmarkButton;