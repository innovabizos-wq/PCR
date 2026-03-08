interface PublicEnv {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
}

const readEnvVar = (key: keyof PublicEnv): string => {
  const value = import.meta.env[key];
  return typeof value === 'string' ? value.trim() : '';
};

const supabaseUrl = readEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = readEnvVar('VITE_SUPABASE_ANON_KEY');

const missingPublicEnv = (Object.entries({
  VITE_SUPABASE_URL: supabaseUrl,
  VITE_SUPABASE_ANON_KEY: supabaseAnonKey
}) as Array<[keyof PublicEnv, string]>)
  .filter(([, value]) => !value)
  .map(([key]) => key);

export const env = {
  supabaseUrl,
  supabaseAnonKey,
  missingPublicEnv,
  isSupabaseConfigured: missingPublicEnv.length === 0
};

export const getMissingEnvMessage = (): string =>
  `Faltan variables de entorno para Supabase: ${env.missingPublicEnv.join(', ')}. Defínelas en .env.local y reinicia Vite.`;
