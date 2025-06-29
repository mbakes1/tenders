import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Type exports for use throughout the application
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Specific type exports for commonly used tables
export type Tender = Tables<'tenders'>;
export type Bookmark = Tables<'bookmarks'>;
export type FetchLog = Tables<'fetch_logs'>;

// Auth helper functions with improved error handling
export const signUp = async (email: string, password: string) => {
  try {
    // Validate inputs
    if (!email || !email.includes('@')) {
      throw new Error('Please enter a valid email address');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      // Provide user-friendly error messages
      if (error.message.includes('already registered')) {
        throw new Error('An account with this email already exists. Please sign in instead.');
      } else if (error.message.includes('invalid email')) {
        throw new Error('Please enter a valid email address');
      } else if (error.message.includes('weak password')) {
        throw new Error('Password is too weak. Please choose a stronger password.');
      } else {
        throw new Error(error.message);
      }
    }

    return { data, error: null };
  } catch (err) {
    return { 
      data: null, 
      error: { message: err instanceof Error ? err.message : 'Sign up failed' } 
    };
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    // Validate inputs
    if (!email || !email.includes('@')) {
      throw new Error('Please enter a valid email address');
    }
    if (!password) {
      throw new Error('Please enter your password');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      // Provide user-friendly error messages
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      } else if (error.message.includes('Email not confirmed')) {
        throw new Error('Please check your email and click the confirmation link before signing in.');
      } else if (error.message.includes('Too many requests')) {
        throw new Error('Too many sign-in attempts. Please wait a moment and try again.');
      } else {
        throw new Error(error.message);
      }
    }

    return { data, error: null };
  } catch (err) {
    return { 
      data: null, 
      error: { message: err instanceof Error ? err.message : 'Sign in failed' } 
    };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
    return { error: null };
  } catch (err) {
    return { 
      error: { message: err instanceof Error ? err.message : 'Sign out failed' } 
    };
  }
};

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      throw new Error(error.message);
    }
    return { user, error: null };
  } catch (err) {
    return { 
      user: null, 
      error: { message: err instanceof Error ? err.message : 'Failed to get user' } 
    };
  }
};

// Admin helper functions with enhanced error handling
export const checkAdminStatus = async () => {
  try {
    const { data, error } = await supabase.rpc('is_admin');
    if (error) {
      console.error('Admin check error:', error);
      return { isAdmin: false, error };
    }
    return { isAdmin: data || false, error: null };
  } catch (err) {
    console.error('Admin check exception:', err);
    return { 
      isAdmin: false, 
      error: { message: err instanceof Error ? err.message : 'Failed to check admin status' } 
    };
  }
};

export const getAdminStats = async () => {
  try {
    const { data, error } = await supabase.rpc('get_admin_stats');
    if (error) {
      console.error('Admin stats error:', error);
      throw new Error(`Failed to get admin stats: ${error.message}`);
    }
    return { data: data?.[0] || null, error: null };
  } catch (err) {
    return { 
      data: null, 
      error: { message: err instanceof Error ? err.message : 'Failed to get admin stats' } 
    };
  }
};

export const getRecentActivity = async (limit = 10) => {
  try {
    const { data, error } = await supabase.rpc('get_recent_activity', { limit_count: limit });
    if (error) {
      console.error('Recent activity error:', error);
      throw new Error(`Failed to get recent activity: ${error.message}`);
    }
    return { data: data || [], error: null };
  } catch (err) {
    return { 
      data: [], 
      error: { message: err instanceof Error ? err.message : 'Failed to get recent activity' } 
    };
  }
};

// Tender data functions - Updated to use Edge Function
export const getTenders = async (page: number, search: string, limit: number) => {
  try {
    const { data, error } = await supabase.functions.invoke('get-tenders', {
      body: {
        page,
        search: search.trim(),
        limit
      }
    });

    if (error) {
      throw new Error(`Failed to fetch tenders: ${error.message}`);
    }

    if (!data || !data.success) {
      throw new Error(data?.error || 'Failed to fetch tenders');
    }

    return data;
  } catch (error) {
    console.error('Error fetching tenders:', error);
    throw error;
  }
};

export const getTenderByOcid = async (ocid: string): Promise<Tender> => {
  // Validate OCID
  if (!ocid || typeof ocid !== 'string' || ocid.trim().length === 0) {
    throw new Error('Invalid tender reference provided');
  }

  const { data, error } = await supabase
    .from('tenders')
    .select('*')
    .eq('ocid', ocid.trim())
    .single();
    
  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Tender not found');
    }
    throw new Error(`Failed to fetch tender: ${error.message}`);
  }
  
  return data;
};

export const downloadDocumentProxy = async (doc: { url: string; title: string; format: string }) => {
  const { data, error } = await supabase.functions.invoke('download-document', {
    body: { url: doc.url, filename: doc.title, format: doc.format },
    responseType: 'blob'
  });
  if (error) throw error;
  return data;
};

// Enhanced bookmark helper functions with validation and error handling
export const addBookmark = async (tenderOcid: string) => {
  try {
    // Validate inputs
    if (!tenderOcid || typeof tenderOcid !== 'string' || tenderOcid.trim().length === 0) {
      throw new Error('Invalid tender reference');
    }

    // Safely get the current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      throw new Error('You must be signed in to bookmark tenders');
    }
    const user = userData.user;

    // Attempt to insert the bookmark directly.
    // The UNIQUE constraint on the table will handle duplicates gracefully.
    const { data, error } = await supabase
      .from('bookmarks')
      .insert({ 
        tender_ocid: tenderOcid.trim(), 
        user_id: user.id 
      })
      .select()
      .single();

    if (error) {
      // If it's a unique constraint violation (code 23505), it's not an error for us.
      // It just means the bookmark already exists, so we can proceed without issue.
      if (error.code === '23505') {
        console.warn('Bookmark already exists, which is fine.');
        return { data: null, error: null };
      }
      // For any other database error, we should throw it.
      throw new Error(error.message);
    }

    return { data, error: null };
  } catch (err) {
    return { 
      data: null, 
      error: { message: err instanceof Error ? err.message : 'Failed to add bookmark' } 
    };
  }
};

export const removeBookmark = async (tenderOcid: string) => {
  try {
    // Validate inputs
    if (!tenderOcid || typeof tenderOcid !== 'string' || tenderOcid.trim().length === 0) {
      throw new Error('Invalid tender reference');
    }

    // Safely get the current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      throw new Error('You must be signed in to manage bookmarks');
    }
    const user = userData.user;

    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', user.id)
      .eq('tender_ocid', tenderOcid.trim());

    if (error) {
      throw new Error(error.message);
    }

    return { error: null };
  } catch (err) {
    return { 
      error: { message: err instanceof Error ? err.message : 'Failed to remove bookmark' } 
    };
  }
};

export const checkIfBookmarked = async (tenderOcid: string) => {
  try {
    // Validate inputs
    if (!tenderOcid || typeof tenderOcid !== 'string' || tenderOcid.trim().length === 0) {
      return { isBookmarked: false, error: null };
    }

    const { data, error } = await supabase
      .rpc('is_tender_bookmarked', { tender_ocid_param: tenderOcid.trim() });

    if (error) {
      throw new Error(error.message);
    }

    return { isBookmarked: data || false, error: null };
  } catch (err) {
    return { 
      isBookmarked: false, 
      error: { message: err instanceof Error ? err.message : 'Failed to check bookmark status' } 
    };
  }
};

export const getUserBookmarks = async (page = 1, limit = 24): Promise<{ data: Tender[], error: any }> => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      throw new Error('You must be signed in to view bookmarks');
    }
    const user = userData.user;

    const offset = (page - 1) * limit;
    const { data, error } = await supabase
      .rpc('get_user_bookmarks', { 
        limit_count: limit, 
        offset_count: offset 
      });

    if (error) {
      throw new Error(error.message);
    }

    return { data: data || [], error: null };
  } catch (err) {
    return { 
      data: [], 
      error: { message: err instanceof Error ? err.message : 'Failed to fetch bookmarks' } 
    };
  }
};

// Health check function to validate system status
export const performHealthCheck = async () => {
  try {
    // Test basic connectivity
    const { data: connectivityTest, error: connectivityError } = await supabase
      .from('tenders')
      .select('count')
      .limit(1);

    if (connectivityError) {
      return { 
        status: 'error', 
        message: 'Database connectivity failed', 
        error: connectivityError,
        checks: {
          connectivity: false,
          statistics: false
        }
      };
    }

    // Test statistics function
    const { data: stats, error: statsError } = await supabase
      .rpc('get_tender_stats');

    if (statsError) {
      console.warn('Statistics function failed:', statsError);
      return {
        status: 'warning',
        message: 'Database connected but some functions unavailable',
        checks: {
          connectivity: true,
          statistics: false
        }
      };
    }

    return {
      status: 'healthy',
      message: 'All systems operational',
      checks: {
        connectivity: true,
        statistics: true,
        stats: stats?.[0] || null
      }
    };
  } catch (error) {
    return {
      status: 'error',
      message: 'Health check failed',
      error,
      checks: {
        connectivity: false,
        statistics: false
      }
    };
  }
};

// Function to manually trigger incremental sync (for admin use)
export const triggerDataSync = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('sync-tenders', {
      method: 'POST'
    });

    if (error) {
      throw new Error(`Sync failed: ${error.message}`);
    }

    return { success: true, data, syncType: data?.syncType || 'incremental' };
  } catch (error) {
    console.error('Manual sync failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Sync failed',
      syncType: 'incremental'
    };
  }
};

// Function to manually trigger full re-sync (for admin use)
export const triggerFullResync = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('full-resync-tenders', {
      method: 'POST'
    });

    if (error) {
      throw new Error(`Full re-sync failed: ${error.message}`);
    }

    return { success: true, data, syncType: 'full_resync' };
  } catch (error) {
    console.error('Manual full re-sync failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Full re-sync failed',
      syncType: 'full_resync'
    };
  }
};

// Function to get sync statistics (for admin monitoring)
export const getSyncStatistics = async () => {
  try {
    const { data, error } = await supabase
      .from('fetch_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No sync logs found
        return { data: null, error: null };
      }
      throw new Error(`Failed to get sync statistics: ${error.message}`);
    }

    return { data, error: null };
  } catch (err) {
    return { 
      data: null, 
      error: { message: err instanceof Error ? err.message : 'Failed to get sync statistics' } 
    };
  }
};