import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Home, User, Menu, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AuthModal from './AuthModal';
import UserMenu from './UserMenu';

const Header: React.FC = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  React.useEffect(() => {
    // Get current user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
  };

  const handleSignOut = () => {
    setUser(null);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-fixed safe-area-top">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between h-14 sm:h-16 lg:h-18">
            {/* Logo */}
            <Link 
              to="/" 
              className="flex items-center space-x-2 sm:space-x-3 group touch-target tap-highlight-none" 
              onClick={closeMobileMenu}
            >
              <div className="p-1.5 sm:p-2 bg-blue-600 rounded-lg group-hover:bg-blue-700 transition-colors gpu-accelerated">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 truncate">
                  SA Tenders
                </h1>
                <p className="hidden sm:block text-xs text-gray-500 truncate">
                  Open Contracting Portal
                </p>
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-2 lg:space-x-4">
              <Link 
                to="/" 
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 text-sm font-medium touch-target tap-highlight-none"
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Link>

              {user ? (
                <UserMenu onSignOut={handleSignOut} />
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 text-sm font-medium touch-target tap-highlight-none"
                >
                  <User className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 touch-target tap-highlight-none"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          <div 
            className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${
              mobileMenuOpen 
                ? 'max-h-96 opacity-100 pb-4' 
                : 'max-h-0 opacity-0 pb-0'
            }`}
          >
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <Link 
                to="/" 
                onClick={closeMobileMenu}
                className="flex items-center space-x-3 px-3 py-3 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 font-medium touch-target tap-highlight-none"
              >
                <Home className="w-5 h-5" />
                <span>Home</span>
              </Link>

              {user ? (
                <div className="space-y-2">
                  <Link
                    to="/bookmarks"
                    onClick={closeMobileMenu}
                    className="flex items-center space-x-3 px-3 py-3 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 font-medium touch-target tap-highlight-none"
                  >
                    <User className="w-5 h-5" />
                    <span>My Bookmarks</span>
                  </Link>
                  <div className="px-3 py-2 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Signed in as:</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setShowAuthModal(true);
                    closeMobileMenu();
                  }}
                  className="flex items-center space-x-3 w-full px-3 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 font-medium touch-target tap-highlight-none"
                >
                  <User className="w-5 h-5" />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>
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