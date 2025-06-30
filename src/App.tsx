import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { QueryProvider } from './providers/QueryProvider';
import { GlobalErrorFallback } from './components/GlobalErrorBoundary';
import Header from './components/Header';
import TenderList from './components/TenderList';
import TenderDetail from './components/TenderDetail';
import BookmarksPage from './components/BookmarksPage';
import ErrorPage from './components/ErrorPage';
import AdminRoute from './components/admin/AdminRoute';

// Lazy load admin components
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));

function App() {
  return (
    <ErrorBoundary 
      FallbackComponent={GlobalErrorFallback}
      onError={(error, errorInfo) => {
        // Log error for debugging/monitoring
        console.error('🚨 Global Error Boundary caught an error:', error, errorInfo);
        
        // In production, you would send this to an error reporting service
        // Example: Sentry.captureException(error, { extra: errorInfo });
      }}
      onReset={() => {
        // Optional: Clear any error state, reload data, etc.
        console.log('🔄 Error boundary reset triggered');
        
        // You could clear React Query cache, reset global state, etc.
        // queryClient.clear();
      }}
    >
      <QueryProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Header />
            <main className="container mx-auto px-4 py-4 sm:py-6 max-w-7xl">
              <Routes>
                <Route path="/" element={<TenderList />} />
                <Route path="/tender/:ocid" element={<TenderDetail />} />
                <Route path="/bookmarks" element={<BookmarksPage />} />
                
                {/* Admin Routes */}
                <Route path="/admin" element={<AdminRoute />}>
                  <Route 
                    index 
                    element={
                      <Suspense fallback={
                        <div className="flex items-center justify-center py-12">
                          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      }>
                        <AdminDashboard />
                      </Suspense>
                    } 
                  />
                </Route>

                {/* 404 Catch-all */}
                <Route path="*" element={<ErrorPage type="404" />} />
              </Routes>
            </main>
          </div>
        </Router>
      </QueryProvider>
    </ErrorBoundary>
  );
}

export default App;