import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import TenderList from './components/TenderList';
import TenderDetail from './components/TenderDetail';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-6 max-w-7xl">
          <Routes>
            <Route path="/" element={<TenderList />} />
            <Route path="/tender/:ocid" element={<TenderDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;