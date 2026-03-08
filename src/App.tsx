import LoginScreen from './features/auth/LoginScreen';
import { AuthProvider, useAuth } from './features/auth/AuthProvider';
import { CompanyProvider } from './features/company/CompanyContext';
import AppWorkspace from './features/app/AppWorkspace';

const logoUrl = `${import.meta.env.BASE_URL}logo.png`;

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
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
