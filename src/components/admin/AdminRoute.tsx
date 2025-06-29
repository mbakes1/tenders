import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Shield, AlertCircle, Loader2 } from 'lucide-react';
import { useCurrentUser, useIsAdmin } from '../../lib/queries';

const AdminRoute: React.FC = () => {
  // Use TanStack Query for user and admin state
  const { data: currentUser, isLoading: userLoading, error: userError } = useCurrentUser();
  const { data: adminData, isLoading: adminLoading, error: adminError } = useIsAdmin();

  const user = currentUser?.user;
  const isAdmin = adminData?.isAdmin || false;
  const loading = userLoading || adminLoading;
  const hasError = userError || adminError;

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg border border-gray-200 p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
            Verifying Admin Access
          </h3>
          <p className="text-gray-600 text-center mb-4">
            Checking your administrative privileges...
          </p>
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg border border-red-200 p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
            Authentication Error
          </h3>
          <p className="text-red-600 text-center mb-4">
            Unable to verify your access permissions. Please try again.
          </p>
          <div className="text-center space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Retry
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Show access denied if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg border border-red-200 p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
            Access Denied
          </h3>
          <p className="text-red-600 text-center mb-4">
            You don't have administrative privileges to access this area.
          </p>
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600 mb-4">
              Signed in as: <span className="font-medium">{user.email}</span>
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render admin content
  return <Outlet />;
};

export default AdminRoute;