import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth helper functions
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

// Tender data functions
export const getTenders = async (page: number, search: string, limit: number) => {
  const { data, error } = await supabase.functions.invoke('get-tenders', {
    body: { page, search, limit, openOnly: true },
  });
  if (error) throw error;
  if (!data.success) throw new Error(data.error);
  return data;
};

export const getTenderByOcid = async (ocid: string) => {
  const { data, error } = await supabase
    .from('tenders')
    .select('*')
    .eq('ocid', ocid)
    .single();
  if (error) throw error;
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

// Bookmark helper functions
export const addBookmark = async (tenderOcid: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: { message: "User is not authenticated." } as any };
  }
  const { data, error } = await supabase
    .from('bookmarks')
    .insert({ tender_ocid: tenderOcid, user_id: user.id });
  return { data, error };
};

export const removeBookmark = async (tenderOcid: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: { message: "User is not authenticated." } as any };
  }
  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('user_id', user.id)
    .eq('tender_ocid', tenderOcid);
  return { error };
};

export const checkIfBookmarked = async (tenderOcid: string) => {
  const { data, error } = await supabase
    .rpc('is_tender_bookmarked', { tender_ocid_param: tenderOcid });
  return { isBookmarked: data, error };
};

export const getUserBookmarks = async (page = 1, limit = 24) => {
  const offset = (page - 1) * limit;
  const { data, error } = await supabase
    .rpc('get_user_bookmarks', { 
      limit_count: limit, 
      offset_count: offset 
    });
  return { data, error };
};

// View tracking helper functions
export const trackTenderView = async (tenderOcid: string) => {
  try {
    // Get auth token if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    const authToken = session?.access_token;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const { data, error } = await supabase.functions.invoke('track-view', {
      body: {
        tenderOcid,
        userAgent: navigator.userAgent
      }
    });

    if (error) {
      console.error('Failed to track view:', error);
      return { success: false, viewCount: 0 };
    }

    return {
      success: data.success,
      viewCount: data.viewCount,
      viewRecorded: data.viewRecorded
    };
  } catch (error) {
    console.error('Error tracking view:', error);
    return { success: false, viewCount: 0 };
  }
};

export const getTenderViewStats = async (tenderOcid: string) => {
  const { data, error } = await supabase
    .rpc('get_tender_view_stats', { p_tender_ocid: tenderOcid });
  return { data: data?.[0] || null, error };
};

export const getPopularTenders = async (limit = 10, daysBack = 7) => {
  const { data, error } = await supabase
    .rpc('get_popular_tenders', { 
      limit_count: limit, 
      days_back: daysBack 
    });
  return { data, error };
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
        error: connectivityError 
      };
    }

    // Test data integrity
    const { data: integrityResults, error: integrityError } = await supabase
      .rpc('validate_data_integrity');

    if (integrityError) {
      console.warn('Data integrity check failed:', integrityError);
    }

    // Test statistics function
    const { data: stats, error: statsError } = await supabase
      .rpc('get_tender_stats_cached');

    if (statsError) {
      console.warn('Statistics function failed:', statsError);
    }

    return {
      status: 'healthy',
      message: 'All systems operational',
      checks: {
        connectivity: !connectivityError,
        dataIntegrity: integrityResults || [],
        statistics: !statsError,
        stats: stats?.[0] || null
      }
    };
  } catch (error) {
    return {
      status: 'error',
      message: 'Health check failed',
      error
    };
  }
};

// Function to manually trigger data sync (for admin use)
export const triggerDataSync = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('scheduler', {
      method: 'POST'
    });

    if (error) {
      throw new Error(`Sync failed: ${error.message}`);
    }

    return { success: true, data };
  } catch (error) {
    console.error('Manual sync failed:', error);
    return { success: false, error };
  }
};