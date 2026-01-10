/**
 * Supabase Client Singleton
 * 
 * Centralized Supabase client configuration for authentication and database operations.
 * Uses environment variables for secure credential management.
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration from environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!');
  console.error('Required: REACT_APP_SUPABASE_URL, REACT_APP_SUPABASE_ANON_KEY');
}

// Create Supabase client instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-application-name': 'rudraram-survey-app'
    }
  }
});

/**
 * Authentication Helpers
 */

// Sign in with email and password
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

// Sign up new user
export const signUp = async (email, password, metadata = {}) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  });
  return { data, error };
};

// Sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

// Get current session
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
};

// Get current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

/**
 * Database Helpers
 */

// Fetch devices with filters
export const fetchDevices = async (filters = {}) => {
  let query = supabase
    .from('devices')
    .select('*');
  
  // Apply filters
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.zone) {
    query = query.eq('zone', filters.zone);
  }
  if (filters.type) {
    query = query.eq('device_type', filters.type);
  }
  
  const { data, error } = await query;
  return { data, error };
};

// Insert new device
export const insertDevice = async (deviceData) => {
  const { data, error } = await supabase
    .from('devices')
    .insert([deviceData])
    .select();
  return { data, error };
};

// Update device
export const updateDevice = async (id, updates) => {
  const { data, error } = await supabase
    .from('devices')
    .update(updates)
    .eq('id', id)
    .select();
  return { data, error };
};

// Delete device
export const deleteDevice = async (id) => {
  const { error } = await supabase
    .from('devices')
    .delete()
    .eq('id', id);
  return { error };
};

/**
 * Real-time Subscriptions
 */

// Subscribe to device changes
export const subscribeToDevices = (callback) => {
  return supabase
    .channel('devices-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'devices'
    }, callback)
    .subscribe();
};

export default supabase;
