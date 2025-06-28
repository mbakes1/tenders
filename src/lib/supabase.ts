import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

// Admin helper functions
export const checkAdminStatus = async () => {
  const { data, error } = await supabase.rpc('is_admin');
  return { isAdmin: data || false, error };
};

export const getAdminStats = async () => {
  const { data, error } = await supabase.rpc('get_admin_stats');
  return { data: data?.[0] || null, error };
};

export const getRecentActivity = async (limit = 10) => {
  const { data, error } = await supabase.rpc('get_recent_activity', { limit_count: limit });
  return { data: data || [], error };
};

// Tender data functions - Updated to query database directly
export const getTenders = async (page: number, search: string, limit: number) => {
  try {
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('tenders')
      .select('*', { count: 'exact' })
      .order('close_date', { ascending: true, nullsFirst: false });

    // Apply search filter if provided
    if (search && search.trim()) {
      query = query.textSearch('title,description,buyer,department,category', search.trim(), {
        type: 'websearch',
        config: 'english'
      });
    }

    // Filter for open tenders only (close_date in the future or null)
    const now = new Date().toISOString();
    query = query.or(`close_date.gte.${now},close_date.is.null`);

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch tenders: ${error.message}`);
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return {
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  } catch (error) {
    console.error('Error fetching tenders:', error);
    throw error;
  }
};

export const getTenderByOcid = async (ocid: string) => {
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('You must be signed in to bookmark tenders');
    }

    // Check if tender exists first
    const { data: tenderExists } = await supabase
      .from('tenders')
      .select('ocid')
      .eq('ocid', tenderOcid.trim())
      .single();

    if (!tenderExists) {
      throw new Error('Tender not found');
    }

    // Check if already bookmarked
    const { data: existingBookmark } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('tender_ocid', tenderOcid.trim())
      .single();

    if (existingBookmark) {
      return { data: existingBookmark, error: null }; // Already bookmarked, return success
    }

    // Add bookmark
    const { data, error } = await supabase
      .from('bookmarks')
      .insert({ 
        tender_ocid: tenderOcid.trim(), 
        user_id: user.id 
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return { data: null, error: null }; // Already bookmarked, treat as success
      }
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('You must be signed in to manage bookmarks');
    }

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

export const getUserBookmarks = async (page = 1, limit = 24) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('You must be signed in to view bookmarks');
    }

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

// View tracking helper functions
export const trackTenderView = async (tenderOcid: string) => {
  try {
    // Validate OCID
    if (!tenderOcid || typeof tenderOcid !== 'string' || tenderOcid.trim().length === 0) {
      return { success: false, viewCount: 0 };
    }

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
        tenderOcid: tenderOcid.trim(),
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

    // Test statistics function
    const { data: stats, error: statsError } = await supabase
      .rpc('get_tender_stats');

    if (statsError) {
      console.warn('Statistics function failed:', statsError);
    }

    return {
      status: 'healthy',
      message: 'All systems operational',
      checks: {
        connectivity: !connectivityError,
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