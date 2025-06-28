import React, { useState, useEffect, useRef } from 'react';
import { User, Bookmark, LogOut, ChevronDown, Shield } from 'lucide-react';
import { signOut } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { useCurrentUser, useIsAdmin, useCacheUtils } from '../lib/queries';

interface UserMenuProps {
  onSignOut: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ onSignOut }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { clearAllCaches } = useCacheUtils();

  // Use TanStack Query for user and admin state
  const { data: currentUser } = useCurrentUser();
  const { data: adminData, isLoading: adminCheckLoading } = useIsAdmin();

  const user = currentUser?.user;
  const isAdmin = adminData?.isAdmin || false;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    clearAllCaches(); // Clear all cached data on sign out
    onSignOut();
    setIsOpen(false);
  };

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isAdmin ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-blue-600'
        }`}>
          {isAdmin ? (
            <Shield className="w-4 h-4 text-white" />
          ) : (
            <User className="w-4 h-4 text-white" />
          )}
        </div>
        <span className="text-sm font-medium hidden sm:block">
          {user.email?.split('@')[0]}
          {isAdmin && !adminCheckLoading && (
            <span className="ml-1 text-xs text-purple-600 font-semibold">ADMIN</span>
          )}
        </span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.email}
            </p>
            {isAdmin && !adminCheckLoading && (
              <p className="text-xs text-purple-600 font-semibold">Administrator</p>
            )}
          </div>
          
          {/* Admin Dashboard Link - Only show for admins */}
          {isAdmin && !adminCheckLoading && (
            <Link
              to="/admin"
              onClick={() => setIsOpen(false)}
              className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors border-b border-gray-100"
            >
              <Shield className="w-4 h-4 text-purple-600" />
              <span className="font-medium">Admin Dashboard</span>
            </Link>
          )}
          
          <Link
            to="/bookmarks"
            onClick={() => setIsOpen(false)}
            className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Bookmark className="w-4 h-4" />
            <span>My Bookmarks</span>
          </Link>
          
          <button
            onClick={handleSignOut}
            className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;