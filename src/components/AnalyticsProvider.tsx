import React, { createContext, useContext, useEffect } from 'react';
import { initializeAnalytics, identifyUser, resetUser, setUserProperties } from '../lib/analytics';
import { useCurrentUser } from '../lib/queries';
import { usePageTracking } from '../hooks/useAnalytics';

interface AnalyticsContextType {
  isInitialized: boolean;
}

const AnalyticsContext = createContext<AnalyticsContextType>({
  isInitialized: false,
});

export const useAnalytics = () => useContext(AnalyticsContext);

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = React.useState(false);
  const { data: currentUser } = useCurrentUser();
  
  // Initialize PostHog
  useEffect(() => {
    try {
      initializeAnalytics();
      setIsInitialized(true);
      console.log('✅ PostHog analytics initialized');
    } catch (error) {
      console.error('❌ Failed to initialize PostHog:', error);
    }
  }, []);

  // Handle user identification
  useEffect(() => {
    if (!isInitialized) return;

    const user = currentUser?.user;
    
    if (user) {
      // Identify user in PostHog
      identifyUser(user.id, {
        email: user.email,
        created_at: user.created_at,
        email_verified: user.email_confirmed_at ? true : false,
        last_sign_in: user.last_sign_in_at,
        app_metadata: user.app_metadata,
        user_metadata: user.user_metadata,
      });

      // Set additional user properties
      setUserProperties({
        is_authenticated: true,
        user_type: user.app_metadata?.role || 'user',
        signup_date: user.created_at,
      });

      console.log('👤 User identified in analytics:', user.email);
    } else {
      // Reset user session when logged out
      resetUser();
      console.log('🚪 User session reset in analytics');
    }
  }, [currentUser, isInitialized]);

  // Enable automatic page tracking
  usePageTracking();

  return (
    <AnalyticsContext.Provider value={{ isInitialized }}>
      {children}
    </AnalyticsContext.Provider>
  );
};