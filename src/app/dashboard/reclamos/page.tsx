export default function ReclamosPage() {
  const tickets: Array<Record<string, string>> = [];
  const reservas: Array<Record<string, string>> = [];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Reclamos & Áreas Comunes</h1>
          <p className="text-sm text-muted">
            Mesa de ayuda para incidentes, mantenimiento y calendario de reservas del consorcio.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-card border border-border text-foreground text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-muted-bg transition-colors shadow-xs cursor-pointer">
            + Nueva Reserva SUM
          </button>
          <button className="bg-brand text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-hover transition-colors shadow-xs cursor-pointer">
            + Crear Ticket
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-card rounded-xl border border-border shadow-xs">
          <span className="text-xs text-muted font-medium">Tickets Activos</span>
          <p className="text-2xl font-bold mt-1 text-foreground">{tickets.length}</p>
          <span className="text-[11px] text-muted font-medium">Sin reclamos cargados</span>
        </div>
        <div className="p-4 bg-card rounded-xl border border-border shadow-xs">
          <span className="text-xs text-muted font-medium">Tiempo Promedio Resolución</span>
          <p className="text-2xl font-bold mt-1 text-brand">Sin datos</p>
          <span className="text-[11px] text-muted font-medium">Aún no hay resoluciones</span>
        </div>
        <div className="p-4 bg-card rounded-xl border border-border shadow-xs">
          <span className="text-xs text-muted font-medium">Reservas de SUM este mes</span>
          <p className="text-2xl font-bold mt-1 text-foreground">{reservas.length}</p>
          <span className="text-[11px] text-muted font-medium">Sin reservas cargadas</span>
        </div>
      </div>

      {/* Section 1: Maintenance Tickets */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-xs">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-foreground">Tickets de Mantenimiento</h3>
            <p className="text-xs text-muted">Reportes de vecinos y encargados</p>
          </div>
          <span className="text-xs text-muted">Mostrando {tickets.length} tickets</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted-bg/60 text-muted border-b border-border font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">ID / Unidad</th>
                <th className="px-5 py-3">Asunto del Reclamo</th>
                <th className="px-5 py-3">Categoría</th>
                <th className="px-5 py-3">Prioridad</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3">Fecha</th>
                <th className="px-5 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {tickets.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-muted">Todavía no hay reclamos cargados.</td></tr>
              ) : tickets.map((t) => (
                <tr key={t.id} className="hover:bg-muted-bg/30 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-bold font-mono text-[11px] text-brand">{t.id}</p>
                    <p className="text-muted font-medium">{t.unidad}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-foreground">{t.asunto}</p>
                    <p className="text-[11px] text-muted">Reportado por: {t.solicitante}</p>
                  </td>
                  <td className="px-5 py-4 text-muted">{t.categoria}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        t.prioridad === "Alta"
                          ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400"
                          : t.prioridad === "Media"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                          : "bg-muted-bg text-muted"
                      }`}
                    >
                      {t.prioridad}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        t.estado === "Resuelto"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400"
                          : t.estado === "En Proceso"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400"
                          : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
                      }`}
                    >
                      {t.estado}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-muted">{t.fecha}</td>
                  <td className="px-5 py-4 text-right">
                    <button className="text-brand font-semibold hover:underline cursor-pointer">
                      Gestionar →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: SUM & Amenities Reservations */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-xs">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-foreground">Próximas Reservas de Espacios Comunes</h3>
            <p className="text-xs text-muted">Control de turnos de SUM, parrillas y piscina</p>
          </div>
          <span className="text-xs text-muted">{reservas.length} reservas programadas</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted-bg/60 text-muted border-b border-border font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Espacio Reservado</th>
                <th className="px-5 py-3">Unidad / Vecino</th>
                <th className="px-5 py-3">Fecha y Horario</th>
                <th className="px-5 py-3">Garantía Limpieza</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {reservas.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-muted">Todavía no hay reservas cargadas.</td></tr>
              ) : reservas.map((r) => (
                <tr key={r.id} className="hover:bg-muted-bg/30 transition-colors">
                  <td className="px-5 py-4 font-semibold text-foreground">{r.espacio}</td>
                  <td className="px-5 py-4 text-muted">{r.unidad}</td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-foreground">{r.fecha}</p>
                    <p className="text-[11px] text-muted">{r.horario}</p>
                  </td>
                  <td className="px-5 py-4 text-muted">{r.depositoGarantia}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        r.estado === "Confirmada"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400"
                      }`}
                    >
                      {r.estado}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button className="text-brand font-semibold hover:underline cursor-pointer">
                      Ver Ficha →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}