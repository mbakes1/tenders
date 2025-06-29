import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { 
  getTenders, 
  getTenderByOcid, 
  addBookmark, 
  removeBookmark, 
  checkIfBookmarked, 
  getUserBookmarks,
  getCurrentUser,
  checkAdminStatus,
  getAdminStats,
  getRecentActivity,
  type Tender
} from './supabase';

// Query Keys - Centralized key management
export const queryKeys = {
  // Tenders
  tenders: (page: number, search: string, limit: number) => ['tenders', { page, search, limit }] as const,
  tender: (ocid: string) => ['tender', ocid] as const,
  
  // Bookmarks
  bookmarks: (page: number, limit: number) => ['bookmarks', { page, limit }] as const,
  isBookmarked: (ocid: string) => ['is-bookmarked', ocid] as const,
  
  // User
  currentUser: () => ['current-user'] as const,
  isAdmin: () => ['is-admin'] as const,
  
  // Admin
  adminStats: () => ['admin-stats'] as const,
  recentActivity: (limit: number) => ['recent-activity', limit] as const,
} as const;

// Tender Queries
export const useTenders = (page: number, search: string, limit: number = 24) => {
  return useQuery({
    queryKey: queryKeys.tenders(page, search, limit),
    queryFn: () => getTenders(page, search, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useTender = (ocid: string, options?: Partial<UseQueryOptions<Tender>>) => {
  return useQuery({
    queryKey: queryKeys.tender(ocid),
    queryFn: () => getTenderByOcid(ocid),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: !!ocid,
    retry: 2,
    ...options,
  });
};

// Bookmark Queries
export const useBookmarks = (page: number = 1, limit: number = 24) => {
  return useQuery({
    queryKey: queryKeys.bookmarks(page, limit),
    queryFn: async () => {
      const result = await getUserBookmarks(page, limit);
      return result.data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};

export const useIsBookmarked = (ocid: string) => {
  return useQuery({
    queryKey: queryKeys.isBookmarked(ocid),
    queryFn: async () => {
      const result = await checkIfBookmarked(ocid);
      return { isBookmarked: result.isBookmarked, error: result.error };
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!ocid,
    retry: 1,
  });
};

// User Queries
export const useCurrentUser = () => {
  return useQuery({
    queryKey: queryKeys.currentUser(),
    queryFn: async () => {
      const result = await getCurrentUser();
      return { user: result.user, error: result.error };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
};

export const useIsAdmin = () => {
  return useQuery({
    queryKey: queryKeys.isAdmin(),
    queryFn: async () => {
      const result = await checkAdminStatus();
      return { isAdmin: result.isAdmin, error: result.error };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
};

// Admin Queries
export const useAdminStats = () => {
  return useQuery({
    queryKey: queryKeys.adminStats(),
    queryFn: async () => {
      const result = await getAdminStats();
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};

export const useRecentActivity = (limit: number = 10) => {
  return useQuery({
    queryKey: queryKeys.recentActivity(limit),
    queryFn: async () => {
      const result = await getRecentActivity(limit);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data || [];
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });
};

// Bookmark Mutations
export const useAddBookmark = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: addBookmark,
    onMutate: async (ocid: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.isBookmarked(ocid) });
      await queryClient.cancelQueries({ queryKey: queryKeys.bookmarks(1, 24) });
      
      // Snapshot previous values
      const previousIsBookmarked = queryClient.getQueryData(queryKeys.isBookmarked(ocid));
      const previousBookmarks = queryClient.getQueryData(queryKeys.bookmarks(1, 24));
      
      // Optimistically update
      queryClient.setQueryData(queryKeys.isBookmarked(ocid), { isBookmarked: true, error: null });
      
      return { previousIsBookmarked, previousBookmarks, ocid };
    },
    onError: (err, ocid, context) => {
      // Revert optimistic update
      if (context?.previousIsBookmarked) {
        queryClient.setQueryData(queryKeys.isBookmarked(context.ocid), context.previousIsBookmarked);
      }
      if (context?.previousBookmarks) {
        queryClient.setQueryData(queryKeys.bookmarks(1, 24), context.previousBookmarks);
      }
    },
    onSettled: (data, error, ocid) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.isBookmarked(ocid) });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks(1, 24) });
    },
  });
};

export const useRemoveBookmark = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: removeBookmark,
    onMutate: async (ocid: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.isBookmarked(ocid) });
      await queryClient.cancelQueries({ queryKey: queryKeys.bookmarks(1, 24) });
      
      // Snapshot previous values
      const previousIsBookmarked = queryClient.getQueryData(queryKeys.isBookmarked(ocid));
      const previousBookmarks = queryClient.getQueryData(queryKeys.bookmarks(1, 24));
      
      // Optimistically update
      queryClient.setQueryData(queryKeys.isBookmarked(ocid), { isBookmarked: false, error: null });
      
      return { previousIsBookmarked, previousBookmarks, ocid };
    },
    onError: (err, ocid, context) => {
      // Revert optimistic update
      if (context?.previousIsBookmarked) {
        queryClient.setQueryData(queryKeys.isBookmarked(context.ocid), context.previousIsBookmarked);
      }
      if (context?.previousBookmarks) {
        queryClient.setQueryData(queryKeys.bookmarks(1, 24), context.previousBookmarks);
      }
    },
    onSettled: (data, error, ocid) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.isBookmarked(ocid) });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks(1, 24) });
    },
  });
};

// Cache Utilities
export const useCacheUtils = () => {
  const queryClient = useQueryClient();
  
  return {
    // Prefetch tender details when hovering over cards
    prefetchTender: (ocid: string) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.tender(ocid),
        queryFn: () => getTenderByOcid(ocid),
        staleTime: 10 * 60 * 1000,
      });
    },
    
    // Clear all caches (useful for logout)
    clearAllCaches: () => {
      queryClient.clear();
    },
    
    // Invalidate user-specific data (useful for login/logout)
    invalidateUserData: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.currentUser() });
      queryClient.invalidateQueries({ queryKey: queryKeys.isAdmin() });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks(1, 24) });
      // Invalidate all bookmark status queries
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0] === 'is-bookmarked'
      });
    },
    
    // Invalidate admin data (useful for admin operations)
    invalidateAdminData: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminStats() });
      queryClient.invalidateQueries({ queryKey: queryKeys.recentActivity(15) });
    },
    
    // Get cached data without triggering a fetch
    getCachedTender: (ocid: string): Tender | undefined => {
      return queryClient.getQueryData(queryKeys.tender(ocid));
    },
    
    // Set tender data in cache (useful for optimistic updates)
    setCachedTender: (ocid: string, data: Tender) => {
      queryClient.setQueryData(queryKeys.tender(ocid), data);
    },
  };
};