const weekDays = ['Lun 15', 'Mar 16', 'Mie 17', 'Jue 18', 'Vie 19', 'Sab 20', 'Dom 21'];

const rows = [
  {
    resource: 'Juan Pérez',
    role: 'Chofer Pesado',
    load: '95%',
    tone: 'green',
    assignments: ['Zona Norte · Ruta 104', '', 'Zona Norte · Ruta 105', 'Zona Norte · Ruta 106', 'Zona Norte · Ruta 107', 'LIBRE', 'LIBRE']
  },
  {
    resource: 'María R.',
    role: 'Camión Liviano',
    load: '110%',
    tone: 'red',
    assignments: ['', 'Conflicto de carga', 'Zona Sur · Ruta 201', 'Zona Sur · Ruta 202', 'Zona Sur · Ruta 203', 'Zona Sur · Ruta 204', 'LIBRE']
  },
  {
    resource: 'Equipo 1',
    role: 'Instalación',
    load: '100%',
    tone: 'orange',
    assignments: ['Instalación · Techo', 'Instalación · Techo', '', 'Instalación · Zacate', '', '', 'LIBRE']
  }
] as const;

const loadTone: Record<string, string> = {
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  orange: 'bg-orange-100 text-orange-700'
};

const assignmentTone = (value: string): string => {
  if (!value) return 'border-2 border-dashed border-gray-200 bg-white';
  if (value === 'LIBRE') return 'bg-gray-100 text-gray-500';
  if (value.includes('Conflicto')) return 'bg-red-100 border border-red-300 text-red-800';
  if (value.includes('Zona Norte')) return 'bg-blue-100 border-l-4 border-blue-500 text-blue-900';
  if (value.includes('Zona Sur')) return 'bg-teal-100 border-l-4 border-teal-500 text-teal-900';
  return 'bg-orange-100 border-l-4 border-orange-500 text-orange-900';
};

export default function DispatchPlannerPage() {
  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#00011a]">Planificador Operativo</h2>
            <p className="text-sm text-gray-500">Despacho e instalaciones por recurso y día.</p>
          </div>
          <button className="rounded-lg bg-[#00011a] px-4 py-2 text-sm font-bold text-white">Publicar rutas</button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-4 flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-800">Zona Norte</span>
          <span className="rounded-full bg-teal-100 px-3 py-1 text-teal-800">Zona Sur</span>
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-indigo-800">Entrega especial</span>
          <span className="rounded-full bg-orange-100 px-3 py-1 text-orange-800">Instalación</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50">
                <th className="sticky left-0 bg-gray-50 px-3 py-3 text-left text-gray-600 border border-gray-200 min-w-56">Recurso / Equipo</th>
                {weekDays.map((day) => (
                  <th key={day} className="px-3 py-3 text-center text-gray-600 border border-gray-200 min-w-32">{day}</th>
                ))}
                <th className="sticky right-0 bg-gray-50 px-3 py-3 text-center text-gray-600 border border-gray-200 min-w-24">Carga</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.resource} className="hover:bg-gray-50">
                  <td className="sticky left-0 bg-white border border-gray-200 px-3 py-2">
                    <p className="font-semibold text-gray-900">{row.resource}</p>
                    <p className="text-[11px] text-gray-500">{row.role}</p>
                  </td>
                  {row.assignments.map((assignment, idx) => (
                    <td key={`${row.resource}-${idx}`} className="border border-gray-200 p-1">
                      <div className={`flex h-12 items-center rounded px-2 font-semibold ${assignmentTone(assignment)}`}>
                        {assignment || '+'}
                      </div>
                    </td>
                  ))}
                  <td className="sticky right-0 bg-white border border-gray-200 px-2 py-2 text-center">
                    <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${loadTone[row.tone]}`}>{row.load}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase text-gray-500">Total entregas</p>
          <p className="text-3xl font-extrabold text-[#00011a]">142</p>
        </article>
        <article className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase text-gray-500">Conflictos</p>
          <p className="text-3xl font-extrabold text-red-600">1</p>
        </article>
        <article className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase text-gray-500">Eficiencia global</p>
          <p className="text-3xl font-extrabold text-green-600">98%</p>
        </article>
      </div>
    </section>
  );
}
