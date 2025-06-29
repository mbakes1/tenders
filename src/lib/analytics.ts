import posthog from 'posthog-js';

// PostHog configuration
const POSTHOG_API_KEY = import.meta.env.VITE_POSTHOG_API_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';

// Initialize PostHog
export const initializeAnalytics = () => {
  if (!POSTHOG_API_KEY) {
    console.warn('PostHog API key not found. Analytics will not be initialized.');
    return;
  }

  posthog.init(POSTHOG_API_KEY, {
    api_host: POSTHOG_HOST,
    // Enable session recording for better user insights
    session_recording: {
      recordCrossOriginIframes: true,
    },
    // Capture pageviews automatically
    capture_pageview: true,
    // Capture performance metrics
    capture_performance: true,
    // Enable feature flags
    bootstrap: {
      featureFlags: {},
    },
    // Privacy settings
    respect_dnt: true,
    opt_out_capturing_by_default: false,
    // Advanced settings
    autocapture: {
      // Capture clicks, form submissions, and page changes
      dom_event_allowlist: ['click', 'change', 'submit'],
      // Capture additional element attributes
      capture_copied_text: true,
    },
    // Disable in development unless explicitly enabled
    loaded: (posthog) => {
      if (import.meta.env.DEV && !import.meta.env.VITE_POSTHOG_DEV_ENABLED) {
        posthog.opt_out_capturing();
        console.log('PostHog disabled in development mode');
      }
    },
  });
};

// Analytics event types for type safety
export interface AnalyticsEvents {
  // User Authentication Events
  'user_signed_up': {
    method: 'email' | 'social';
    user_id: string;
  };
  'user_signed_in': {
    method: 'email' | 'social';
    user_id: string;
  };
  'user_signed_out': {
    user_id: string;
  };

  // Tender Discovery Events
  'tender_viewed': {
    tender_ocid: string;
    tender_title: string;
    tender_category?: string;
    tender_buyer?: string;
    days_until_close?: number;
    source: 'search' | 'browse' | 'bookmark' | 'direct';
  };
  'tender_searched': {
    search_term: string;
    results_count: number;
    filters_applied: {
      province?: string;
      industry?: string;
    };
  };
  'tender_filtered': {
    filter_type: 'province' | 'industry' | 'clear_all';
    filter_value?: string;
    results_count: number;
  };

  // Bookmark Events
  'tender_bookmarked': {
    tender_ocid: string;
    tender_title: string;
    tender_category?: string;
    user_id: string;
  };
  'tender_unbookmarked': {
    tender_ocid: string;
    tender_title: string;
    user_id: string;
  };
  'bookmarks_viewed': {
    user_id: string;
    bookmark_count: number;
  };

  // Navigation Events
  'page_viewed': {
    page_name: string;
    page_path: string;
    referrer?: string;
  };
  'external_link_clicked': {
    url: string;
    link_text?: string;
    context: string;
  };

  // Document Events
  'document_downloaded': {
    tender_ocid: string;
    document_title: string;
    document_type: string;
    file_format?: string;
  };
  'document_viewed': {
    tender_ocid: string;
    document_title: string;
    document_type: string;
  };

  // Error Events
  'error_occurred': {
    error_type: 'network' | 'auth' | 'data' | 'ui' | 'unknown';
    error_message: string;
    error_context?: string;
    user_id?: string;
  };

  // Performance Events
  'page_load_time': {
    page_name: string;
    load_time_ms: number;
    is_slow_connection: boolean;
  };

  // Feature Usage Events
  'feature_used': {
    feature_name: string;
    feature_context?: string;
    user_id?: string;
  };
}

// Type-safe event tracking function
export const trackEvent = <K extends keyof AnalyticsEvents>(
  eventName: K,
  properties: AnalyticsEvents[K]
) => {
  if (!POSTHOG_API_KEY) return;

  try {
    posthog.capture(eventName, {
      ...properties,
      timestamp: new Date().toISOString(),
      app_version: import.meta.env.VITE_APP_VERSION || '1.0.0',
      environment: import.meta.env.MODE,
    });
  } catch (error) {
    console.error('Analytics tracking error:', error);
  }
};

// User identification and properties
export const identifyUser = (userId: string, properties?: Record<string, any>) => {
  if (!POSTHOG_API_KEY) return;

  try {
    posthog.identify(userId, {
      ...properties,
      first_seen: new Date().toISOString(),
    });
  } catch (error) {
    console.error('User identification error:', error);
  }
};

// Set user properties
export const setUserProperties = (properties: Record<string, any>) => {
  if (!POSTHOG_API_KEY) return;

  try {
    posthog.people.set(properties);
  } catch (error) {
    console.error('Set user properties error:', error);
  }
};

// Reset user (for logout)
export const resetUser = () => {
  if (!POSTHOG_API_KEY) return;

  try {
    posthog.reset();
  } catch (error) {
    console.error('Reset user error:', error);
  }
};

// Feature flags
export const getFeatureFlag = (flagKey: string): boolean | string | undefined => {
  if (!POSTHOG_API_KEY) return undefined;

  try {
    return posthog.getFeatureFlag(flagKey);
  } catch (error) {
    console.error('Feature flag error:', error);
    return undefined;
  }
};

export const isFeatureEnabled = (flagKey: string): boolean => {
  if (!POSTHOG_API_KEY) return false;

  try {
    return posthog.isFeatureEnabled(flagKey);
  } catch (error) {
    console.error('Feature flag check error:', error);
    return false;
  }
};

// Page view tracking
export const trackPageView = (pageName: string, additionalProperties?: Record<string, any>) => {
  trackEvent('page_viewed', {
    page_name: pageName,
    page_path: window.location.pathname,
    referrer: document.referrer,
    ...additionalProperties,
  });
};

// Performance tracking
export const trackPerformance = (pageName: string, loadTime: number) => {
  trackEvent('page_load_time', {
    page_name: pageName,
    load_time_ms: loadTime,
    is_slow_connection: navigator.connection ? 
      (navigator.connection as any).effectiveType === 'slow-2g' || 
      (navigator.connection as any).effectiveType === '2g' : false,
  });
};

// Error tracking
export const trackError = (
  errorType: AnalyticsEvents['error_occurred']['error_type'],
  errorMessage: string,
  context?: string,
  userId?: string
) => {
  trackEvent('error_occurred', {
    error_type: errorType,
    error_message: errorMessage,
    error_context: context,
    user_id: userId,
  });
};

// Conversion funnel tracking
export const trackConversionStep = (step: string, properties?: Record<string, any>) => {
  trackEvent('feature_used', {
    feature_name: `conversion_${step}`,
    feature_context: 'user_journey',
    ...properties,
  });
};

// Export PostHog instance for advanced usage
export { posthog };