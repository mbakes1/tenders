import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Shield, AlertCircle } from 'lucide-react';
import { useCurrentUser, useIsAdmin } from '../../lib/queries';

const AdminRoute: React.FC = () => {
  // Use TanStack Query for user and admin state
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { data: adminData, isLoading: adminLoading } = useIsAdmin();

  const user = currentUser?.user;
  const isAdmin = adminData?.isAdmin || false;
  const loading = userLoading || adminLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg border border-gray-200 p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600 animate-pulse" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
            Verifying Admin Access
          </h3>
          <p className="text-gray-600 text-center mb-4">
            Checking your administrative privileges...
          </p>
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

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
          <div className="text-center">
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default AdminRoute;