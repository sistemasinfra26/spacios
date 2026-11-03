import Link from "next/link";
import { Suspense } from "react";
import { syncUserWithPrisma } from "@/app/actions/users";
import { prisma } from "@/lib/prisma";

export default function DashboardPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Cargando panel...</p>}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  // 1. Sincroniza/Obtiene el usuario autenticado y su Tenant activo
  const user = await syncUserWithPrisma();

  if (!user || !user.tenantId) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted">No se encontró una administración activa asociada a tu cuenta.</p>
      </div>
    );
  }

  // 2. Consulta de métricas reales para el Tenant del usuario
  const [totalBuildings, totalUnits, pendingReceipts, openTickets] = await Promise.all([
    prisma.building.count({ where: { tenantId: user.tenantId } }),
    prisma.unit.count({ where: { building: { tenantId: user.tenantId } } }),
    prisma.expenseReceipt.findMany({
      where: {
        unit: { building: { tenantId: user.tenantId } },
        paymentStatus: { in: ["PENDING", "OVERDUE"] },
      },
      take: 5,
      include: {
        unit: {
          include: { owner: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.ticket.count({
      where: {
        building: { tenantId: user.tenantId },
        status: "OPEN",
      },
    }),
  ]);

  // Cálculo rápido de morosidad pendiente
  const totalMoraAmount = pendingReceipts.reduce(
    (acc, item) => acc + Number(item.totalPayable),
    0
  );

  return (
    <div className="space-y-8">
      {/* Page Title & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Panel de Control
          </h1>
          <p className="text-sm text-muted">
            Estado general del consorcio activo, recaudación y alquileres vigentes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/expensas"
            className="text-xs font-semibold px-3.5 py-2 rounded-lg bg-card border border-border hover:bg-muted-bg text-foreground transition-colors"
          >
            Emitir Liquidación
          </Link>
          <Link
            href="/dashboard/consorcios"
            className="text-xs font-semibold px-3.5 py-2 rounded-lg bg-brand hover:bg-brand-hover text-white transition-colors"
          >
            Administrar Consorcios
          </Link>
        </div>
      </div>

      {/* KPI Cards: Recaudación, Morosidad, Ocupación, Tickets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Consorcios / Edificios */}
        <div className="p-5 bg-card rounded-2xl border border-border shadow-xs hover:border-brand/40 transition-all">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Consorcios Activos
            </span>
            <span className="text-lg">🏢</span>
          </div>
          <p className="text-2xl font-extrabold mt-2 text-foreground">
            {totalBuildings}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-brand-accent font-medium">
            <span>●</span>
            <span>{totalUnits} Unidades funcionales</span>
          </div>
        </div>

        {/* Morosidad Acumulada */}
        <div className="p-5 bg-card rounded-2xl border border-border shadow-xs hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Morosidad Pendiente
            </span>
            <span className="text-lg">⚠️</span>
          </div>
          <p className="text-2xl font-extrabold mt-2 text-amber-500">
            ${totalMoraAmount.toLocaleString("es-AR")}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted">
            <span>{pendingReceipts.length} Unidades impagas</span>
          </div>
        </div>

        {/* Ocupación Alquileres */}
        <div className="p-5 bg-card rounded-2xl border border-border shadow-xs hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Ocupación Alquileres
            </span>
            <span className="text-lg">🔑</span>
          </div>
          <p className="text-2xl font-extrabold mt-2 text-foreground">Sin datos</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-brand-accent font-medium">
            <span>Sin unidades registradas</span>
          </div>
        </div>

        {/* Tickets Abiertos */}
        <div className="p-5 bg-card rounded-2xl border border-border shadow-xs hover:border-brand/40 transition-all">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Tickets & Reclamos
            </span>
            <span className="text-lg">🛠️</span>
          </div>
          <p className="text-2xl font-extrabold mt-2 text-brand">
            {openTickets} Abiertos
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted">
            <span>Mantenimiento activo</span>
          </div>
        </div>
      </div>

      {/* Operations Overview & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent payments / expensas */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h3 className="text-base font-bold text-foreground">
              Estado de Expensas Recientes
            </h3>
            <Link
              href="/dashboard/expensas"
              className="text-xs text-brand hover:underline font-medium"
            >
              Ver todas las expensas →
            </Link>
          </div>

          <div className="space-y-3">
            {pendingReceipts.length === 0 ? (
              <p className="text-xs text-muted py-4 text-center">
                No hay boletas de expensas pendientes de pago.
              </p>
            ) : (
              pendingReceipts.map((receipt) => (
                <div
                  key={receipt.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted-bg/50 border border-border"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                      {receipt.unit.number}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        U.F. {receipt.unit.number}
                      </p>
                      <p className="text-xs text-muted">
                        Propietario: {receipt.unit.owner?.firstName || "Sin Asignar"}{" "}
                        {receipt.unit.owner?.lastName || ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                      ${Number(receipt.totalPayable).toLocaleString("es-AR")}
                    </p>
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                      Pendiente
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick actions & Summary */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-xs space-y-5">
          <h3 className="text-base font-bold text-foreground pb-3 border-b border-border">
            Accesos Rápidos
          </h3>

          <div className="space-y-3">
            <Link
              href="/dashboard/consorcios"
              className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted-bg transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">🏢</span>
                <div className="text-left">
                  <p className="text-xs font-semibold text-foreground">
                    Edificios y Unidades
                  </p>
                  <p className="text-[11px] text-muted">Padrón de propietarios</p>
                </div>
              </div>
              <span className="text-xs text-brand font-medium">→</span>
            </Link>

            <Link
              href="/dashboard/alquileres"
              className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted-bg transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">🔑</span>
                <div className="text-left">
                  <p className="text-xs font-semibold text-foreground">
                    Contratos de Alquiler
                  </p>
                  <p className="text-[11px] text-muted">Ajustes ICL / IPC y avisos</p>
                </div>
              </div>
              <span className="text-xs text-brand font-medium">→</span>
            </Link>

            <Link
              href="/dashboard/expensas"
              className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted-bg transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">💵</span>
                <div className="text-left">
                  <p className="text-xs font-semibold text-foreground">
                    Liquidación de Expensas
                  </p>
                  <p className="text-[11px] text-muted">Gastos ordinarios y prorrateo</p>
                </div>
              </div>
              <span className="text-xs text-brand font-medium">→</span>
            </Link>

            <Link
              href="/dashboard/reclamos"
              className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted-bg transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">🛠️</span>
                <div className="text-left">
                  <p className="text-xs font-semibold text-foreground">
                    Tickets & SUM
                  </p>
                  <p className="text-[11px] text-muted">Mantenimiento y reservas</p>
                </div>
              </div>
              <span className="text-xs text-brand font-medium">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}