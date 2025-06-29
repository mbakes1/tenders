import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView, trackPerformance, trackEvent, AnalyticsEvents } from '../lib/analytics';

// Hook for automatic page view tracking
export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    const startTime = performance.now();
    
    // Track page view
    const pageName = getPageName(location.pathname);
    trackPageView(pageName, {
      search_params: location.search,
      hash: location.hash,
    });

    // Track page load performance
    const handleLoad = () => {
      const loadTime = performance.now() - startTime;
      trackPerformance(pageName, loadTime);
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, [location]);
};

// Hook for tracking user interactions
export const useEventTracking = () => {
  const trackUserEvent = useCallback(<K extends keyof AnalyticsEvents>(
    eventName: K,
    properties: AnalyticsEvents[K]
  ) => {
    trackEvent(eventName, properties);
  }, []);

  return { trackEvent: trackUserEvent };
};

// Hook for tracking tender interactions
export const useTenderTracking = () => {
  const trackTenderView = useCallback((tender: any, source: 'search' | 'browse' | 'bookmark' | 'direct' = 'browse') => {
    const daysUntilClose = tender.close_date ? 
      Math.ceil((new Date(tender.close_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 
      undefined;

    trackEvent('tender_viewed', {
      tender_ocid: tender.ocid,
      tender_title: tender.title || 'Untitled',
      tender_category: tender.category,
      tender_buyer: tender.buyer,
      days_until_close: daysUntilClose,
      source,
    });
  }, []);

  const trackTenderBookmark = useCallback((tender: any, userId: string, action: 'add' | 'remove') => {
    const eventName = action === 'add' ? 'tender_bookmarked' : 'tender_unbookmarked';
    
    trackEvent(eventName, {
      tender_ocid: tender.ocid,
      tender_title: tender.title || 'Untitled',
      tender_category: tender.category,
      user_id: userId,
    });
  }, []);

  const trackTenderSearch = useCallback((searchTerm: string, resultsCount: number, filters: { province?: string; industry?: string }) => {
    trackEvent('tender_searched', {
      search_term: searchTerm,
      results_count: resultsCount,
      filters_applied: filters,
    });
  }, []);

  const trackTenderFilter = useCallback((filterType: 'province' | 'industry' | 'clear_all', filterValue: string | undefined, resultsCount: number) => {
    trackEvent('tender_filtered', {
      filter_type: filterType,
      filter_value: filterValue,
      results_count: resultsCount,
    });
  }, []);

  return {
    trackTenderView,
    trackTenderBookmark,
    trackTenderSearch,
    trackTenderFilter,
  };
};

// Hook for tracking document interactions
export const useDocumentTracking = () => {
  const trackDocumentDownload = useCallback((tender: any, document: any) => {
    trackEvent('document_downloaded', {
      tender_ocid: tender.ocid,
      document_title: document.title || 'Untitled Document',
      document_type: document.documentType || 'unknown',
      file_format: document.format,
    });
  }, []);

  const trackDocumentView = useCallback((tender: any, document: any) => {
    trackEvent('document_viewed', {
      tender_ocid: tender.ocid,
      document_title: document.title || 'Untitled Document',
      document_type: document.documentType || 'unknown',
    });
  }, []);

  return {
    trackDocumentDownload,
    trackDocumentView,
  };
};

// Helper function to get page name from pathname
const getPageName = (pathname: string): string => {
  if (pathname === '/') return 'home';
  if (pathname === '/bookmarks') return 'bookmarks';
  if (pathname.startsWith('/tender/')) return 'tender_detail';
  if (pathname.startsWith('/admin')) return 'admin_dashboard';
  return pathname.replace('/', '').replace(/\//g, '_') || 'unknown';
};

// Hook for error tracking
export const useErrorTracking = () => {
  const trackError = useCallback((error: Error, context?: string) => {
    trackEvent('error_occurred', {
      error_type: 'ui',
      error_message: error.message,
      error_context: context,
    });
  }, []);

  return { trackError };
};