import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Create a client with optimized defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Global defaults for all queries
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false, // Disable refetch on window focus for better UX
      refetchOnReconnect: true, // Refetch when connection is restored
      // Add error boundary integration
      throwOnError: (error: any) => {
        // Let the error boundary handle 5xx server errors and network errors
        return error?.status >= 500 || !error?.status;
      },
    },
    mutations: {
      // Global defaults for all mutations
      retry: 1,
      retryDelay: 1000,
      // Add error boundary integration for mutations
      throwOnError: (error: any) => {
        // Let the error boundary handle critical mutation errors
        return error?.status >= 500 || !error?.status;
      },
    },
  },
});

// Add global error handler for React Query
queryClient.setMutationDefaults(['global'], {
  onError: (error) => {
    console.error('🚨 React Query mutation error:', error);
    // Additional error logging/reporting could go here
  },
});

queryClient.setQueryDefaults(['global'], {
  onError: (error) => {
    console.error('🚨 React Query query error:', error);
    // Additional error logging/reporting could go here
  },
});

interface QueryProviderProps {
  children: React.ReactNode;
}

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Only show devtools in development */}
      {import.meta.env.DEV && (
        <ReactQueryDevtools 
          initialIsOpen={false} 
          position="bottom-right"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
};

export { queryClient };