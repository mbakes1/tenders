import React, { useState, useEffect, useCallback } from 'react';
import { Clock, AlertCircle, ChevronLeft, ChevronRight, Search, X, Zap } from 'lucide-react';
import TenderCard from './TenderCard';
import SkeletonCard from './SkeletonCard';
import ErrorPage from './ErrorPage';
import { useTenders } from '../lib/queries';

const TenderList: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const tendersPerPage = 24;

  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to page 1 when search query changes
  useEffect(() => {
    if (debouncedSearchQuery !== searchQuery) {
      return; // Still typing, don't reset page yet
    }
    
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearchQuery]);

  // Use TanStack Query for data fetching
  const {
    data,
    isLoading,
    isError,
    error,
    isFetching,
    refetch
  } = useTenders(currentPage, debouncedSearchQuery, tendersPerPage);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const goToPrevious = useCallback(() => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage]);

  const goToNext = useCallback(() => {
    if (data && currentPage < data.pagination.totalPages) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, data, goToPage]);

  const handleSearchInputChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setCurrentPage(1);
  }, []);

  const isSearching = searchQuery !== debouncedSearchQuery;

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Search Box Skeleton */}
        <div className="h-12 sm:h-14 bg-gray-200 rounded-lg animate-pulse"></div>

        {/* Tenders Grid Skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12 sm:py-16 px-4">
        <div className="bg-white rounded-lg border border-red-200 p-6 sm:p-8 max-w-md mx-auto">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to load opportunities</h3>
          <p className="text-red-600 text-sm mb-6">
            {error instanceof Error ? error.message : 'An error occurred while loading government opportunities'}
          </p>
          <button
            onClick={() => refetch()}
            className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Search Box */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchInputChange(e.target.value)}
            placeholder="Search government opportunities by title, department, or category..."
            className="block w-full pl-9 sm:pl-10 pr-10 py-2.5 sm:py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            </button>
          )}
          {(isSearching || isFetching) && (
            <div className="absolute right-10 sm:right-12 top-1/2 transform -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        {searchQuery && (
          <div className="mt-2 text-xs sm:text-sm text-gray-600">
            {isSearching ? (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                <span>Searching opportunities...</span>
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
      </div>

      {/* Pagination Info */}
      {data && data.tenders.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <p className="text-xs sm:text-sm text-gray-600">
              Showing <span className="text-gray-900 font-medium">{((currentPage - 1) * tendersPerPage) + 1}</span> to{' '}
              <span className="text-gray-900 font-medium">{Math.min(currentPage * tendersPerPage, data.pagination.total)}</span> of{' '}
              <span className="text-gray-900 font-medium">{data.pagination.total.toLocaleString()}</span> {debouncedSearchQuery ? 'matching' : 'open'} opportunities
            </p>
            <p className="text-xs sm:text-sm text-gray-500">
              Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{data.pagination.totalPages}</span>
            </p>
          </div>
        </div>
      )}

      {/* Tenders Grid */}
      {!data?.tenders || data.tenders.length === 0 ? (
        <div className="text-center py-12 sm:py-16 px-4">
          <div className="bg-white rounded-lg border border-gray-200 p-8 sm:p-12 max-w-md mx-auto">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              {debouncedSearchQuery ? <Search className="w-8 h-8 text-blue-600" /> : <Zap className="w-8 h-8 text-blue-600" />}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {debouncedSearchQuery ? 'No matching opportunities found' : 'No open opportunities found'}
            </h3>
            <p className="text-gray-600 mb-4 text-sm">
              {debouncedSearchQuery 
                ? `No government opportunities match your search for "${debouncedSearchQuery}". Try different keywords or explore all opportunities.`
                : 'No open government opportunities are currently available. Check back soon for new procurement opportunities!'
              }
            </p>
            {debouncedSearchQuery && (
              <button
                onClick={clearSearch}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium text-sm"
              >
                Explore All Opportunities
              </button>
            )}
            
            {/* Encouragement */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Zap className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">BidBase Tip</span>
              </div>
              <p className="text-sm text-gray-500">
                New opportunities are added regularly. Bookmark interesting ones to track application deadlines!
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {isFetching && !isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: tendersPerPage }, (_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.tenders.map((tender, index) => (
                <div key={tender.ocid} className="animate-slide-up" style={{ animationDelay: `${index * 25}ms` }}>
                  <TenderCard tender={tender} />
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {data.pagination.totalPages > 1 && (
            <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={goToPrevious}
                  disabled={currentPage === 1 || isFetching}
                  className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">Prev</span>
                </button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(3, data.pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (data.pagination.totalPages <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage <= 2) {
                      pageNum = i + 1;
                    } else if (currentPage >= data.pagination.totalPages - 1) {
                      pageNum = data.pagination.totalPages - 2 + i;
                    } else {
                      pageNum = currentPage - 1 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        disabled={isFetching}
                        className={`px-2 sm:px-3 py-2 rounded-md transition-colors font-medium text-sm disabled:opacity-50 ${
                          currentPage === pageNum
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  {data.pagination.totalPages > 3 && currentPage < data.pagination.totalPages - 1 && (
                    <>
                      <span className="px-1 sm:px-2 text-gray-400 text-sm">...</span>
                      <button
                        onClick={() => goToPage(data.pagination.totalPages)}
                        disabled={isFetching}
                        className="px-2 sm:px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium text-gray-700 text-sm disabled:opacity-50"
                      >
                        {data.pagination.totalPages}
                      </button>
                    </>
                  )}
                </div>

                <button
                  onClick={goToNext}
                  disabled={currentPage === data.pagination.totalPages || isFetching}
                  className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                >
                  <span className="hidden sm:inline">Next</span>
                  <span className="sm:hidden">Next</span>
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