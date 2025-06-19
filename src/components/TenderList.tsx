import React, { useState, useEffect } from 'react';
import { RefreshCw, Clock, AlertCircle, ChevronLeft, ChevronRight, Database, TrendingUp, Search } from 'lucide-react';
import { InstantSearch, Configure } from 'react-instantsearch';
import algoliasearch from 'algoliasearch/lite';
import LoadingSpinner from './LoadingSpinner';
import TenderCard from './TenderCard';
import SkeletonCard from './SkeletonCard';
import SearchBox from './SearchBox';
import SearchFilters from './SearchFilters';
import SearchResults from './SearchResults';

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
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLoading, setPageLoading] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [algoliaConfigured, setAlgoliaConfigured] = useState(false);
  const tendersPerPage = 24;

  // Initialize Algolia client
  const algoliaClient = React.useMemo(() => {
    const appId = import.meta.env.VITE_ALGOLIA_APP_ID;
    const searchKey = import.meta.env.VITE_ALGOLIA_SEARCH_KEY;
    
    if (appId && searchKey) {
      setAlgoliaConfigured(true);
      return algoliasearch(appId, searchKey);
    }
    
    setAlgoliaConfigured(false);
    return null;
  }, []);

  const indexName = import.meta.env.VITE_ALGOLIA_INDEX_NAME || 'tenders';

  const fetchTendersFromDatabase = async (page = 1) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration missing. Please check your environment variables.');
      }

      console.log(`Fetching tenders from database (page ${page})...`);

      const response = await fetch(`${supabaseUrl}/functions/v1/get-tenders?page=${page}&limit=${tendersPerPage}&openOnly=true`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
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

  const refreshTenders = async () => {
    setRefreshing(true);
    try {
      await fetchTendersFromDatabase(currentPage);
    } finally {
      setRefreshing(false);
    }
  };

  const goToPage = async (page: number) => {
    setCurrentPage(page);
    setPageLoading(true);
    try {
      await fetchTendersFromDatabase(page);
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
            
            <div className="h-10 bg-gray-200 rounded w-32"></div>
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
            onClick={refreshTenders}
            disabled={refreshing}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
          >
            {refreshing ? 'Retrying...' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  // Render search interface if Algolia is configured
  if (algoliaConfigured && algoliaClient && searchMode) {
    return (
      <InstantSearch searchClient={algoliaClient} indexName={indexName}>
        <Configure hitsPerPage={24} filters="is_open:true" />
        
        <div className="space-y-6">
          {/* Stats Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Search className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Search Tenders</h2>
                    <p className="text-gray-600 font-medium">Powered by Algolia</p>
                  </div>
                </div>
                
                {data?.stats.last_updated && (
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>Database updated: {new Date(data.stats.last_updated).toLocaleString()}</span>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setSearchMode(false)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors font-medium"
                >
                  <span>Browse All</span>
                </button>
                
                <button
                  onClick={refreshTenders}
                  disabled={refreshing}
                  className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  <RefreshCw className={`w-4 h-4 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
                  <span className="text-gray-700">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Search Box */}
          <SearchBox />

          {/* Search Content */}
          <div className="grid gap-6 lg:grid-cols-4">
            <div className="lg:col-span-1">
              <SearchFilters 
                isOpen={filtersOpen} 
                onToggle={() => setFiltersOpen(!filtersOpen)} 
              />
            </div>
            <div className="lg:col-span-3">
              <SearchResults />
            </div>
          </div>
        </div>
      </InstantSearch>
    );
  }

  // Regular database browsing interface
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
          
          <div className="flex space-x-3">
            {algoliaConfigured && (
              <button
                onClick={() => setSearchMode(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            )}
            
            <button
              onClick={refreshTenders}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              <RefreshCw className={`w-4 h-4 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-gray-700">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Algolia Status */}
        {!algoliaConfigured && (
          <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Search className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-900">Search Feature Available</p>
                <p className="text-sm text-amber-700">
                  Configure Algolia API keys to enable advanced search functionality.
                </p>
              </div>
            </div>
          </div>
        )}

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

      {/* Pagination Info */}
      {data && data.tenders.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing <span className="text-gray-900 font-medium">{((currentPage - 1) * tendersPerPage) + 1}</span> to{' '}
              <span className="text-gray-900 font-medium">{Math.min(currentPage * tendersPerPage, data.pagination.total)}</span> of{' '}
              <span className="text-gray-900 font-medium">{data.pagination.total.toLocaleString()}</span> open tenders
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
              <Database className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No open tenders found</h3>
            <p className="text-gray-600 mb-4">
              No open tenders are currently available in the database. Our system automatically updates every 6 hours.
            </p>
          </div>
        </div>
      ) : (
        <>
          {pageLoading ? (
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
                  disabled={currentPage === 1 || pageLoading}
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
                        disabled={pageLoading}
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
                        disabled={pageLoading}
                        className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium text-gray-700 text-sm disabled:opacity-50"
                      >
                        {data.pagination.totalPages}
                      </button>
                    </>
                  )}
                </div>

                <button
                  onClick={goToNext}
                  disabled={currentPage === data.pagination.totalPages || pageLoading}
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