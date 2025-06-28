import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { signUp, signIn } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  // Real-time validation
  useEffect(() => {
    const errors: { email?: string; password?: string } = {};

    if (email && !email.includes('@')) {
      errors.email = 'Please enter a valid email address';
    }

    if (password && password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
  }, [email, password]);

  // Password strength indicator
  const getPasswordStrength = (pwd: string) => {
    if (pwd.length < 6) return { strength: 'weak', color: 'text-red-600', width: '25%' };
    if (pwd.length < 8) return { strength: 'fair', color: 'text-yellow-600', width: '50%' };
    if (pwd.length < 12 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) {
      return { strength: 'good', color: 'text-blue-600', width: '75%' };
    }
    if (pwd.length >= 12 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) {
      return { strength: 'strong', color: 'text-green-600', width: '100%' };
    }
    return { strength: 'fair', color: 'text-yellow-600', width: '50%' };
  };

  const passwordStrength = password ? getPasswordStrength(password) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous states
    setError(null);
    setSuccess(null);

    // Validate form
    if (Object.keys(validationErrors).length > 0) {
      setError('Please fix the validation errors before continuing');
      return;
    }

    if (!email || !password) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = isSignUp 
        ? await signUp(email, password)
        : await signIn(email, password);

      if (error) {
        setError(error.message);
      } else if (data.user) {
        if (isSignUp && !data.session) {
          // Email confirmation required
          setSuccess('Account created! Please check your email for a confirmation link.');
          setEmail('');
          setPassword('');
          setIsSignUp(false);
        } else {
          // Successful sign in
          setSuccess(isSignUp ? 'Account created successfully!' : 'Welcome back!');
          setTimeout(() => {
            onSuccess();
            onClose();
            resetForm();
          }, 1000);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setError(null);
    setSuccess(null);
    setIsSignUp(false);
    setValidationErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const switchMode = () => {
    setIsSignUp(!isSignUp);
    setError(null);
    setSuccess(null);
    setValidationErrors({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-modal p-4 safe-area-inset">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto scrollbar-thin gpu-accelerated">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl">
          <div className="min-w-0 flex-1 pr-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">
              {isSignUp ? 'Join SA Tenders to bookmark opportunities' : 'Sign in to access your bookmarks'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-target tap-highlight-none flex-shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {/* Success Message */}
          {success && (
            <div className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg animate-slide-down">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-green-800">Success!</p>
                <p className="text-sm text-green-700 mt-1">{success}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg animate-slide-down">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-red-800">Authentication Error</p>
                <p className="text-sm text-red-700 mt-1 break-words">{error}</p>
              </div>
            </div>
          )}

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className={`form-input pl-10 pr-3 ${
                  validationErrors.email 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
                placeholder="Enter your email"
                autoComplete="email"
                inputMode="email"
              />
            </div>
            {validationErrors.email && (
              <p className="mt-1 text-xs text-red-600">{validationErrors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
                className={`form-input pl-10 pr-12 ${
                  validationErrors.password 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
                placeholder="Enter your password"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center touch-target tap-highlight-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
            
            {/* Password validation */}
            {validationErrors.password && (
              <p className="mt-1 text-xs text-red-600">{validationErrors.password}</p>
            )}
            
            {/* Password strength indicator for sign up */}
            {isSignUp && password && !validationErrors.password && passwordStrength && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600">Password strength:</span>
                  <span className={`font-medium ${passwordStrength.color}`}>
                    {passwordStrength.strength}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div 
                    className={`h-1 rounded-full transition-all duration-300 ${
                      passwordStrength.strength === 'weak' ? 'bg-red-500' :
                      passwordStrength.strength === 'fair' ? 'bg-yellow-500' :
                      passwordStrength.strength === 'good' ? 'bg-blue-500' : 'bg-green-500'
                    }`}
                    style={{ width: passwordStrength.width }}
                  ></div>
                </div>
              </div>
            )}
            
            {isSignUp && (
              <p className="mt-2 text-xs text-gray-500">
                Password must be at least 6 characters long
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || Object.keys(validationErrors).length > 0}
            className="btn btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <User className="w-5 h-5" />
                <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={switchMode}
                disabled={loading}
                className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 touch-target tap-highlight-none"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>

          {/* Benefits */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center mb-3">
              ✨ <strong>Benefits of having an account:</strong>
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <span>📌</span>
                <span>Bookmark tenders</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>🔔</span>
                <span>Get notifications</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>📊</span>
                <span>Track history</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>💾</span>
                <span>Sync devices</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;