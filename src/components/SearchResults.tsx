import React from 'react';
import { useHits, useStats } from 'react-instantsearch';
import { Clock, AlertCircle } from 'lucide-react';
import TenderCard from './TenderCard';
import SkeletonCard from './SkeletonCard';

interface SearchResultsProps {
  loading?: boolean;
}

const SearchResults: React.FC<SearchResultsProps> = ({ loading = false }) => {
  const { hits } = useHits();
  const { nbHits, processingTimeMS } = useStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Stats */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            <span className="text-gray-900 font-medium">{nbHits.toLocaleString()}</span> tenders found
          </p>
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{processingTimeMS}ms</span>
          </div>
        </div>
      </div>

      {/* Results */}
      {hits.length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-white rounded-lg border border-gray-200 p-12 max-w-md mx-auto">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No tenders found</h3>
            <p className="text-gray-600">
              Try adjusting your search terms or filters to find more results.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {hits.map((hit, index) => (
            <div key={hit.objectID} className="animate-slide-up" style={{ animationDelay: `${index * 25}ms` }}>
              <TenderCard tender={hit} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchResults;