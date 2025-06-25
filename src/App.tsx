import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
  );
}

export default App;