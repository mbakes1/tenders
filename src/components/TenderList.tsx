import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Clock, AlertCircle, ChevronLeft, ChevronRight, Search, X, Zap, Filter, MapPin, Briefcase, ChevronUp, ChevronDown } from 'lucide-react';
import TenderCard from './TenderCard';
import SkeletonCard from './SkeletonCard';
import ErrorPage from './ErrorPage';
import { useTenders } from '../lib/queries';
import { PROVINCES, INDUSTRIES } from '../lib/constants';

const TenderList: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState(PROVINCES[0]);
  const [selectedIndustry, setSelectedIndustry] = useState(INDUSTRIES[0]);
  const [showFilters, setShowFilters] = useState(true); // Default to true for extended view
  const tendersPerPage = 24;

  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to page 1 when any filter changes
  useEffect(() => {
    if (debouncedSearchQuery !== searchQuery) {
      return; // Still typing, don't reset page yet
    }
    
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearchQuery, selectedProvince, selectedIndustry]);

  // Use TanStack Query for data fetching with enhanced filtering
  const {
    data,
    isLoading,
    isError,
    error,
    isFetching,
    refetch
  } = useTenders(currentPage, debouncedSearchQuery, selectedProvince, selectedIndustry, tendersPerPage);

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

  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setSelectedProvince(PROVINCES[0]);
    setSelectedIndustry(INDUSTRIES[0]);
    setCurrentPage(1);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setCurrentPage(1);
  }, []);

  // Individual filter clear functions
  const clearProvinceFilter = useCallback(() => {
    setSelectedProvince(PROVINCES[0]);
    setCurrentPage(1);
  }, []);

  const clearIndustryFilter = useCallback(() => {
    setSelectedIndustry(INDUSTRIES[0]);
    setCurrentPage(1);
  }, []);

  const isSearching = searchQuery !== debouncedSearchQuery;
  const hasActiveFilters = selectedProvince !== PROVINCES[0] || selectedIndustry !== INDUSTRIES[0] || debouncedSearchQuery;

  // Generate dynamic meta data for SEO
  const generateMetaData = () => {
    const totalTenders = data?.pagination.total || 0;
    const openTenders = data?.stats?.open_tenders || 0;
    
    let title = `Government Opportunities - ${openTenders.toLocaleString()} Open Tenders | BidBase`;
    let description = `Discover ${openTenders.toLocaleString()} open government procurement opportunities. Find tenders perfect for emerging businesses and entrepreneurs in South Africa.`;
    let keywords = 'government tenders, public procurement, business opportunities, entrepreneurs, consultants, south africa, bidbase';
    
    if (debouncedSearchQuery) {
      title = `${debouncedSearchQuery} - Government Opportunities | BidBase`;
      description = `Find ${totalTenders.toLocaleString()} government opportunities matching "${debouncedSearchQuery}". Discover procurement tenders for emerging businesses on BidBase.`;
      keywords = `${debouncedSearchQuery}, government tender, public procurement, business opportunity, south africa, bidbase`;
    }
    
    if (selectedProvince !== PROVINCES[0]) {
      title = `${selectedProvince} Government Opportunities | BidBase`;
      description = `Discover government procurement opportunities in ${selectedProvince}. Find ${totalTenders.toLocaleString()} tenders for emerging businesses.`;
      keywords = `${selectedProvince.toLowerCase()}, government tenders, public procurement, ${keywords}`;
    }
    
    if (selectedIndustry !== INDUSTRIES[0]) {
      title = `${selectedIndustry} Government Opportunities | BidBase`;
      description = `Find ${selectedIndustry.toLowerCase()} government tenders and procurement opportunities. ${totalTenders.toLocaleString()} opportunities available.`;
      keywords = `${selectedIndustry.toLowerCase()}, ${keywords}`;
    }
    
    return { title, description, keywords };
  };

  const metaData = generateMetaData();

  if (isLoading) {
    return (
      <>
        <Helmet>
          <title>Loading Opportunities | BidBase</title>
          <meta name="description" content="Loading government procurement opportunities..." />
        </Helmet>
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
      </>
    );
  }

  if (isError) {
    return (
      <>
        <Helmet>
          <title>Error Loading Opportunities | BidBase</title>
          <meta name="description" content="Unable to load government opportunities. Please try again." />
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
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
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{metaData.title}</title>
        <meta name="description" content={metaData.description} />
        <meta name="keywords" content={metaData.keywords} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:title" content={metaData.title} />
        <meta property="og:description" content={metaData.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://bidbase.co.za/" />
        
        {/* Twitter */}
        <meta name="twitter:title" content={metaData.title} />
        <meta name="twitter:description" content={metaData.description} />
        
        {/* Additional SEO */}
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={hasActiveFilters ? `https://bidbase.co.za/?filters=active` : "https://bidbase.co.za/"} />
        
        {/* Structured Data for Website */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "BidBase",
            "description": "Government procurement made simple for emerging businesses",
            "url": "https://bidbase.co.za",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://bidbase.co.za/?search={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          })}
        </script>
      </Helmet>

      <div className="space-y-4 sm:space-y-6">
        {/* Enhanced Search and Filter Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Main Search Bar */}
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                placeholder="Search government opportunities by title, department, or category..."
                className="block w-full pl-12 pr-12 py-4 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all duration-200"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-gray-600 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              )}
              {(isSearching || isFetching) && (
                <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {/* Filter Toggle and Status */}
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                <Filter className="w-4 h-4" />
                <span>Advanced Filters</span>
                {showFilters ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                {hasActiveFilters && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                    Active
                  </span>
                )}
              </button>

              {/* Search Status */}
              <div className="text-sm text-gray-600">
                {searchQuery && (
                  <>
                    {isSearching ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                        <span>Searching...</span>
                      </div>
                    ) : debouncedSearchQuery ? (
                      <span>
                        Results for: <span className="font-medium text-gray-900">"{debouncedSearchQuery}"</span>
                      </span>
                    ) : (
                      <span className="text-gray-500">Type to search...</span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Active Filter Tags */}
          {hasActiveFilters && (
            <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100">
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-sm font-medium text-gray-700">Active filters:</span>
                <span className="text-xs text-gray-500">Click any tag to remove</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {debouncedSearchQuery && (
                  <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200 transition-colors cursor-pointer group">
                    <Search className="w-3 h-3 mr-1.5" />
                    <span className="font-medium">Search:</span>
                    <span className="ml-1 max-w-32 truncate">"{debouncedSearchQuery}"</span>
                    <button
                      onClick={clearSearch}
                      className="ml-2 hover:text-blue-600 transition-colors group-hover:bg-blue-300 rounded-full p-0.5"
                      aria-label="Clear search filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                
                {selectedProvince !== PROVINCES[0] && (
                  <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-green-100 text-green-800 border border-green-200 hover:bg-green-200 transition-colors cursor-pointer group">
                    <MapPin className="w-3 h-3 mr-1.5" />
                    <span className="font-medium">Province:</span>
                    <span className="ml-1">{selectedProvince}</span>
                    <button
                      onClick={clearProvinceFilter}
                      className="ml-2 hover:text-green-600 transition-colors group-hover:bg-green-300 rounded-full p-0.5"
                      aria-label="Clear province filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                
                {selectedIndustry !== INDUSTRIES[0] && (
                  <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-purple-100 text-purple-800 border border-purple-200 hover:bg-purple-200 transition-colors cursor-pointer group">
                    <Briefcase className="w-3 h-3 mr-1.5" />
                    <span className="font-medium">Industry:</span>
                    <span className="ml-1">{selectedIndustry}</span>
                    <button
                      onClick={clearIndustryFilter}
                      className="ml-2 hover:text-purple-600 transition-colors group-hover:bg-purple-300 rounded-full p-0.5"
                      aria-label="Clear industry filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Filter Dropdowns */}
          {showFilters && (
            <div className="p-4 sm:p-6 bg-gray-50">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <label htmlFor="province-filter" className="block text-sm font-medium text-gray-700">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Province
                  </label>
                  <select
                    id="province-filter"
                    value={selectedProvince}
                    onChange={(e) => setSelectedProvince(e.target.value)}
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm py-2.5 transition-colors bg-white"
                  >
                    {PROVINCES.map(province => (
                      <option key={province} value={province}>{province}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="industry-filter" className="block text-sm font-medium text-gray-700">
                    <Briefcase className="w-4 h-4 inline mr-1" />
                    Industry
                  </label>
                  <select
                    id="industry-filter"
                    value={selectedIndustry}
                    onChange={(e) => setSelectedIndustry(e.target.value)}
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm py-2.5 transition-colors bg-white"
                  >
                    {INDUSTRIES.map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                </div>

                {/* Clear All Filters Button - Only visible when filters are active */}
                {hasActiveFilters && (
                  <div className="flex items-end">
                    <button
                      onClick={clearAllFilters}
                      className="flex items-center justify-center space-x-2 w-full px-4 py-2.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-lg transition-colors font-medium"
                    >
                      <X className="w-4 h-4" />
                      <span>Clear all filters</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Filter Tips */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-start space-x-2 text-xs text-gray-500">
                  <Zap className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Pro Tips:</p>
                    <ul className="space-y-1">
                      <li>• Use specific keywords like "IT services" or "construction" for better results</li>
                      <li>• Combine province and industry filters to find local opportunities</li>
                      <li>• Check back regularly - new opportunities are added daily</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        {data && data.tenders.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <p className="text-sm text-gray-600">
                  Showing <span className="text-gray-900 font-medium">{((currentPage - 1) * tendersPerPage) + 1}</span> to{' '}
                  <span className="text-gray-900 font-medium">{Math.min(currentPage * tendersPerPage, data.pagination.total)}</span> of{' '}
                  <span className="text-gray-900 font-medium">{data.pagination.total.toLocaleString()}</span> opportunities
                  {hasActiveFilters && <span className="text-blue-600 font-medium"> (filtered)</span>}
                </p>
                {hasActiveFilters && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                    <Filter className="w-3 h-3 mr-1" />
                    Filtered
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{data.pagination.totalPages}</span>
              </p>
            </div>
          </div>
        )}

        {/* Tenders Grid */}
        {!data?.tenders || data.tenders.length === 0 ? (
          <div className="text-center py-12 sm:py-16 px-4">
            <div className="bg-white rounded-xl border border-gray-200 p-8 sm:p-12 max-w-lg mx-auto shadow-sm">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                {hasActiveFilters ? <Search className="w-8 h-8 text-blue-600" /> : <Zap className="w-8 h-8 text-blue-600" />}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {hasActiveFilters ? 'No matching opportunities found' : 'No open opportunities found'}
              </h3>
              <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                {hasActiveFilters 
                  ? `No government opportunities match your current search criteria. Try adjusting your filters or exploring all available opportunities.`
                  : 'No open government opportunities are currently available. Check back soon for new procurement opportunities!'
                }
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium text-sm shadow-sm"
                >
                  Clear Filters & Explore All
                </button>
              )}
              
              {/* Encouragement */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">BidBase Tip</span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                  New opportunities are added regularly. Use our advanced filters to find opportunities that match your business expertise and location preferences!
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
              <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <button
                    onClick={goToPrevious}
                    disabled={currentPage === 1 || isFetching}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Previous</span>
                    <span className="sm:hidden">Prev</span>
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
                          disabled={isFetching}
                          className={`px-3 py-2 rounded-lg transition-colors font-medium text-sm disabled:opacity-50 ${
                            currentPage === pageNum
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm'
                              : 'border border-gray-300 hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    {data.pagination.totalPages > 5 && currentPage < data.pagination.totalPages - 2 && (
                      <>
                        <span className="px-2 text-gray-400 text-sm">...</span>
                        <button
                          onClick={() => goToPage(data.pagination.totalPages)}
                          disabled={isFetching}
                          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700 text-sm disabled:opacity-50"
                        >
                          {data.pagination.totalPages}
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    onClick={goToNext}
                    disabled={currentPage === data.pagination.totalPages || isFetching}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
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
    </>
  );
};

export default TenderList;