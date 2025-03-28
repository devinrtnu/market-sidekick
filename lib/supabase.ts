import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'example-key-for-testing';

// Create Supabase client for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Type definition for Put-Call Ratio data in database
export interface PutCallRatioRecord {
  id?: number;
  date: string;
  ratio_value: number;
  status: 'normal' | 'warning' | 'danger';
  created_at?: string;
  updated_at?: string;
} 