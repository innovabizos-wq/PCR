import LoginScreen from './features/auth/LoginScreen';
import { AuthProvider, useAuth } from './features/auth/AuthProvider';
import { CompanyProvider } from './features/company/CompanyContext';
import AppWorkspace from './features/app/AppWorkspace';
import { supabaseInitializationError } from './lib/supabase';

const logoUrl = `${import.meta.env.BASE_URL}logo.png`;

function SupabaseConfigErrorScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] px-4 text-white">
      <div className="w-full max-w-[640px] rounded-2xl border border-red-500/40 bg-[#0c0d10] p-8">
        <h1 className="mb-3 text-lg font-bold">Configuración de Supabase incompleta</h1>
        <p className="text-sm text-red-300">{message}</p>
        <p className="mt-4 text-xs text-gray-400">Crea o corrige tu archivo .env.local y reinicia el servidor de desarrollo.</p>
      </div>
    </div>
  );
}

function AppShell() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm font-semibold">Cargando sesión…</div>;
  }

  if (!user) {
    return <LoginScreen logoUrl={logoUrl} />;
  }

  return (
    <CompanyProvider>
      <AppWorkspace />
    </CompanyProvider>
  );
}

export default function App() {
  if (supabaseInitializationError) {
    return <SupabaseConfigErrorScreen message={supabaseInitializationError} />;
  }

  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
