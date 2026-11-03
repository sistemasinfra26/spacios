"use client";

import { useState } from "react";
import Link from "next/link";
import { LiquidationStatus } from "@prisma/client";
import { NewLiquidationModal } from "./NewLiquidationModal";

export interface LiquidationListItem {
  id: string;
  buildingId: string;
  buildingName: string;
  buildingAddress: string;
  month: number;
  year: number;
  status: LiquidationStatus;
  dueDateFirst: Date | string;
  dueDateSecond: Date | string | null;
  interestRate: number | null;
  totalAmount: number;
  totalCollected: number;
  totalPending: number;
  itemsCount: number;
  receiptsCount: number;
  createdAt: Date | string;
}

interface BuildingOption {
  id: string;
  name: string;
  address: string;
  unitsCount?: number;
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export function LiquidationsTable({
  initialLiquidations,
  buildings,
}: {
  initialLiquidations: LiquidationListItem[];
  buildings: BuildingOption[];
}) {
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filteredLiquidations = initialLiquidations.filter((liq) => {
    if (selectedBuildingId !== "ALL" && liq.buildingId !== selectedBuildingId) {
      return false;
    }
    if (statusFilter !== "ALL" && liq.status !== statusFilter) {
      return false;
    }
    return true;
  });

  // KPI Calculations
  const totalBilled = filteredLiquidations.reduce((acc, l) => acc + l.totalAmount, 0);
  const totalCollected = filteredLiquidations.reduce((acc, l) => acc + l.totalCollected, 0);
  const totalPending = filteredLiquidations.reduce((acc, l) => acc + l.totalPending, 0);
  const activeDrafts = filteredLiquidations.filter((l) => l.status === LiquidationStatus.DRAFT).length;

  return (
    <div className="space-y-6">
      {/* Header & New Liquidation Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Liquidación de Expensas
          </h1>
          <p className="text-sm text-muted">
            Gestión integral de períodos, carga de facturas, prorrateo y cobranzas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <NewLiquidationModal
            buildings={buildings}
            selectedBuildingId={selectedBuildingId}
          />
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Liquidado */}
        <div className="p-5 bg-card rounded-2xl border border-border shadow-xs">
          <span className="text-xs font-semibold text-muted uppercase tracking-wider">
            Total Liquidado
          </span>
          <p className="text-2xl font-black mt-1 text-foreground">
            ${totalBilled.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-muted">
            {filteredLiquidations.length} períodos registrados
          </span>
        </div>

        {/* Total Cobrado / Recaudado */}
        <div className="p-5 bg-card rounded-2xl border border-border shadow-xs hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">
              Recaudación al Momento
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {totalBilled > 0 ? `${Math.round((totalCollected / totalBilled) * 100)}%` : "0%"}
            </span>
          </div>
          <p className="text-2xl font-black mt-1 text-emerald-600 dark:text-emerald-400">
            ${totalCollected.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-muted">Cobranzas imputadas</span>
        </div>

        {/* Saldo Pendiente */}
        <div className="p-5 bg-card rounded-2xl border border-border shadow-xs hover:border-amber-500/40 transition-all">
          <span className="text-xs font-semibold text-muted uppercase tracking-wider">
            Saldo Pendiente / Mora
          </span>
          <p className="text-2xl font-black mt-1 text-amber-500">
            ${totalPending.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-muted">A cobrar a copropietarios</span>
        </div>

        {/* Períodos en Borrador */}
        <div className="p-5 bg-card rounded-2xl border border-border shadow-xs bg-brand/5 border-brand/20">
          <span className="text-xs font-semibold text-brand uppercase tracking-wider">
            Borradores Abiertos
          </span>
          <p className="text-2xl font-black mt-1 text-brand">
            {activeDrafts} {activeDrafts === 1 ? "Período" : "Períodos"}
          </p>
          <span className="text-[11px] text-brand/80">Listos para cargar facturas</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 bg-card rounded-2xl border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Selector de Edificio / Consorcio */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-muted shrink-0">
            Filtrar por Consorcio:
          </label>
          <select
            value={selectedBuildingId}
            onChange={(e) => setSelectedBuildingId(e.target.value)}
            className="bg-background border border-border rounded-xl px-3 py-1.5 text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/40"
          >
            <option value="ALL">🏢 Todos los Consorcios ({buildings.length})</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro de Estado */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: "ALL", label: "Todos" },
            { id: LiquidationStatus.DRAFT, label: "Borradores" },
            { id: LiquidationStatus.PUBLISHED, label: "Publicados" },
            { id: LiquidationStatus.CLOSED, label: "Cerrados" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-brand text-white shadow-xs"
                  : "text-muted hover:text-foreground hover:bg-muted-bg"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Liquidations Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-xs">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-base text-foreground">
            Períodos y Liquidaciones Registradas
          </h3>
          <span className="text-xs text-muted">
            Mostrando {filteredLiquidations.length} liquidaciones
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted-bg/60 text-muted border-b border-border font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3">Consorcio</th>
                <th className="px-5 py-3">Período</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3">1º Vto</th>
                <th className="px-5 py-3 text-right">Total Gastos</th>
                <th className="px-5 py-3">Recaudación</th>
                <th className="px-5 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {filteredLiquidations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted">
                    <div className="max-w-xs mx-auto space-y-3">
                      <p className="text-3xl">📋</p>
                      <p className="font-semibold text-foreground text-sm">
                        No hay liquidaciones en este filtro
                      </p>
                      <p className="text-xs text-muted">
                        Inicia una nueva liquidación de expensas para cargar facturas y prorratear los gastos.
                      </p>
                      <div className="pt-2">
                        <NewLiquidationModal
                          buildings={buildings}
                          selectedBuildingId={selectedBuildingId}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLiquidations.map((liq) => {
                  const periodLabel = `${MONTH_NAMES[liq.month - 1]} ${liq.year}`;
                  const percentCollected =
                    liq.totalAmount > 0 ? Math.min(100, Math.round((liq.totalCollected / liq.totalAmount) * 100)) : 0;

                  return (
                    <tr key={liq.id} className="hover:bg-muted-bg/30 transition-colors">
                      <td className="px-5 py-4 font-bold text-foreground">
                        <div>
                          <p>{liq.buildingName}</p>
                          <p className="text-[11px] font-normal text-muted truncate max-w-xs">
                            {liq.buildingAddress}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4 font-semibold text-foreground">
                        {periodLabel}
                      </td>

                      <td className="px-5 py-4">
                        {liq.status === LiquidationStatus.DRAFT && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400">
                            Borrador ({liq.itemsCount} gastos)
                          </span>
                        )}
                        {liq.status === LiquidationStatus.PUBLISHED && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                            Publicado ({liq.receiptsCount} UF)
                          </span>
                        )}
                        {liq.status === LiquidationStatus.CLOSED && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-muted-bg text-muted">
                            Cerrado
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-muted">
                        {new Date(liq.dueDateFirst).toLocaleDateString("es-AR")}
                      </td>

                      <td className="px-5 py-4 text-right font-black text-foreground">
                        ${liq.totalAmount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </td>

                      <td className="px-5 py-4 min-w-36">
                        {liq.status === LiquidationStatus.DRAFT ? (
                          <span className="text-[11px] text-muted italic">Sin emitir</span>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                ${liq.totalCollected.toLocaleString("es-AR")}
                              </span>
                              <span className="text-muted font-bold">{percentCollected}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-muted-bg rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                                style={{ width: `${percentCollected}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/dashboard/expensas/${liq.id}`}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            liq.status === LiquidationStatus.DRAFT
                              ? "bg-brand text-white hover:bg-brand-hover shadow-xs"
                              : "border border-border hover:bg-muted-bg text-foreground"
                          }`}
                        >
                          <span>{liq.status === LiquidationStatus.DRAFT ? "Cargar Gastos →" : "Ver Detalle →"}</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
