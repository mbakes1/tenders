import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Home, User, Menu, X, Zap } from 'lucide-react';
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
        <div className="container mx-auto px-3 max-w-7xl"> {/* Reduced padding */}
          <div className="flex items-center justify-between h-12"> {/* Reduced height */}
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 group" onClick={closeMobileMenu}> {/* Reduced spacing */}
              <div className="p-1.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-md group-hover:from-blue-700 group-hover:to-purple-700 transition-all duration-200"> {/* Smaller padding and radius */}
                <Zap className="w-4 h-4 text-white" /> {/* Smaller icon */}
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base font-bold text-gray-900">BidBase</h1> {/* Smaller text */}
                <p className="text-xs text-gray-500 leading-tight">Government Procurement Made Simple</p> {/* Smaller text */}
              </div>
              <div className="sm:hidden">
                <h1 className="text-sm font-bold text-gray-900">BidBase</h1> {/* Smaller text */}
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-2"> {/* Reduced spacing */}
              <Link 
                to="/" 
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors text-xs font-medium" /* Smaller padding and text */
              >
                <Home className="w-3.5 h-3.5" /> {/* Smaller icon */}
                <span>Opportunities</span>
              </Link>

              {user ? (
                <UserMenu onSignOut={handleSignOut} />
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 transition-all duration-200 text-xs font-medium shadow-sm" /* Smaller padding and text */
                >
                  <User className="w-3.5 h-3.5" /> {/* Smaller icon */}
                  <span>Get Started</span>
                </button>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors" /* Smaller padding */
            >
              {mobileMenuOpen ? (
                <X className="w-4 h-4" /> /* Smaller icon */
              ) : (
                <Menu className="w-4 h-4" /> /* Smaller icon */
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-2 space-y-1"> {/* Reduced padding and spacing */}
              <Link 
                to="/" 
                onClick={closeMobileMenu}
                className="flex items-center space-x-2 px-2.5 py-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors font-medium text-sm" /* Smaller padding and text */
              >
                <Home className="w-4 h-4" /> {/* Smaller icon */}
                <span>Opportunities</span>
              </Link>

              {user ? (
                <div className="space-y-1"> {/* Reduced spacing */}
                  <Link
                    to="/bookmarks"
                    onClick={closeMobileMenu}
                    className="flex items-center space-x-2 px-2.5 py-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors font-medium text-sm" /* Smaller padding and text */
                  >
                    <User className="w-4 h-4" /> {/* Smaller icon */}
                    <span>My Bookmarks</span>
                  </Link>
                  <div className="px-2.5 py-1.5"> {/* Smaller padding */}
                    <p className="text-xs text-gray-500 mb-1">Signed in as:</p> {/* Smaller text */}
                    <p className="text-xs font-medium text-gray-900 truncate">{user.email}</p> {/* Smaller text */}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setShowAuthModal(true);
                    closeMobileMenu();
                  }}
                  className="flex items-center space-x-2 w-full px-2.5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium text-sm" /* Smaller padding and text */
                >
                  <User className="w-4 h-4" /> {/* Smaller icon */}
                  <span>Get Started</span>
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