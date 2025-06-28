import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Building, 
  FileText, 
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Clock,
  Tag,
  AlertCircle,
  Download,
  Eye,
  TrendingUp,
  Share2
} from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import SkeletonDetail from './SkeletonDetail';
import BookmarkButton from './BookmarkButton';
import AuthModal from './AuthModal';
import { getTenderByOcid, trackTenderView, getTenderViewStats, downloadDocumentProxy } from '../lib/supabase';

const TenderDetail: React.FC = () => {
  const { ocid } = useParams<{ ocid: string }>();
  const [tender, setTender] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [viewStats, setViewStats] = useState<any>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);

  useEffect(() => {
    const fetchTenderDetail = async () => {
      if (!ocid) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const decodedOcid = decodeURIComponent(ocid);
        
        // Run all independent requests concurrently using Promise.allSettled
        // This allows us to handle partial failures gracefully
        const [tenderResult, viewResult, statsResult] = await Promise.allSettled([
          getTenderByOcid(decodedOcid),
          trackTenderView(decodedOcid),
          getTenderViewStats(decodedOcid)
        ]);
        
        // Handle tender data (critical - must succeed)
        if (tenderResult.status === 'fulfilled') {
          setTender(tenderResult.value);
        } else {
          throw new Error(tenderResult.reason?.message || 'Failed to fetch tender data');
        }
        
        // Handle view tracking (non-critical - can fail silently)
        if (viewResult.status === 'fulfilled' && viewResult.value.success) {
          // Update the tender's view count in state
          setTender((prev: any) => ({
            ...prev,
            view_count: viewResult.value.viewCount
          }));
        } else {
          console.warn('View tracking failed:', viewResult.status === 'rejected' ? viewResult.reason : 'Unknown error');
        }
        
        // Handle view stats (non-critical - can fail silently)
        if (statsResult.status === 'fulfilled') {
          setViewStats(statsResult.value.data);
        } else {
          console.warn('View stats failed:', statsResult.status === 'rejected' ? statsResult.reason : 'Unknown error');
        }
        
      } catch (err) {
        console.error('Error fetching tender detail:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTenderDetail();
  }, [ocid]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  const downloadDocument = async (doc: any) => {
    try {
      // Use the centralized download proxy function
      const blob = await downloadDocumentProxy(doc);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${doc.title || 'document'}.${doc.format || 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      // Fallback to original URL if our proxy fails
      window.open(doc.url, '_blank');
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: tender.title || 'SA Tender',
      text: `Check out this tender: ${tender.title}`,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      } catch (error) {
        setShowShareMenu(true);
      }
    }
  };

  const handleAuthRequired = () => {
    setShowAuthModal(true);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
  };

  if (loading) {
    return <SkeletonDetail />;
  }

  if (error || !tender) {
    return (
      <div className="text-center py-12 px-4">
        <div className="card p-6 max-w-md mx-auto">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Tender not found</h3>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <Link
            to="/"
            className="btn btn-primary"
          >
            Back to Tenders
          </Link>
        </div>
      </div>
    );
  }

  const tenderData = tender.full_data?.tender || tender.full_data || tender;
  const closeDate = tender.close_date;
  const daysUntilClose = closeDate ? getDaysUntilClose(closeDate) : null;
  const viewCount = tender.view_count || 0;

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        {/* Back Navigation */}
        <Link
          to="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors font-medium text-sm sm:text-base touch-target tap-highlight-none"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tenders
        </Link>

        {/* Header Section */}
        <div className="card p-4 sm:p-6">
          <div className="space-y-4">
            {/* Title and Meta */}
            <div>
              <h1 className="text-responsive-2xl font-bold text-gray-900 mb-3 leading-tight">
                {tender.title || 'Untitled Tender'}
              </h1>
              
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-600 mb-4">
                <span className="font-mono text-xs sm:text-sm break-all">OCID: {tender.ocid}</span>
                {tender.bid_number && (
                  <span className="flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    <span className="text-xs sm:text-sm">{tender.bid_number}</span>
                  </span>
                )}
                {viewCount > 0 && (
                  <div className="flex items-center space-x-1 px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-200">
                    <Eye className="w-4 h-4" />
                    <span className="font-medium text-xs sm:text-sm">{formatViewCount(viewCount)} views</span>
                  </div>
                )}
              </div>

              {/* Tags Row */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {tender.category && (
                  <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded border border-blue-200 text-sm font-medium">
                    {tender.category}
                  </span>
                )}
                {viewStats && (
                  <div className="flex items-center space-x-1 px-2 py-1 bg-gray-50 text-gray-600 rounded text-xs">
                    <TrendingUp className="w-3 h-3" />
                    <span>{viewStats.views_today} today</span>
                  </div>
                )}
              </div>
            </div>

            {/* Status and Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center px-3 py-1 rounded text-sm font-medium bg-green-50 text-green-700 border border-green-200">
                  Open
                </span>
                
                {daysUntilClose !== null && (
                  <div className={`flex items-center text-sm font-medium ${
                    daysUntilClose <= 3 ? 'text-red-600' : 
                    daysUntilClose <= 7 ? 'text-amber-600' : 'text-green-600'
                  }`}>
                    <Clock className="w-4 h-4 mr-1" />
                    <span>
                      {daysUntilClose > 0 ? `${daysUntilClose} days left` : 'Expired'}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Share</span>
                </button>
                
                <BookmarkButton
                  tenderOcid={tender.ocid}
                  onAuthRequired={handleAuthRequired}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Description */}
            {(tender.description || tender.bid_description) && (
              <div className="card p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
                <div className="space-y-4">
                  {tender.description && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">General Description</h3>
                      <p className="text-gray-700 whitespace-pre-wrap text-sm sm:text-base leading-relaxed">{tender.description}</p>
                    </div>
                  )}
                  {tender.bid_description && tender.bid_description !== tender.description && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Bid Description</h3>
                      <p className="text-gray-700 whitespace-pre-wrap text-sm sm:text-base leading-relaxed">{tender.bid_description}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Items */}
            {tenderData?.items && tenderData.items.length > 0 && (
              <div className="card p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Items</h2>
                <div className="space-y-4">
                  {tenderData.items.map((item: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 text-sm sm:text-base">{item.description}</h3>
                      {item.classification?.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          Classification: {item.classification.description}
                        </p>
                      )}
                      {item.quantity && (
                        <p className="text-sm text-gray-600 mt-1">
                          Quantity: {item.quantity} {item.unit?.name || ''}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documents */}
            {(tender.documents || tenderData?.documents) && (
              <div className="card p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Documents</h2>
                <div className="space-y-3">
                  {(tender.documents || tenderData.documents).map((doc: any, index: number) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 gap-3">
                      <div className="flex items-start space-x-3 min-w-0 flex-1">
                        <FileText className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 text-sm sm:text-base line-clamp-2">{doc.title}</p>
                          {doc.description && (
                            <p className="text-sm text-gray-600 line-clamp-2 mt-1">{doc.description}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {doc.documentType} • {doc.format}
                          </p>
                        </div>
                      </div>
                      {doc.url && (
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <button
                            onClick={() => downloadDocument(doc)}
                            className="btn btn-primary flex items-center gap-1 text-sm"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download</span>
                          </button>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1 text-gray-600 hover:text-gray-700 transition-colors text-sm touch-target tap-highlight-none"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span className="hidden sm:inline">Original</span>
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Special Conditions */}
            {tender.special_conditions && (
              <div className="card p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Special Conditions</h2>
                <p className="text-gray-700 whitespace-pre-wrap text-sm sm:text-base leading-relaxed">{tender.special_conditions}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* View Statistics */}
            {viewStats && (
              <div className="card p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">View Statistics</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Views</span>
                    <span className="font-semibold text-gray-900">{formatViewCount(viewStats.total_views)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Unique Viewers</span>
                    <span className="font-semibold text-gray-900">{formatViewCount(viewStats.unique_viewers)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Views Today</span>
                    <span className="font-semibold text-gray-900">{viewStats.views_today}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">This Week</span>
                    <span className="font-semibold text-gray-900">{viewStats.views_this_week}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Key Information */}
            <div className="card p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Information</h2>
              <div className="space-y-4">
                {/* Tender Period */}
                <div className="flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-600">Tender Period</p>
                    {tender.opening_date && (
                      <p className="text-sm text-gray-900">
                        From: {formatDate(tender.opening_date)}
                      </p>
                    )}
                    {tender.close_date && (
                      <p className="text-sm text-gray-900">
                        Until: {formatDate(tender.close_date)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Submission Method */}
                {tender.submission_method && (
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-600">Submission Method</p>
                      <p className="font-medium text-gray-900 text-sm">{tender.submission_method}</p>
                    </div>
                  </div>
                )}

                {/* Service Location */}
                {tender.service_location && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-600">Service Location</p>
                      <p className="font-medium text-gray-900 text-sm">{tender.service_location}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Buyer Information */}
            <div className="card p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Buyer Information</h2>
              <div className="space-y-3">
                {tender.buyer && (
                  <div className="flex items-start space-x-3">
                    <Building className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-sm">{tender.buyer}</p>
                      {tender.department && tender.department !== tender.buyer && (
                        <p className="text-sm text-gray-600">{tender.department}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Contact Information */}
                <div className="space-y-2">
                  {tender.contact_person && (
                    <div className="flex items-center space-x-3">
                      <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      </div>
                      <span className="text-sm text-gray-900 font-medium">{tender.contact_person}</span>
                    </div>
                  )}
                  
                  {tender.contact_tel && (
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <a 
                        href={`tel:${tender.contact_tel}`}
                        className="text-sm text-blue-600 hover:text-blue-700 touch-target tap-highlight-none"
                      >
                        {tender.contact_tel}
                      </a>
                    </div>
                  )}
                  
                  {tender.contact_email && (
                    <div className="flex items-center space-x-3">
                      <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <a
                        href={`mailto:${tender.contact_email}`}
                        className="text-sm text-blue-600 hover:text-blue-700 truncate touch-target tap-highlight-none"
                      >
                        {tender.contact_email}
                      </a>
                    </div>
                  )}
                  
                  {tender.contact_fax && (
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      </div>
                      <span className="text-sm text-gray-600">Fax: {tender.contact_fax}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submission Details */}
            {(tender.submission_email || tender.file_size_limit || tender.required_format) && (
              <div className="card p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Submission Details</h2>
                <div className="space-y-3">
                  {tender.submission_email && (
                    <div>
                      <p className="text-sm text-gray-600">Submission Email</p>
                      <a
                        href={`mailto:${tender.submission_email}`}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium break-all touch-target tap-highlight-none"
                      >
                        {tender.submission_email}
                      </a>
                    </div>
                  )}
                  
                  {tender.file_size_limit && (
                    <div>
                      <p className="text-sm text-gray-600">File Size Limit</p>
                      <p className="text-sm text-gray-900 font-medium">{tender.file_size_limit}</p>
                    </div>
                  )}
                  
                  {tender.required_format && (
                    <div>
                      <p className="text-sm text-gray-600">Required Format</p>
                      <p className="text-sm text-gray-900 font-medium">{tender.required_format}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
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

export default TenderDetail;