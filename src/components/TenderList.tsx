import React, { useState, useEffect, useCallback } from 'react';
import { Clock, AlertCircle, ChevronLeft, ChevronRight, Search, X, Filter } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import TenderCard from './TenderCard';
import SkeletonCard from './SkeletonCard';
import { getTenders } from '../lib/supabase';

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
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const tendersPerPage = 24;

  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Trigger search when debounced query changes
  useEffect(() => {
    if (debouncedSearchQuery !== searchQuery) {
      // Still typing, don't search yet
      return;
    }

    // Reset to page 1 when search query changes
    if (currentPage !== 1) {
      setCurrentPage(1);
    }

    // Perform the search
    performSearch(debouncedSearchQuery, 1);
  }, [debouncedSearchQuery]);

  const fetchTendersFromDatabase = async (page = 1, search = '') => {
    try {
      console.log(`Fetching tenders from database (page ${page}, search: "${search}")...`);
      
      const result = await getTenders(page, search, tendersPerPage);
      
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

  const performSearch = async (query: string, page = 1) => {
    setSearchLoading(true);
    try {
      await fetchTendersFromDatabase(page, query);
    } finally {
      setSearchLoading(false);
    }
  };

  const goToPage = async (page: number) => {
    setCurrentPage(page);
    setPageLoading(true);
    try {
      await fetchTendersFromDatabase(page, debouncedSearchQuery);
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

  const handleSearchInputChange = (query: string) => {
    setSearchQuery(query);
    // Show loading state immediately when user starts typing
    if (query.trim() !== debouncedSearchQuery.trim()) {
      setSearchLoading(true);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setCurrentPage(1);
    setSearchLoading(true);
    fetchTendersFromDatabase(1, '').finally(() => setSearchLoading(false));
  };

  useEffect(() => {
    const initializeApp = async () => {
      await fetchTendersFromDatabase(1);
      setLoading(false);
    };

    initializeApp();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Search Box Skeleton */}
        <div className="card p-3 sm:p-4">
          <div className="h-12 sm:h-14 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>

        {/* Stats Skeleton */}
        <div className="card p-3 sm:p-4">
          <div className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>

        {/* Tenders Grid Skeleton */}
        <div className="grid-responsive">
          {Array.from({ length: 6 }, (_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 sm:py-16 px-4">
        <div className="card p-6 sm:p-8 max-w-md mx-auto">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to load tenders</h3>
          <p className="text-red-600 text-sm mb-6">{error}</p>
          <button
            onClick={() => fetchTendersFromDatabase(currentPage, debouncedSearchQuery)}
            className="btn btn-primary w-full"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Search and Filters */}
      <div className="card p-3 sm:p-4">
        <div className="space-y-3">
          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              placeholder="Search tenders by title, buyer, or category..."
              className="form-input pl-9 sm:pl-10 pr-20 w-full"
            />
            
            {/* Search Actions */}
            <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3">
              {searchLoading && (
                <div className="w-4 h-4 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
              )}
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="p-1 hover:text-gray-600 transition-colors touch-target tap-highlight-none"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-1 transition-colors touch-target tap-highlight-none ${
                  showFilters ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
                aria-label="Toggle filters"
              >
                <Filter className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* Search Status */}
          {searchQuery && (
            <div className="text-xs sm:text-sm text-gray-600">
              {searchLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                  <span>Searching...</span>
                </div>
              ) : debouncedSearchQuery ? (
                <span>
                  Results for: <span className="font-medium text-gray-900">"{debouncedSearchQuery}"</span>
                </span>
              ) : (
                <span className="text-gray-500">Type to search...</span>
              )}
            </div>
          )}
          
          {/* Filters Panel */}
          {showFilters && (
            <div className="pt-3 border-t border-gray-200 animate-slide-down">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <select className="form-input text-sm">
                  <option value="">All Categories</option>
                  <option value="goods">Goods</option>
                  <option value="services">Services</option>
                  <option value="works">Works</option>
                </select>
                <select className="form-input text-sm">
                  <option value="">All Departments</option>
                  <option value="health">Health</option>
                  <option value="education">Education</option>
                  <option value="transport">Transport</option>
                </select>
                <select className="form-input text-sm">
                  <option value="">Closing Date</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Summary */}
      {data && data.tenders.length > 0 && (
        <div className="card p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 gap-4">
            <div className="text-xs sm:text-sm text-gray-600">
              Showing <span className="text-gray-900 font-medium">{((currentPage - 1) * tendersPerPage) + 1}</span> to{' '}
              <span className="text-gray-900 font-medium">{Math.min(currentPage * tendersPerPage, data.pagination.total)}</span> of{' '}
              <span className="text-gray-900 font-medium">{data.pagination.total.toLocaleString()}</span> {debouncedSearchQuery ? 'matching' : 'open'} tenders
            </div>
            <div className="text-xs sm:text-sm text-gray-500">
              Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{data.pagination.totalPages}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tenders Grid */}
      {!data?.tenders || data.tenders.length === 0 ? (
        <div className="text-center py-12 sm:py-16 px-4">
          <div className="card p-8 sm:p-12 max-w-md mx-auto">
            <div className="text-6xl mb-4">
              {debouncedSearchQuery ? '🔍' : '📋'}
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              {debouncedSearchQuery ? <Search className="w-6 h-6 text-gray-400" /> : <Clock className="w-6 h-6 text-gray-400" />}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {debouncedSearchQuery ? 'No matching tenders found' : 'No open tenders found'}
            </h3>
            <p className="text-gray-600 mb-4 text-sm leading-relaxed">
              {debouncedSearchQuery 
                ? `No tenders match your search for "${debouncedSearchQuery}". Try different keywords or clear the search.`
                : 'No open tenders are currently available. Please check back later for new opportunities.'
              }
            </p>
            {debouncedSearchQuery && (
              <button
                onClick={clearSearch}
                className="btn btn-primary"
              >
                Clear Search
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {pageLoading ? (
            <div className="grid-responsive">
              {Array.from({ length: tendersPerPage }, (_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : (
            <div className="grid-responsive">
              {data.tenders.map((tender, index) => (
                <div key={tender.ocid} className="animate-slide-up" style={{ animationDelay: `${index * 25}ms` }}>
                  <TenderCard tender={tender} />
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {data.pagination.totalPages > 1 && (
            <div className="card p-3 sm:p-4">
              <div className="flex items-center justify-between gap-4">
                {/* Previous Button */}
                <button
                  onClick={goToPrevious}
                  disabled={currentPage === 1 || pageLoading}
                  className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm touch-target tap-highlight-none"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden xs:inline">Previous</span>
                  <span className="xs:hidden">Prev</span>
                </button>

                {/* Page Numbers */}
                <div className="flex items-center space-x-1 overflow-x-auto scrollbar-thin">
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
                        disabled={pageLoading}
                        className={`px-2 sm:px-3 py-2 rounded-lg transition-all duration-200 font-medium text-sm disabled:opacity-50 touch-target tap-highlight-none ${
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
                      <span className="px-1 sm:px-2 text-gray-400 text-sm">...</span>
                      <button
                        onClick={() => goToPage(data.pagination.totalPages)}
                        disabled={pageLoading}
                        className="px-2 sm:px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium text-gray-700 text-sm disabled:opacity-50 touch-target tap-highlight-none"
                      >
                        {data.pagination.totalPages}
                      </button>
                    </>
                  )}
                </div>

                {/* Next Button */}
                <button
                  onClick={goToNext}
                  disabled={currentPage === data.pagination.totalPages || pageLoading}
                  className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm touch-target tap-highlight-none"
                >
                  <span className="hidden xs:inline">Next</span>
                  <span className="xs:hidden">Next</span>
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