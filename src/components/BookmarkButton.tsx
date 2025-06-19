import React, { useState, useEffect } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
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

  useEffect(() => {
    // Check auth status
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // Check if tender is bookmarked
        const { isBookmarked } = await checkIfBookmarked(tenderOcid);
        setIsBookmarked(isBookmarked || false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
        if (session?.user) {
          const { isBookmarked } = await checkIfBookmarked(tenderOcid);
          setIsBookmarked(isBookmarked || false);
        } else {
          setIsBookmarked(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [tenderOcid]);

  const handleBookmarkToggle = async () => {
    if (!user) {
      onAuthRequired();
      return;
    }

    setLoading(true);
    try {
      if (isBookmarked) {
        const { error } = await removeBookmark(tenderOcid);
        if (!error) {
          setIsBookmarked(false);
        }
      } else {
        const { error } = await addBookmark(tenderOcid);
        if (!error) {
          setIsBookmarked(true);
        }
      }
    } catch (error) {
      console.error('Bookmark error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleBookmarkToggle}
      disabled={loading}
      className={`flex items-center space-x-1 px-3 py-1.5 rounded-md transition-colors font-medium text-sm disabled:opacity-50 ${
        isBookmarked
          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      } ${className}`}
      title={user ? (isBookmarked ? 'Remove bookmark' : 'Add bookmark') : 'Sign in to bookmark'}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
      ) : isBookmarked ? (
        <BookmarkCheck className="w-4 h-4" />
      ) : (
        <Bookmark className="w-4 h-4" />
      )}
      <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
    </button>
  );
};

export default BookmarkButton;