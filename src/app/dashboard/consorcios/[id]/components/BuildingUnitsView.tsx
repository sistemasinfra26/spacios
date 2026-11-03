"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteUnit } from "@/app/actions/units";
import { UnitModal, type UnitData } from "./UnitModal";
import { UnitType } from "@prisma/client";

interface BuildingData {
  id: string;
  name: string;
  address: string;
  city: string;
}

interface UnitRecord {
  id: string;
  buildingId: string;
  organizationId: string | null;
  name: string | null;
  code: string | null;
  type: UnitType;
  number: string;
  floor: number | null;
  door: string | null;
  coefficient: number;
  ownerName: string | null;
  ownerEmail: string | null;
  ownerPhone: string | null;
  tenantName: string | null;
  tenantEmail: string | null;
  tenantPhone: string | null;
  receipts?: Array<{ id: string; paymentStatus: string; totalPayable: unknown }>;
}

interface StatsData {
  totalUnits: number;
  totalCoefficient: number;
  remainingCoefficient: number;
  isBalanced: boolean;
  typeCounts: Record<string, number>;
}

const TYPE_BADGES: Record<UnitType, { label: string; bg: string; text: string }> = {
  [UnitType.DEPARTAMENTO]: {
    label: "Departamento",
    bg: "bg-blue-100 dark:bg-blue-950/60",
    text: "text-blue-800 dark:text-blue-400",
  },
  [UnitType.COCHERA]: {
    label: "Cochera",
    bg: "bg-purple-100 dark:bg-purple-950/60",
    text: "text-purple-800 dark:text-purple-400",
  },
  [UnitType.BAULERA]: {
    label: "Baulera",
    bg: "bg-amber-100 dark:bg-amber-950/60",
    text: "text-amber-800 dark:text-amber-400",
  },
  [UnitType.LOCAL]: {
    label: "Local",
    bg: "bg-emerald-100 dark:bg-emerald-950/60",
    text: "text-emerald-800 dark:text-emerald-400",
  },
  [UnitType.OTRO]: {
    label: "Otro",
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-700 dark:text-slate-300",
  },
};

export function BuildingUnitsView({
  building,
  units,
  stats,
}: {
  building: BuildingData;
  units: UnitRecord[];
  stats: StatsData;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUnitForEdit, setSelectedUnitForEdit] = useState<UnitData | null>(null);

  // Filtros locales
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  const filteredUnits = units.filter((u) => {
    if (typeFilter !== "ALL" && u.type !== typeFilter) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchNumber = u.number.toLowerCase().includes(q);
      const matchName = (u.name || "").toLowerCase().includes(q);
      const matchOwner = (u.ownerName || "").toLowerCase().includes(q);
      const matchEmail = (u.ownerEmail || "").toLowerCase().includes(q);
      const matchTenant = (u.tenantName || "").toLowerCase().includes(q);
      return matchNumber || matchName || matchOwner || matchEmail || matchTenant;
    }
    return true;
  });

  const handleDelete = (unitId: string, unitNumber: string) => {
    if (!confirm(`¿Estás seguro de eliminar la unidad ${unitNumber}? Esta acción no se puede deshacer.`)) {
      return;
    }

    setActionError(null);
    setActionSuccess(null);

    startTransition(async () => {
      const res = await deleteUnit(unitId);
      if (!res.success) {
        setActionError(res.error || "No se pudo eliminar la unidad.");
      } else {
        setActionSuccess(res.message || `Unidad ${unitNumber} eliminada.`);
        router.refresh();
      }
    });
  };

  const handleOpenCreateModal = () => {
    setSelectedUnitForEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (u: UnitRecord) => {
    setSelectedUnitForEdit({
      id: u.id,
      buildingId: u.buildingId,
      name: u.name,
      code: u.code,
      type: u.type,
      number: u.number,
      floor: u.floor,
      door: u.door,
      coefficient: u.coefficient,
      ownerName: u.ownerName,
      ownerEmail: u.ownerEmail,
      ownerPhone: u.ownerPhone,
      tenantName: u.tenantName,
      tenantEmail: u.tenantEmail,
      tenantPhone: u.tenantPhone,
    });
    setIsModalOpen(true);
  };

  // Coeficiente Progress Bar Values
  const progressPercent = Math.min(100, Math.max(0, stats.totalCoefficient));
  const isOver100 = stats.totalCoefficient > 100.01;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted">
        <Link href="/dashboard/consorcios" className="hover:text-foreground transition-colors">
          ← Consorcios
        </Link>
        <span>/</span>
        <span className="text-foreground font-semibold">{building.name}</span>
        <span>/</span>
        <span>Unidades Funcionales</span>
      </div>

      {/* Main Header */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold text-lg">
              🏢
            </span>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground">{building.name}</h1>
              <p className="text-xs text-muted mt-0.5">
                {building.address}, {building.city} • Padrón de Unidades y Porcentuales de Expensas
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/dashboard/expensas"
            className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted-bg transition-colors"
          >
            Ver Expensas →
          </Link>

          <button
            onClick={handleOpenCreateModal}
            className="bg-brand hover:bg-brand-hover text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-2"
          >
            <span className="text-sm font-black">+</span>
            <span>Nueva Unidad Funcional</span>
          </button>
        </div>
      </div>

      {/* Mensajes de Feedback */}
      {actionError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-medium">
          {actionError}
        </div>
      )}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
          {actionSuccess}
        </div>
      )}

      {/* Control de Coeficiente y Resumen General */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-muted uppercase tracking-wider">
              Control de Coeficiente de Prorrateo
            </span>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-2xl font-black text-foreground">
                {stats.totalCoefficient.toFixed(3)}%
              </span>
              <span className="text-sm text-muted font-medium">de 100.000%</span>

              {stats.isBalanced ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  ✓ 100% Balanceado
                </span>
              ) : isOver100 ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30">
                  ⚠️ Excede el 100% ({(stats.totalCoefficient - 100).toFixed(3)}% de más)
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  ⚠️ Faltan asignar {stats.remainingCoefficient.toFixed(3)}%
                </span>
              )}
            </div>
          </div>

          {/* Breakdown por tipo */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs bg-muted-bg text-foreground font-semibold px-3 py-1.5 rounded-xl border border-border">
              {stats.totalUnits} {stats.totalUnits === 1 ? "Unidad Total" : "Unidades Totales"}
            </span>
            {Object.entries(stats.typeCounts).map(([typeKey, count]) => {
              const badge = TYPE_BADGES[typeKey as UnitType] || TYPE_BADGES[UnitType.OTRO];
              return (
                <span
                  key={typeKey}
                  className={`text-xs font-semibold px-2.5 py-1.5 rounded-xl ${badge.bg} ${badge.text}`}
                >
                  {count} {badge.label}s
                </span>
              );
            })}
          </div>
        </div>

        {/* Barra de Progreso Visual */}
        <div className="space-y-1.5">
          <div className="w-full h-3 bg-muted-bg rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                stats.isBalanced
                  ? "bg-emerald-500"
                  : isOver100
                  ? "bg-red-500"
                  : "bg-brand"
              }`}
              style={{ width: `${Math.min(100, progressPercent)}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-muted">
            <span>0% asignado</span>
            <span>
              {stats.isBalanced
                ? "Las expensas se liquidarán de forma perfectamente proporcional"
                : stats.remainingCoefficient > 0
                ? `Resta asignar ${stats.remainingCoefficient.toFixed(2)}% entre las unidades`
                : "Ajusta los coeficientes para no superar el 100%"}
            </span>
            <span>100% total</span>
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="p-4 bg-card rounded-2xl border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Buscador */}
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Buscar por N° unidad, propietario o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/40"
          />
        </div>

        {/* Filtro por Tipo */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: "ALL", label: "Todas" },
            { id: UnitType.DEPARTAMENTO, label: "Deptos" },
            { id: UnitType.COCHERA, label: "Cocheras" },
            { id: UnitType.BAULERA, label: "Bauleras" },
            { id: UnitType.LOCAL, label: "Locales" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                typeFilter === tab.id
                  ? "bg-brand text-white shadow-xs"
                  : "text-muted hover:text-foreground hover:bg-muted-bg"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Unidades Funcionales */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-xs">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-foreground">Padrón de Unidades Funcionales</h3>
            <p className="text-xs text-muted mt-0.5">
              Mostrando {filteredUnits.length} de {units.length} unidades
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted-bg/60 text-muted border-b border-border font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3">Unidad / Identificación</th>
                <th className="px-5 py-3">Tipo</th>
                <th className="px-5 py-3">Piso & Puerta</th>
                <th className="px-5 py-3 text-center">Coeficiente %</th>
                <th className="px-5 py-3">Propietario / Contacto</th>
                <th className="px-5 py-3">Inquilino / Ocupante</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {filteredUnits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted">
                    <div className="max-w-xs mx-auto space-y-3">
                      <p className="text-3xl">🚪</p>
                      <p className="font-semibold text-foreground text-sm">
                        {units.length === 0
                          ? "Este edificio todavía no tiene unidades registradas"
                          : "No se encontraron unidades con ese filtro"}
                      </p>
                      <p className="text-xs text-muted">
                        Registra departamentos, cocheras o bauleras con su respectivo coeficiente para liquidar expensas.
                      </p>
                      <div className="pt-2">
                        <button
                          onClick={handleOpenCreateModal}
                          className="bg-brand hover:bg-brand-hover text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <span>+ Registrar Primera Unidad</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUnits.map((u) => {
                  const badge = TYPE_BADGES[u.type] || TYPE_BADGES[UnitType.OTRO];
                  return (
                    <tr key={u.id} className="hover:bg-muted-bg/30 transition-colors">
                      {/* Unidad */}
                      <td className="px-5 py-4 font-bold text-foreground">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center text-xs font-bold">
                            {u.number}
                          </span>
                          <div>
                            <p className="font-bold text-foreground">
                              {u.name || `U.F. ${u.number}`}
                            </p>
                            {u.code && (
                              <p className="text-[10px] text-muted font-mono font-normal">
                                {u.code}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Tipo */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badge.bg} ${badge.text}`}
                        >
                          {badge.label}
                        </span>
                      </td>

                      {/* Piso / Puerta */}
                      <td className="px-5 py-4 text-muted">
                        {u.floor !== null ? `Piso ${u.floor}` : "-"}
                        {u.door ? ` • Dpto ${u.door}` : ""}
                      </td>

                      {/* Coeficiente */}
                      <td className="px-5 py-4 text-center font-mono font-bold text-foreground text-sm">
                        {u.coefficient.toFixed(3)}%
                      </td>

                      {/* Propietario */}
                      <td className="px-5 py-4">
                        {u.ownerName ? (
                          <div>
                            <p className="font-semibold text-foreground">{u.ownerName}</p>
                            <div className="text-[11px] text-muted space-x-2">
                              {u.ownerEmail && (
                                <a
                                  href={`mailto:${u.ownerEmail}`}
                                  className="hover:text-brand hover:underline"
                                >
                                  {u.ownerEmail}
                                </a>
                              )}
                              {u.ownerPhone && <span>• {u.ownerPhone}</span>}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted italic text-[11px]">Sin asignar</span>
                        )}
                      </td>

                      {/* Inquilino */}
                      <td className="px-5 py-4">
                        {u.tenantName ? (
                          <div>
                            <p className="font-semibold text-foreground">{u.tenantName}</p>
                            <div className="text-[11px] text-muted space-x-2">
                              {u.tenantEmail && (
                                <a
                                  href={`mailto:${u.tenantEmail}`}
                                  className="hover:text-brand hover:underline"
                                >
                                  {u.tenantEmail}
                                </a>
                              )}
                              {u.tenantPhone && <span>• {u.tenantPhone}</span>}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted text-[11px]">-</span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(u)}
                            className="px-2.5 py-1 rounded-lg border border-border hover:bg-muted-bg text-foreground text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(u.id, u.number)}
                            disabled={isPending}
                            className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-500/10 transition-colors cursor-pointer text-xs disabled:opacity-50"
                            title="Eliminar unidad"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Creación / Edición */}
      <UnitModal
        buildingId={building.id}
        unit={selectedUnitForEdit}
        remainingCoefficient={stats.remainingCoefficient}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedUnitForEdit(null);
        }}
      />
    </div>
  );
}
