import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../environments/supabase';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;
export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabase;
}

export default getSupabaseClient();
