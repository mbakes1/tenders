import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle, ChevronLeft, ChevronRight, Database, TrendingUp, Search, X } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import TenderCard from './TenderCard';
import SkeletonCard from './SkeletonCard';

interface TenderData {
  success: boolean;
  tenders: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    total_tenders: number;
    open_tenders: number;
    closing_soon: number;
    last_updated: string;
  };
  lastUpdated: string;
}

const TenderList: React.FC = () => {
  const [data, setData] = useState<TenderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLoading, setPageLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const tendersPerPage = 24;

  const fetchTendersFromDatabase = async (page = 1, search = '') => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration missing. Please check your environment variables.');
      }

      console.log(`Fetching tenders from database (page ${page}, search: "${search}")...`);

      const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
      const response = await fetch(`${supabaseUrl}/functions/v1/get-tenders?page=${page}&limit=${tendersPerPage}&openOnly=true${searchParam}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Non-JSON response:', responseText);
        throw new Error('Server returned non-JSON response. Please check if the edge function is deployed correctly.');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch tenders');
      }

      console.log(`Successfully fetched ${result.tenders.length} tenders from database`);
      setData(result);
      setError(null);
    } catch (err) {
      console.error('Database fetch error:', err);
      let errorMessage = 'Failed to fetch tenders from database';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    }
  };

  const goToPage = async (page: number) => {
    setCurrentPage(page);
    setPageLoading(true);
    try {
      await fetchTendersFromDatabase(page, searchQuery);
    } finally {
      setPageLoading(false);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToPrevious = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const goToNext = () => {
    if (data && currentPage < data.pagination.totalPages) {
      goToPage(currentPage + 1);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    setSearchLoading(true);
    try {
      await fetchTendersFromDatabase(1, query);
    } finally {
      setSearchLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
    fetchTendersFromDatabase(1, '');
  };

  useEffect(() => {
    fetchTendersFromDatabase(1).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Stats Skeleton */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div>
                  <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i}>
                    <div className="h-6 bg-gray-200 rounded w-16 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                  </div>
                ))}
              </div>

              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-48"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Box Skeleton */}
        <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>

        {/* Tenders Grid Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="bg-white rounded-lg border border-red-200 p-8 max-w-md mx-auto">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to load tenders</h3>
          <p className="text-red-600 text-sm mb-6">{error}</p>
          <button
            onClick={() => fetchTendersFromDatabase(currentPage, searchQuery)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {data?.stats.open_tenders?.toLocaleString() || '0'}
                </h2>
                <p className="text-gray-600 font-medium">Active Opportunities</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div>
                <p className="text-xl font-semibold text-gray-900">
                  {data?.stats.total_tenders?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-gray-500">Total in Database</p>
              </div>
              <div>
                <p className="text-xl font-semibold text-gray-900">
                  {data?.stats.closing_soon?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-gray-500">Closing Soon</p>
              </div>
              <div>
                <p className="text-xl font-semibold text-gray-900">
                  {data?.pagination.totalPages || '0'}
                </p>
                <p className="text-sm text-gray-500">Total Pages</p>
              </div>
              <div>
                <p className="text-xl font-semibold text-green-600">
                  {data?.stats.total_tenders && data?.stats.open_tenders ? 
                    `${((data.stats.open_tenders / data.stats.total_tenders) * 100).toFixed(1)}%` : '0%'}
                </p>
                <p className="text-sm text-gray-500">Open Rate</p>
              </div>
            </div>

            {data?.stats.last_updated && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>Database updated: {new Date(data.stats.last_updated).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Auto-sync Notice */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Database className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-blue-900">Automated Data Updates</p>
              <p className="text-sm text-blue-700">
                Our database is automatically updated every 6 hours with the latest tender information from government sources.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Box */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search tenders by title, description, buyer, category, or department..."
            className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          )}
        </div>
        {searchQuery && (
          <div className="mt-2 text-sm text-gray-600">
            {searchLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                <span>Searching...</span>
              </div>
            ) : (
              <span>
                Showing results for: <span className="font-medium text-gray-900">"{searchQuery}"</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Pagination Info */}
      {data && data.tenders.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing <span className="text-gray-900 font-medium">{((currentPage - 1) * tendersPerPage) + 1}</span> to{' '}
              <span className="text-gray-900 font-medium">{Math.min(currentPage * tendersPerPage, data.pagination.total)}</span> of{' '}
              <span className="text-gray-900 font-medium">{data.pagination.total.toLocaleString()}</span> {searchQuery ? 'matching' : 'open'} tenders
            </p>
            <p className="text-sm text-gray-500">
              Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{data.pagination.totalPages}</span>
            </p>
          </div>
        </div>
      )}

      {/* Tenders Grid */}
      {!data?.tenders || data.tenders.length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-white rounded-lg border border-gray-200 p-12 max-w-md mx-auto">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              {searchQuery ? <Search className="w-6 h-6 text-gray-400" /> : <Database className="w-6 h-6 text-gray-400" />}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? 'No matching tenders found' : 'No open tenders found'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery 
                ? `No tenders match your search for "${searchQuery}". Try different keywords or clear the search.`
                : 'No open tenders are currently available in the database. Our system automatically updates every 6 hours.'
              }
            </p>
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Clear Search
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {pageLoading || searchLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: tendersPerPage }, (_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.tenders.map((tender, index) => (
                <div key={tender.ocid} className="animate-slide-up" style={{ animationDelay: `${index * 25}ms` }}>
                  <TenderCard tender={tender} />
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {data.pagination.totalPages > 1 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={goToPrevious}
                  disabled={currentPage === 1 || pageLoading || searchLoading}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, data.pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (data.pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= data.pagination.totalPages - 2) {
                      pageNum = data.pagination.totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        disabled={pageLoading || searchLoading}
                        className={`px-3 py-2 rounded-md transition-colors font-medium text-sm disabled:opacity-50 ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  {data.pagination.totalPages > 5 && currentPage < data.pagination.totalPages - 2 && (
                    <>
                      <span className="px-2 text-gray-400">...</span>
                      <button
                        onClick={() => goToPage(data.pagination.totalPages)}
                        disabled={pageLoading || searchLoading}
                        className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium text-gray-700 text-sm disabled:opacity-50"
                      >
                        {data.pagination.totalPages}
                      </button>
                    </>
                  )}
                </div>

                <button
                  onClick={goToNext}
                  disabled={currentPage === data.pagination.totalPages || pageLoading || searchLoading}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TenderList;