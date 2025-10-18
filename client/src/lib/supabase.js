// Supabase integration
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if Supabase is configured
const isSupabaseConfigured = supabaseUrl && supabaseKey && 
  supabaseUrl !== 'your_supabase_project_url' && 
  supabaseKey !== 'your_supabase_anon_key'

if (!isSupabaseConfigured) {
  console.warn('Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file');
}

// Only create Supabase client if properly configured
export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseKey) : null

// Supabase authentication functions
export const signIn = async (email, password) => {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: { message: 'Supabase not configured' } };
  }
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  } catch (error) {
    return { data: null, error: { message: error.message } };
  }
};

export const signUp = async (email, password) => {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: { message: 'Supabase not configured' } };
  }
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  } catch (error) {
    return { data: null, error: { message: error.message } };
  }
};

export const signInWithGoogle = async () => {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: { message: 'Supabase not configured' } };
  }
  
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    return { data, error };
  } catch (error) {
    return { data: null, error: { message: error.message } };
  }
};

export const signInWithMicrosoft = async () => {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: { message: 'Supabase not configured' } };
  }
  
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
    });
    return { data, error };
  } catch (error) {
    return { data: null, error: { message: error.message } };
  }
};

export const signOut = async () => {
  if (!isSupabaseConfigured || !supabase) {
    return { error: { message: 'Supabase not configured' } };
  }
  
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (error) {
    return { error: { message: error.message } };
  }
};

export const getCurrentUser = async () => {
  if (!isSupabaseConfigured || !supabase) {
    return { user: null };
  }
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return { user };
  } catch (error) {
    console.error('Error getting current user:', error);
    return { user: null };
  }
};
