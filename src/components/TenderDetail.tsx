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
  User,
  Globe,
  Briefcase,
  Send,
  FileCheck,
  Info
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
        <div className="bg-white border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Tender not found</h3>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <Link
            to="/"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Navigation */}
        <Link
          to="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors font-medium text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tenders
        </Link>

        {/* Main Content Container */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-6 sm:p-8">
            <div className="flex flex-col space-y-4">
              {/* Title and Meta */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 leading-tight">
                  {tender.title || 'Untitled Tender'}
                </h1>
                
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-4">
                  <div className="flex items-center space-x-1">
                    <Tag className="w-4 h-4" />
                    <span className="font-mono">{tender.ocid}</span>
                  </div>
                  {tender.bid_number && (
                    <div className="flex items-center space-x-1">
                      <FileCheck className="w-4 h-4" />
                      <span>{tender.bid_number}</span>
                    </div>
                  )}
                  {viewCount > 0 && (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md">
                      <Eye className="w-4 h-4" />
                      <span className="font-medium">{formatViewCount(viewCount)} views</span>
                    </div>
                  )}
                  {viewStats && (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-md">
                      <TrendingUp className="w-4 h-4" />
                      <span>{viewStats.views_today} today</span>
                    </div>
                  )}
                </div>

                {/* Status and Category */}
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Open
                  </span>
                  
                  {tender.category && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                      <Briefcase className="w-4 h-4 mr-1" />
                      {tender.category}
                    </span>
                  )}
                  
                  {daysUntilClose !== null && (
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                      daysUntilClose <= 3 ? 'bg-red-100 text-red-800 border-red-200' : 
                      daysUntilClose <= 7 ? 'bg-amber-100 text-amber-800 border-amber-200' : 
                      'bg-green-100 text-green-800 border-green-200'
                    }`}>
                      <Clock className="w-4 h-4 mr-1" />
                      {daysUntilClose > 0 ? `${daysUntilClose} days left` : 'Expired'}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Action Button */}
              <div className="flex justify-end">
                <BookmarkButton
                  tenderOcid={tender.ocid}
                  onAuthRequired={handleAuthRequired}
                  className="px-4 py-2"
                />
              </div>
            </div>
          </div>

          {/* Content Sections */}
          <div className="p-6 sm:p-8 space-y-8">
            {/* Description Section */}
            {(tender.description || tender.bid_description) && (
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Info className="w-5 h-5 mr-2 text-blue-600" />
                  Description
                </h2>
                <div className="prose max-w-none">
                  {tender.description && (
                    <div className="mb-4">
                      <h3 className="font-medium text-gray-900 mb-2">General Description</h3>
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{tender.description}</p>
                    </div>
                  )}
                  {tender.bid_description && tender.bid_description !== tender.description && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Bid Description</h3>
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{tender.bid_description}</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Key Information Grid */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                Key Information
              </h2>
              <div className="grid gap-6 md:grid-cols-2">
                {/* Timeline */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 border-b border-gray-200 pb-2">Timeline</h3>
                  {tender.opening_date && (
                    <div className="flex items-start space-x-3">
                      <Calendar className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Opens</p>
                        <p className="text-sm text-gray-600">{formatDate(tender.opening_date)}</p>
                      </div>
                    </div>
                  )}
                  {tender.close_date && (
                    <div className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Closes</p>
                        <p className="text-sm text-gray-600">{formatDate(tender.close_date)}</p>
                      </div>
                    </div>
                  )}
                  {tender.briefing_date && (
                    <div className="flex items-start space-x-3">
                      <User className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Briefing Session {tender.compulsory_briefing && <span className="text-red-600">(Compulsory)</span>}
                        </p>
                        <p className="text-sm text-gray-600">{formatDate(tender.briefing_date)}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Location & Method */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 border-b border-gray-200 pb-2">Details</h3>
                  {tender.service_location && (
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Service Location</p>
                        <p className="text-sm text-gray-600">{tender.service_location}</p>
                      </div>
                    </div>
                  )}
                  {tender.submission_method && (
                    <div className="flex items-start space-x-3">
                      <Send className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Submission Method</p>
                        <p className="text-sm text-gray-600">{tender.submission_method}</p>
                      </div>
                    </div>
                  )}
                  {tender.required_format && (
                    <div className="flex items-start space-x-3">
                      <FileText className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Required Format</p>
                        <p className="text-sm text-gray-600">{tender.required_format}</p>
                      </div>
                    </div>
                  )}
                  {tender.file_size_limit && (
                    <div className="flex items-start space-x-3">
                      <Globe className="w-5 h-5 text-teal-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">File Size Limit</p>
                        <p className="text-sm text-gray-600">{tender.file_size_limit}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Buyer Information */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Building className="w-5 h-5 mr-2 text-blue-600" />
                Buyer Information
              </h2>
              <div className="grid gap-6 md:grid-cols-2">
                {/* Organization */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 border-b border-gray-200 pb-2">Organization</h3>
                  {tender.buyer && (
                    <div className="flex items-start space-x-3">
                      <Building className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Buyer</p>
                        <p className="text-sm text-gray-600">{tender.buyer}</p>
                      </div>
                    </div>
                  )}
                  {tender.department && tender.department !== tender.buyer && (
                    <div className="flex items-start space-x-3">
                      <Briefcase className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Department</p>
                        <p className="text-sm text-gray-600">{tender.department}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 border-b border-gray-200 pb-2">Contact</h3>
                  {tender.contact_person && (
                    <div className="flex items-start space-x-3">
                      <User className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Contact Person</p>
                        <p className="text-sm text-gray-600">{tender.contact_person}</p>
                      </div>
                    </div>
                  )}
                  {tender.contact_email && (
                    <div className="flex items-start space-x-3">
                      <Mail className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Email</p>
                        <a
                          href={`mailto:${tender.contact_email}`}
                          className="text-sm text-blue-600 hover:text-blue-700 break-all"
                        >
                          {tender.contact_email}
                        </a>
                      </div>
                    </div>
                  )}
                  {tender.contact_tel && (
                    <div className="flex items-start space-x-3">
                      <Phone className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Phone</p>
                        <p className="text-sm text-gray-600">{tender.contact_tel}</p>
                      </div>
                    </div>
                  )}
                  {tender.submission_email && (
                    <div className="flex items-start space-x-3">
                      <Send className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Submission Email</p>
                        <a
                          href={`mailto:${tender.submission_email}`}
                          className="text-sm text-blue-600 hover:text-blue-700 break-all"
                        >
                          {tender.submission_email}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Items */}
            {tenderData?.items && tenderData.items.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <FileCheck className="w-5 h-5 mr-2 text-blue-600" />
                  Items & Requirements
                </h2>
                <div className="space-y-4">
                  {tenderData.items.map((item: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                      <h3 className="font-medium text-gray-900 mb-2">{item.description}</h3>
                      <div className="grid gap-2 sm:grid-cols-2 text-sm text-gray-600">
                        {item.classification?.description && (
                          <div>
                            <span className="font-medium">Classification:</span> {item.classification.description}
                          </div>
                        )}
                        {item.quantity && (
                          <div>
                            <span className="font-medium">Quantity:</span> {item.quantity} {item.unit?.name || ''}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Documents */}
            {(tender.documents || tenderData?.documents) && (
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" />
                  Documents
                </h2>
                <div className="space-y-3">
                  {(tender.documents || tenderData.documents).map((doc: any, index: number) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors space-y-3 sm:space-y-0">
                      <div className="flex items-start space-x-3 min-w-0 flex-1">
                        <FileText className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 truncate">{doc.title}</p>
                          {doc.description && (
                            <p className="text-sm text-gray-600 line-clamp-2 mt-1">{doc.description}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>{doc.documentType}</span>
                            <span>{doc.format}</span>
                          </div>
                        </div>
                      </div>
                      {doc.url && (
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <button
                            onClick={() => downloadDocument(doc)}
                            className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download</span>
                          </button>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1 px-3 py-2 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 transition-colors text-sm"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>View</span>
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Special Conditions */}
            {tender.special_conditions && (
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2 text-amber-600" />
                  Special Conditions
                </h2>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{tender.special_conditions}</p>
                </div>
              </section>
            )}

            {/* View Statistics */}
            {viewStats && (
              <section className="border-t border-gray-200 pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                  View Statistics
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{formatViewCount(viewStats.total_views)}</p>
                    <p className="text-sm text-gray-600">Total Views</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{formatViewCount(viewStats.unique_viewers)}</p>
                    <p className="text-sm text-gray-600">Unique Viewers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{viewStats.views_today}</p>
                    <p className="text-sm text-gray-600">Today</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{viewStats.views_this_week}</p>
                    <p className="text-sm text-gray-600">This Week</p>
                  </div>
                </div>
              </section>
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