import { LockKeyhole } from 'lucide-react';

export default function AdminWorkspaceView() {
  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-[#00011a]">
          <LockKeyhole className="h-5 w-5" />
          Configuración del sistema
        </h2>
        <p className="text-sm text-gray-600">
          La administración de usuarios ahora se realiza con Supabase Auth y metadatos de acceso.
        </p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-700">
        <p className="font-semibold text-[#00011a]">Bootstrap de administrador</p>
        <p className="mt-2">
          Ejecuta <code className="rounded bg-gray-100 px-1 py-0.5">npm run auth:bootstrap-admin</code> para crear/actualizar
          el usuario inicial con rol <code className="rounded bg-gray-100 px-1 py-0.5">super_admin</code>.
        </p>
      </div>
    </section>
  );
}
