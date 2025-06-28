import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Home, User, Menu, X } from 'lucide-react';
import AuthModal from './AuthModal';
import UserMenu from './UserMenu';
import { useCurrentUser, useCacheUtils } from '../lib/queries';

const Header: React.FC = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Use TanStack Query for user state
  const { data: currentUser } = useCurrentUser();
  const { invalidateUserData } = useCacheUtils();
  
  const user = currentUser?.user;

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
  };

  const handleSignOut = () => {
    // Invalidate user-related cache data
    invalidateUserData();
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group" onClick={closeMobileMenu}>
              <div className="p-2 bg-blue-600 rounded-lg group-hover:bg-blue-700 transition-colors">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-gray-900">SA Tenders</h1>
                <p className="text-xs text-gray-500">Open Contracting Portal</p>
              </div>
              <div className="sm:hidden">
                <h1 className="text-base font-semibold text-gray-900">SA Tenders</h1>
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-4">
              <Link 
                to="/" 
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors text-sm font-medium"
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Link>

              {user ? (
                <UserMenu onSignOut={handleSignOut} />
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <User className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4 space-y-2">
              <Link 
                to="/" 
                onClick={closeMobileMenu}
                className="flex items-center space-x-3 px-3 py-3 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors font-medium"
              >
                <Home className="w-5 h-5" />
                <span>Home</span>
              </Link>

              {user ? (
                <div className="space-y-2">
                  <Link
                    to="/bookmarks"
                    onClick={closeMobileMenu}
                    className="flex items-center space-x-3 px-3 py-3 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors font-medium"
                  >
                    <User className="w-5 h-5" />
                    <span>My Bookmarks</span>
                  </Link>
                  <div className="px-3 py-2">
                    <p className="text-sm text-gray-500 mb-2">Signed in as:</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setShowAuthModal(true);
                    closeMobileMenu();
                  }}
                  className="flex items-center space-x-3 w-full px-3 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  <User className="w-5 h-5" />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
};

export default Header;