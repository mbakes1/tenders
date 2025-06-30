import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Building, ExternalLink, Clock, AlertTriangle } from 'lucide-react';
import BookmarkButton from './BookmarkButton';
import AuthModal from './AuthModal';
import { useCacheUtils } from '../lib/queries';
import { type Tender } from '../lib/supabase';

interface TenderCardProps {
  tender: Tender;
}

const TenderCard: React.FC<TenderCardProps> = ({ tender }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { prefetchTender } = useCacheUtils();

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

  const daysUntilClose = tender.close_date
    ? getDaysUntilClose(tender.close_date)
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

  const handleCardHover = () => {
    // Prefetch tender details when hovering over the card
    if (tender.ocid) {
      prefetchTender(tender.ocid);
    }
  };

  const handleCardClick = () => {
    // Track tender view when card is clicked with PostHog
    if (window.posthog) {
      const daysUntilClose = tender.close_date ? 
        Math.ceil((new Date(tender.close_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 
        undefined;

      window.posthog.capture('tender_viewed', {
        tender_ocid: tender.ocid,
        tender_title: tender.title || 'Untitled',
        tender_category: tender.category,
        tender_buyer: tender.buyer,
        days_until_close: daysUntilClose,
        source: 'browse',
      });
    }
  };

  return (
    <>
      <div 
        className="bg-white rounded-lg border border-gray-200 p-3 hover:border-gray-300 hover:shadow-sm transition-all duration-200 h-full flex flex-col" /* Reduced padding */
        onMouseEnter={handleCardHover}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-2"> {/* Reduced margin */}
          <div className="flex-1 min-w-0 pr-2"> {/* Reduced padding */}
            <Link 
              to={`/tender/${encodeURIComponent(tender.ocid)}`} 
              className="group"
              onClick={handleCardClick}
            >
              {/* Procuring Entity as main title */}
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 text-sm leading-snug mb-1.5"> {/* Smaller text and margin */}
                {tender.buyer || tender.department || 'Government Entity'}
              </h3>
              {/* Tender title as subtitle */}
              {tender.title && (
                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mb-1.5"> {/* Smaller text and margin */}
                  {tender.title}
                </p>
              )}
            </Link>
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5"> {/* Reduced gap and margin */}
              {tender.category && (
                <span className="inline-flex items-center px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-200"> {/* Smaller padding and text */}
                  {tender.category}
                </span>
              )}
            </div>
          </div>
          <div className="flex-shrink-0">
            <Link 
              to={`/tender/${encodeURIComponent(tender.ocid)}`}
              onClick={handleCardClick}
            >
              <div className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center group-hover:bg-blue-100 transition-colors"> {/* Smaller size */}
                <ExternalLink className="w-2.5 h-2.5 text-gray-400 group-hover:text-blue-500 transition-colors" /> {/* Smaller icon */}
              </div>
            </Link>
          </div>
        </div>

        {/* Description */}
        {(tender.description || tender.bid_description) && (
          <p className="text-gray-600 text-xs mb-3 line-clamp-3 leading-relaxed flex-1"> {/* Smaller text and margin */}
            {tender.description || tender.bid_description}
          </p>
        )}

        {/* Details */}
        <div className="space-y-2 mt-auto"> {/* Reduced spacing */}
          {/* Reference Number */}
          {(tender.bid_number || tender.reference_number) && (
            <div className="flex items-center text-xs text-gray-600"> {/* Smaller text */}
              <div className="w-4 h-4 bg-gray-100 rounded flex items-center justify-center mr-1.5 flex-shrink-0"> {/* Smaller size and margin */}
                <Building className="w-2.5 h-2.5 text-gray-500" /> {/* Smaller icon */}
              </div>
              <span className="truncate font-medium text-xs"> {/* Smaller text */}
                Ref: {tender.bid_number || tender.reference_number}
              </span>
            </div>
          )}

          {/* Closing Date */}
          {tender.close_date && (
            <div className="flex items-center justify-between">
              <div className="flex items-center text-xs text-gray-600 min-w-0 flex-1"> {/* Smaller text */}
                <div className="w-4 h-4 bg-gray-100 rounded flex items-center justify-center mr-1.5 flex-shrink-0"> {/* Smaller size and margin */}
                  <Calendar className="w-2.5 h-2.5 text-gray-500" /> {/* Smaller icon */}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-xs truncate"> {/* Smaller text */}
                    Closes: {formatDate(tender.close_date)}
                  </p>
                </div>
              </div>
              {daysUntilClose !== null && (
                <div className={`flex items-center space-x-1 px-1.5 py-0.5 rounded text-xs font-medium border ml-1.5 flex-shrink-0 ${urgencyConfig.bg} ${urgencyConfig.color}`}> {/* Smaller padding and margin */}
                  <UrgencyIcon className="w-2.5 h-2.5" /> {/* Smaller icon */}
                  <span className="whitespace-nowrap">
                    {daysUntilClose > 0 ? `${daysUntilClose}d left` : 'Expired'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-2 border-t border-gray-100"> {/* Reduced margin and padding */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 min-w-0 flex-1"> {/* Reduced spacing */}
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200"> {/* Smaller padding and text */}
                • Open
              </span>
              <span className="text-xs text-gray-400 font-mono truncate"> {/* Smaller text */}
                {tender.ocid?.split('-').pop()?.substring(0, 8)}...
              </span>
            </div>
            <div className="ml-1.5 flex-shrink-0"> {/* Reduced margin */}
              <BookmarkButton
                tenderOcid={tender.ocid}
                onAuthRequired={handleAuthRequired}
                className="text-xs px-1.5 py-0.5" /* Smaller padding and text */
              />
            </div>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
};

export default TenderCard;