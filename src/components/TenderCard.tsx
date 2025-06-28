import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Building, ExternalLink, Clock, AlertTriangle, Eye } from 'lucide-react';
import BookmarkButton from './BookmarkButton';
import AuthModal from './AuthModal';

interface TenderCardProps {
  tender: any;
}

const TenderCard: React.FC<TenderCardProps> = ({ tender }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysUntilClose = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatViewCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const daysUntilClose = tender.closeDate || tender.close_date
    ? getDaysUntilClose(tender.closeDate || tender.close_date)
    : null;

  const getUrgencyConfig = (days: number | null) => {
    if (days === null) return { color: 'text-gray-500', bg: 'bg-gray-100', icon: Clock };
    if (days <= 3) return { color: 'text-red-600', bg: 'bg-red-50 border-red-200', icon: AlertTriangle };
    if (days <= 7) return { color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', icon: Clock };
    return { color: 'text-green-600', bg: 'bg-green-50 border-green-200', icon: Clock };
  };

  const urgencyConfig = getUrgencyConfig(daysUntilClose);
  const UrgencyIcon = urgencyConfig.icon;

  const handleAuthRequired = () => {
    setShowAuthModal(true);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
  };

  const viewCount = tender.view_count || 0;

  return (
    <>
      <article className="card p-3 sm:p-4 lg:p-5 hover:border-gray-300 hover:shadow-mobile-md transition-all duration-200 h-full flex flex-col group gpu-accelerated">
        {/* Header */}
        <div className="flex items-start justify-between mb-3 gap-3">
          <div className="flex-1 min-w-0">
            <Link 
              to={`/tender/${encodeURIComponent(tender.ocid)}`} 
              className="block group/link touch-target tap-highlight-none"
            >
              <h3 className="font-semibold text-gray-900 group-hover/link:text-blue-600 transition-colors line-clamp-2 text-sm sm:text-base leading-snug mb-2">
                {tender.title || 'Untitled Tender'}
              </h3>
            </Link>
            
            {/* Tags Row */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
              {tender.category && (
                <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-200 truncate max-w-32 sm:max-w-none">
                  {tender.category}
                </span>
              )}
              {viewCount > 0 && (
                <div className="flex items-center space-x-1 px-2 py-1 bg-gray-50 text-gray-600 rounded text-xs font-medium border border-gray-200">
                  <Eye className="w-3 h-3 flex-shrink-0" />
                  <span className="whitespace-nowrap">{formatViewCount(viewCount)}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* External Link Icon */}
          <Link 
            to={`/tender/${encodeURIComponent(tender.ocid)}`}
            className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors touch-target tap-highlight-none"
            aria-label="View tender details"
          >
            <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
          </Link>
        </div>

        {/* Description */}
        {tender.description && (
          <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3 flex-1">
            {tender.description}
          </p>
        )}

        {/* Details Section */}
        <div className="space-y-3 mt-auto">
          {/* Buyer */}
          {tender.buyer && (
            <div className="flex items-center text-sm text-gray-600 gap-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                <Building className="w-3 h-3 text-gray-500" />
              </div>
              <span className="truncate font-medium text-xs sm:text-sm">{tender.buyer}</span>
            </div>
          )}

          {/* Closing Date */}
          {(tender.closeDate || tender.close_date) && (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center text-sm text-gray-600 min-w-0 flex-1 gap-2">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-3 h-3 text-gray-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 text-xs sm:text-sm truncate">
                    Closes: {formatDate(tender.closeDate || tender.close_date)}
                  </p>
                </div>
              </div>
              
              {/* Urgency Badge */}
              {daysUntilClose !== null && (
                <div className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium border flex-shrink-0 ${urgencyConfig.bg} ${urgencyConfig.color}`}>
                  <UrgencyIcon className="w-3 h-3" />
                  <span className="whitespace-nowrap">
                    {daysUntilClose > 0 ? `${daysUntilClose}d` : 'Expired'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                • Open
              </span>
              <span className="text-xs text-gray-400 font-mono truncate">
                {tender.ocid?.split('-').pop()?.substring(0, 8)}...
              </span>
            </div>
            
            {/* Bookmark Button */}
            <div className="flex-shrink-0">
              <BookmarkButton
                tenderOcid={tender.ocid}
                onAuthRequired={handleAuthRequired}
                className="text-xs px-2 py-1.5 min-w-0"
              />
            </div>
          </div>
        </div>
      </article>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
};

export default TenderCard;