
import { createClient } from '@supabase/supabase-js';

// Access environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase URL or Key is missing in environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
