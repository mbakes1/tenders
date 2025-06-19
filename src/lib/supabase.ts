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