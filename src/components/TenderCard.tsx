import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Building, ExternalLink, Clock, AlertTriangle } from 'lucide-react';
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

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition-all duration-200 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <Link to={`/tender/${encodeURIComponent(tender.ocid)}`} className="group">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 text-base leading-snug mb-2">
                {tender.title || 'Untitled Tender'}
              </h3>
            </Link>
            {tender.category && (
              <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-200">
                {tender.category}
              </span>
            )}
          </div>
          <div className="ml-3 flex-shrink-0">
            <Link to={`/tender/${encodeURIComponent(tender.ocid)}`}>
              <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-blue-500 transition-colors" />
              </div>
            </Link>
          </div>
        </div>

        {/* Description */}
        {tender.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed flex-1">
            {tender.description}
          </p>
        )}

        {/* Details */}
        <div className="space-y-3 mt-auto">
          {/* Buyer */}
          {tender.buyer && (
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center mr-2 flex-shrink-0">
                <Building className="w-3 h-3 text-gray-500" />
              </div>
              <span className="truncate font-medium">{tender.buyer}</span>
            </div>
          )}

          {/* Closing Date */}
          {(tender.closeDate || tender.close_date) && (
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center mr-2 flex-shrink-0">
                  <Calendar className="w-3 h-3 text-gray-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    Closes: {formatDate(tender.closeDate || tender.close_date)}
                  </p>
                </div>
              </div>
              {daysUntilClose !== null && (
                <div className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium border ${urgencyConfig.bg} ${urgencyConfig.color}`}>
                  <UrgencyIcon className="w-3 h-3" />
                  <span>
                    {daysUntilClose > 0 ? `${daysUntilClose}d left` : 'Expired'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                • Open
              </span>
              <span className="text-xs text-gray-400 font-mono">
                {tender.ocid?.split('-').pop()?.substring(0, 8)}...
              </span>
            </div>
            <BookmarkButton
              tenderOcid={tender.ocid}
              onAuthRequired={handleAuthRequired}
            />
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