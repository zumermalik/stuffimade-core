import { createClient } from '@supabase/supabase-js';

// We ensure these variables exist to prevent silent crashes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// This creates a single, reusable connection to your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);