export default function AlquileresPage() {
  const contratos: Array<Record<string, string>> = [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Gestión de Alquileres</h1>
          <p className="text-sm text-muted">
            Control de contratos vigentes, indexaciones periódicas y rendiciones a propietarios.
          </p>
        </div>
        <button className="bg-brand text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-hover transition-colors shadow-xs cursor-pointer">
          + Nuevo Contrato
        </button>
      </div>

      {/* Contract Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-card rounded-xl border border-border shadow-xs">
          <span className="text-xs text-muted font-medium">Contratos Vigentes</span>
          <p className="text-2xl font-bold mt-1 text-foreground">{contratos.length}</p>
          <span className="text-[11px] text-muted font-medium">Contratos cargados</span>
        </div>
        <div className="p-4 bg-card rounded-xl border border-border shadow-xs">
          <span className="text-xs text-muted font-medium">Próximos a Vencer (30 días)</span>
          <p className="text-2xl font-bold mt-1 text-amber-500">0</p>
          <span className="text-[11px] text-muted font-medium">Sin vencimientos registrados</span>
        </div>
        <div className="p-4 bg-card rounded-xl border border-border shadow-xs">
          <span className="text-xs text-muted font-medium">Ajustes de Canon Este Mes</span>
          <p className="text-2xl font-bold mt-1 text-brand">0</p>
          <span className="text-[11px] text-muted font-medium">Sin ajustes registrados</span>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-xs">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-base text-foreground">Listado de Contratos Activos</h3>
          <span className="text-xs text-muted">Total: {contratos.length} contratos</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted-bg/60 text-muted border-b border-border font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Inmueble / Unidad</th>
                <th className="px-5 py-3">Inquilino</th>
                <th className="px-5 py-3">Canon Mensual</th>
                <th className="px-5 py-3">Ajuste / Índice</th>
                <th className="px-5 py-3">Vencimiento</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {contratos.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-muted">Todavía no hay contratos cargados.</td></tr>
              ) : contratos.map((c) => (
                <tr key={c.id} className="hover:bg-muted-bg/30 transition-colors">
                  <td className="px-5 py-4 font-semibold">{c.unidad}</td>
                  <td className="px-5 py-4">
                    <p className="font-medium">{c.inquilino}</p>
                    <p className="text-[11px] text-muted">Prop: {c.propietario}</p>
                  </td>
                  <td className="px-5 py-4 font-bold text-foreground">{c.monto}</td>
                  <td className="px-5 py-4">
                    <p className="font-medium">{c.indice}</p>
                    <p className="text-[11px] text-muted">Próx: {c.proximoAjuste}</p>
                  </td>
                  <td className="px-5 py-4 text-muted">{c.vencimiento}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        c.estado === "Al día"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400"
                      }`}
                    >
                      {c.estado}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button className="text-brand font-semibold hover:underline cursor-pointer">
                      Detalles →
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