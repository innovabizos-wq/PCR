import { FormEvent, useState } from 'react';
import { useAuth } from './AuthProvider';

interface LoginScreenProps {
  logoUrl: string;
}

export default function LoginScreen({ logoUrl }: LoginScreenProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setError('');
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible iniciar sesión.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] px-4 text-white">
      <div className="w-full max-w-[440px] rounded-2xl border border-white/10 bg-[#0c0d10] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
        <div className="mb-8 flex justify-center">
          <img src={logoUrl} alt="Policarbonato CR" className="h-20" />
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-3 text-xs text-cyan-100">
            <p className="font-semibold uppercase tracking-[0.15em]">Acceso inicial</p>
            <p className="mt-1">Correo: <span className="font-bold">prueba@correo.com</span></p>
            <p>Contraseña: <span className="font-bold">Prueba1234</span></p>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@empresa.com"
              className="h-12 w-full rounded-lg border border-white/25 bg-transparent px-4 text-sm text-white outline-none transition focus:border-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-12 w-full rounded-lg border border-white/10 bg-[#14161b] px-4 text-sm text-white outline-none transition focus:border-white"
            />
          </div>

          {error && <p className="text-sm font-medium text-red-500">{error}</p>}

          <button
            type="submit"
            className="mt-2 flex h-12 w-full items-center justify-center rounded-lg bg-white text-sm font-bold uppercase tracking-[0.25em] text-black transition hover:bg-gray-200"
          >
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}
