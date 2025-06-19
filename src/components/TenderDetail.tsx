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
  TrendingUp
} from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import SkeletonDetail from './SkeletonDetail';
import BookmarkButton from './BookmarkButton';
import AuthModal from './AuthModal';
import { trackTenderView, getTenderViewStats } from '../lib/supabase';

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
        
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          throw new Error('Supabase configuration missing');
        }

        // Query the database directly for the tender using fetch
        const response = await fetch(`${supabaseUrl}/rest/v1/tenders?ocid=eq.${encodeURIComponent(decodeURIComponent(ocid))}&select=*`, {
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Database error: ${response.status} ${response.statusText}`);
        }
        
        const tenderData = await response.json();
        
        if (!tenderData || tenderData.length === 0) {
          throw new Error('Tender not found');
        }
        
        setTender(tenderData[0]);
        
        // Track the view
        const viewResult = await trackTenderView(decodeURIComponent(ocid));
        if (viewResult.success) {
          // Update the tender's view count in state
          setTender((prev: any) => ({
            ...prev,
            view_count: viewResult.viewCount
          }));
        }

        // Get detailed view stats
        const { data: stats } = await getTenderViewStats(decodeURIComponent(ocid));
        setViewStats(stats);
        
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
      // Call our document proxy function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const response = await fetch(`${supabaseUrl}/functions/v1/download-document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: doc.url,
          filename: doc.title || 'document',
          format: doc.format || 'pdf'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to download document');
      }

      const blob = await response.blob();
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
      <div className="text-center py-12">
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
      <div className="space-y-6">
        {/* Back Navigation */}
        <Link
          to="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tenders
        </Link>

        {/* Header Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between space-y-4 lg:space-y-0">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                {tender.title || 'Untitled Tender'}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                <span className="font-mono">OCID: {tender.ocid}</span>
                {tender.bid_number && (
                  <span className="flex items-center">
                    <Tag className="w-4 h-4 mr-1" />
                    {tender.bid_number}
                  </span>
                )}
                {viewCount > 0 && (
                  <div className="flex items-center space-x-1 px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-200">
                    <Eye className="w-4 h-4" />
                    <span className="font-medium">{formatViewCount(viewCount)} views</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
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
            <div className="flex flex-col items-end space-y-3">
              <div className="flex items-center space-x-3">
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
              
              <BookmarkButton
                tenderOcid={tender.ocid}
                onAuthRequired={handleAuthRequired}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {(tender.description || tender.bid_description) && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
                <div className="space-y-4">
                  {tender.description && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">General Description</h3>
                      <p className="text-gray-700 whitespace-pre-wrap">{tender.description}</p>
                    </div>
                  )}
                  {tender.bid_description && tender.bid_description !== tender.description && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Bid Description</h3>
                      <p className="text-gray-700 whitespace-pre-wrap">{tender.bid_description}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Items */}
            {tenderData?.items && tenderData.items.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Items</h2>
                <div className="space-y-4">
                  {tenderData.items.map((item: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900">{item.description}</h3>
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
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Documents</h2>
                <div className="space-y-3">
                  {(tender.documents || tenderData.documents).map((doc: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{doc.title}</p>
                          {doc.description && (
                            <p className="text-sm text-gray-600">{doc.description}</p>
                          )}
                          <p className="text-xs text-gray-500">
                            {doc.documentType} • {doc.format}
                          </p>
                        </div>
                      </div>
                      {doc.url && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => downloadDocument(doc)}
                            className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download</span>
                          </button>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1 text-gray-600 hover:text-gray-700 transition-colors text-sm"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Original</span>
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
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Special Conditions</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{tender.special_conditions}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* View Statistics */}
            {viewStats && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
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
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Information</h2>
              <div className="space-y-4">
                {/* Tender Period */}
                <div className="flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
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
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Submission Method</p>
                      <p className="font-medium text-gray-900">{tender.submission_method}</p>
                    </div>
                  </div>
                )}

                {/* Service Location */}
                {tender.service_location && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Service Location</p>
                      <p className="font-medium text-gray-900">{tender.service_location}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Buyer Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Buyer Information</h2>
              <div className="space-y-3">
                {tender.buyer && (
                  <div className="flex items-start space-x-3">
                    <Building className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{tender.buyer}</p>
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
                      <div className="w-5 h-5 flex items-center justify-center">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      </div>
                      <span className="text-sm text-gray-900 font-medium">{tender.contact_person}</span>
                    </div>
                  )}
                  
                  {tender.contact_tel && (
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{tender.contact_tel}</span>
                    </div>
                  )}
                  
                  {tender.contact_email && (
                    <div className="flex items-center space-x-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <a
                        href={`mailto:${tender.contact_email}`}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        {tender.contact_email}
                      </a>
                    </div>
                  )}
                  
                  {tender.contact_fax && (
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 flex items-center justify-center">
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
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Submission Details</h2>
                <div className="space-y-3">
                  {tender.submission_email && (
                    <div>
                      <p className="text-sm text-gray-600">Submission Email</p>
                      <a
                        href={`mailto:${tender.submission_email}`}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
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