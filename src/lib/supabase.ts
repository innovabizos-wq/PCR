import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env, getMissingEnvMessage } from '../config/env';

let supabaseClient: SupabaseClient | null = null;
let supabaseInitializationError: string | null = null;

if (env.isSupabaseConfigured) {
  supabaseClient = createClient(env.supabaseUrl, env.supabaseAnonKey);
} else {
  supabaseInitializationError = getMissingEnvMessage();
  console.error(`❌ ${supabaseInitializationError}`);
}

export const supabase = supabaseClient;
export { supabaseInitializationError };

export const getSupabaseOrThrow = (): SupabaseClient => {
  if (!supabaseClient) {
    throw new Error(supabaseInitializationError ?? 'Supabase no está configurado.');
  }
  return supabaseClient;
};
