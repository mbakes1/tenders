import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
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
  User,
  Globe,
  Briefcase,
  Send,
  FileCheck,
  Info,
  Zap
} from 'lucide-react';
import SkeletonDetail from './SkeletonDetail';
import BookmarkButton from './BookmarkButton';
import AuthModal from './AuthModal';
import { useTender, useCacheUtils } from '../lib/queries';
import { useTenderTracking, useDocumentTracking } from '../hooks/useAnalytics';
import { downloadDocumentProxy, type Tender } from '../lib/supabase';

const TenderDetail: React.FC = () => {
  const { ocid } = useParams<{ ocid: string }>();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { prefetchTender } = useCacheUtils();
  const { trackTenderView } = useTenderTracking();
  const { trackDocumentDownload, trackDocumentView } = useDocumentTracking();

  const decodedOcid = ocid ? decodeURIComponent(ocid) : '';

  // Use TanStack Query for data fetching
  const {
    data: tender,
    isLoading,
    isError,
    error
  } = useTender(decodedOcid);

  // Track tender view when data loads
  React.useEffect(() => {
    if (tender) {
      trackTenderView(tender, 'direct');
    }
  }, [tender, trackTenderView]);

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

  const downloadDocument = async (doc: any) => {
    try {
      // Track document download
      if (tender) {
        trackDocumentDownload(tender, doc);
      }
      
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
      // Track document view as fallback
      if (tender) {
        trackDocumentView(tender, doc);
      }
      window.open(doc.url, '_blank');
    }
  };

  const handleAuthRequired = () => {
    setShowAuthModal(true);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
  };

  // Generate SEO-optimized meta data
  const generateMetaData = (tender: Tender) => {
    const procuringEntity = tender.buyer || tender.department || 'Government Entity';
    const tenderTitle = tender.title || 'Government Opportunity';
    const category = tender.category || 'Government Procurement';
    const refNumber = tender.bid_number || tender.reference_number || tender.ocid;
    
    // Create SEO-optimized title (max 60 characters for optimal display)
    const pageTitle = `${procuringEntity} - ${tenderTitle} | BidBase`.substring(0, 60);
    
    // Create compelling meta description (max 160 characters)
    const description = tender.description || tender.bid_description || '';
    const metaDescription = description 
      ? `${description.substring(0, 120)}... Apply now on BidBase.`
      : `Government opportunity from ${procuringEntity}. ${category} tender closing ${tender.close_date ? new Date(tender.close_date).toLocaleDateString('en-ZA') : 'soon'}. Apply on BidBase.`;
    
    // Generate keywords for better discoverability
    const keywords = [
      'government tender',
      'public procurement',
      'business opportunity',
      procuringEntity.toLowerCase(),
      category.toLowerCase(),
      'south africa',
      'bidbase',
      'government contract',
      'tender application'
    ].filter(Boolean).join(', ');

    // Create structured data for rich snippets
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "JobPosting",
      "title": tenderTitle,
      "description": description || `Government procurement opportunity from ${procuringEntity}`,
      "hiringOrganization": {
        "@type": "Organization",
        "name": procuringEntity,
        "sameAs": "https://bidbase.co.za"
      },
      "jobLocation": {
        "@type": "Place",
        "addressLocality": tender.service_location || "South Africa",
        "addressCountry": "ZA"
      },
      "datePosted": tender.opening_date || tender.created_at,
      "validThrough": tender.close_date,
      "employmentType": "CONTRACT",
      "industry": category,
      "identifier": {
        "@type": "PropertyValue",
        "name": "Reference Number",
        "value": refNumber
      },
      "url": `https://bidbase.co.za/tender/${encodeURIComponent(tender.ocid)}`
    };

    return {
      title: pageTitle,
      description: metaDescription.substring(0, 160),
      keywords,
      structuredData,
      canonical: `https://bidbase.co.za/tender/${encodeURIComponent(tender.ocid)}`
    };
  };

  if (isLoading) {
    return (
      <>
        <Helmet>
          <title>Loading Opportunity | BidBase</title>
          <meta name="description" content="Loading government procurement opportunity details..." />
        </Helmet>
        <SkeletonDetail />
      </>
    );
  }

  if (isError || !tender) {
    return (
      <>
        <Helmet>
          <title>Opportunity Not Found | BidBase</title>
          <meta name="description" content="The requested government opportunity could not be found. Explore other procurement opportunities on BidBase." />
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="text-center py-12 px-4">
          <div className="bg-white border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Opportunity not found</h3>
            <p className="text-red-600 text-sm mb-4">
              {error instanceof Error ? error.message : 'An error occurred while loading this opportunity'}
            </p>
            <Link
              to="/"
              className="inline-block px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
            >
              Back to Opportunities
            </Link>
          </div>
        </div>
      </>
    );
  }

  // Parse full_data if it exists, otherwise use the tender data directly
  const tenderData = tender.full_data?.tender || tender.full_data || tender;
  const closeDate = tender.close_date;
  const daysUntilClose = closeDate ? getDaysUntilClose(closeDate) : null;
  
  // Generate meta data for SEO
  const metaData = generateMetaData(tender);

  return (
    <>
      <Helmet>
        <title>{metaData.title}</title>
        <meta name="description" content={metaData.description} />
        <meta name="keywords" content={metaData.keywords} />
        <link rel="canonical" href={metaData.canonical} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={metaData.title} />
        <meta property="og:description" content={metaData.description} />
        <meta property="og:url" content={metaData.canonical} />
        <meta property="og:site_name" content="BidBase" />
        <meta property="article:published_time" content={tender.opening_date || tender.created_at} />
        <meta property="article:modified_time" content={tender.updated_at} />
        <meta property="article:expiration_time" content={tender.close_date} />
        <meta property="article:section" content={tender.category || 'Government Procurement'} />
        <meta property="article:tag" content="government tender" />
        <meta property="article:tag" content="public procurement" />
        <meta property="article:tag" content={tender.category || 'procurement'} />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metaData.title} />
        <meta name="twitter:description" content={metaData.description} />
        <meta name="twitter:url" content={metaData.canonical} />
        
        {/* Additional SEO meta tags */}
        <meta name="author" content="BidBase" />
        <meta name="publisher" content="BidBase" />
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        
        {/* Structured Data for Rich Snippets */}
        <script type="application/ld+json">
          {JSON.stringify(metaData.structuredData)}
        </script>
        
        {/* Additional structured data for organization */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "BidBase",
            "description": "Government procurement made simple for emerging businesses",
            "url": "https://bidbase.co.za",
            "logo": "https://bidbase.co.za/logo.png",
            "sameAs": [
              "https://twitter.com/bidbase",
              "https://linkedin.com/company/bidbase"
            ]
          })}
        </script>
      </Helmet>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Navigation */}
        <Link
          to="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors font-medium text-sm sm:text-base"
          onMouseEnter={() => {
            // Prefetch the tenders list when hovering over back button
            // This ensures smooth navigation back
          }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Opportunities
        </Link>

        {/* Main Content Container */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200 p-6 sm:p-8">
            <div className="flex flex-col space-y-4">
              {/* Title and Meta */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Zap className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-600">Government Opportunity</span>
                </div>
                
                {/* Procuring Entity as main title */}
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 leading-tight">
                  {tender.buyer || tender.department || 'Government Entity'}
                </h1>
                
                {/* Tender title as subtitle */}
                {tender.title && (
                  <h2 className="text-lg sm:text-xl text-gray-700 mb-4 leading-relaxed">
                    {tender.title}
                  </h2>
                )}
                
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-4">
                  <div className="flex items-center space-x-1">
                    <Tag className="w-4 h-4" />
                    <span className="font-mono">{tender.ocid}</span>
                  </div>
                  {(tender.bid_number || tender.reference_number) && (
                    <div className="flex items-center space-x-1">
                      <FileCheck className="w-4 h-4" />
                      <span>Ref: {tender.bid_number || tender.reference_number}</span>
                    </div>
                  )}
                </div>

                {/* Status and Category */}
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Open for Applications
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
                      {daysUntilClose > 0 ? `${daysUntilClose} days left` : 'Deadline passed'}
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
                  Opportunity Description
                </h2>
                <div className="prose max-w-none">
                  {tender.description && (
                    <div className="mb-4">
                      <h3 className="font-medium text-gray-900 mb-2">Overview</h3>
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{tender.description}</p>
                    </div>
                  )}
                  {tender.bid_description && tender.bid_description !== tender.description && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Detailed Requirements</h3>
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
                  <h3 className="font-medium text-gray-900 border-b border-gray-200 pb-2">Important Dates</h3>
                  {tender.opening_date && (
                    <div className="flex items-start space-x-3">
                      <Calendar className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Application Opens</p>
                        <p className="text-sm text-gray-600">{formatDate(tender.opening_date)}</p>
                      </div>
                    </div>
                  )}
                  {tender.close_date && (
                    <div className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Application Deadline</p>
                        <p className="text-sm text-gray-600">{formatDate(tender.close_date)}</p>
                      </div>
                    </div>
                  )}
                  {tender.briefing_date && (
                    <div className="flex items-start space-x-3">
                      <User className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Briefing Session {tender.compulsory_briefing && <span className="text-red-600">(Mandatory)</span>}
                        </p>
                        <p className="text-sm text-gray-600">{formatDate(tender.briefing_date)}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Application Details */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 border-b border-gray-200 pb-2">Application Details</h3>
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

            {/* Government Department Information */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Building className="w-5 h-5 mr-2 text-blue-600" />
                Government Department
              </h2>
              <div className="grid gap-6 md:grid-cols-2">
                {/* Organization */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 border-b border-gray-200 pb-2">Organization</h3>
                  {tender.buyer && (
                    <div className="flex items-start space-x-3">
                      <Building className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Procuring Entity</p>
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
                  <h3 className="font-medium text-gray-900 border-b border-gray-200 pb-2">Contact Information</h3>
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
                  Requirements & Scope
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
                  Application Documents
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
                            className="flex items-center space-x-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 transition-all duration-200 text-sm font-medium"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download</span>
                          </button>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => trackDocumentView(tender, doc)}
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
                  Special Conditions & Requirements
                </h2>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{tender.special_conditions}</p>
                </div>
              </section>
            )}

            {/* BidBase Tips */}
            <section className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">BidBase Success Tips</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">📋 Application Checklist</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Review all requirements carefully</li>
                    <li>• Download and complete all forms</li>
                    <li>• Prepare supporting documents</li>
                    <li>• Submit before the deadline</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">🎯 Winning Strategies</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Attend briefing sessions if available</li>
                    <li>• Ask clarifying questions early</li>
                    <li>• Highlight relevant experience</li>
                    <li>• Follow submission guidelines exactly</li>
                  </ul>
                </div>
              </div>
            </section>
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