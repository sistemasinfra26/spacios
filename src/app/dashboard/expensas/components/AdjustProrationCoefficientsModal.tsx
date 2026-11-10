"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { updateBuildingUnitCoefficients } from "@/app/actions/units";
import { UnitType } from "@prisma/client";

export interface ProrationUnitItem {
  unitId: string;
  unitNumber: string;
  floor: number | null;
  door?: string | null;
  unitType?: UnitType;
  ownerName: string;
  tenantName?: string | null;
  coefficient: number;
  totalPayable?: number;
}

export interface AdjustProrationCoefficientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  buildingId: string;
  buildingName: string;
  units: ProrationUnitItem[];
}

const TYPE_NAMES: Record<UnitType, string> = {
  [UnitType.DEPARTAMENTO]: "Departamento",
  [UnitType.COCHERA]: "Cochera",
  [UnitType.BAULERA]: "Baulera",
  [UnitType.LOCAL]: "Local Comercial",
  [UnitType.OTRO]: "Otro",
};

export function AdjustProrationCoefficientsModal({
  isOpen,
  onClose,
  buildingId,
  buildingName,
  units,
}: AdjustProrationCoefficientsModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Mapa local de coeficientes editables
  const [coefficients, setCoefficients] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const u of units) {
      map[u.unitId] = u.coefficient;
    }
    return map;
  });

  // Herramienta de asignación rápida por grupo
  const [targetGroup, setTargetGroup] = useState<string>("LOCAL");
  const [groupPercentValue, setGroupPercentValue] = useState<string>("");

  if (!isOpen) return null;

  // Cálculo de suma total en tiempo real
  const totalSum = Number(
    Object.values(coefficients)
      .reduce((acc, val) => acc + (isNaN(val) ? 0 : val), 0)
      .toFixed(4)
  );

  const isBalanced = Math.abs(totalSum - 100) < 0.01;

  // Lista de pisos únicos existentes
  const uniqueFloors = Array.from(
    new Set(
      units
        .map((u) => u.floor)
        .filter((f): f is number => f !== null && f !== undefined)
    )
  ).sort((a, b) => a - b);

  const handleCoefficientChange = (unitId: string, val: string) => {
    const parsed = parseFloat(val);
    setCoefficients((prev) => ({
      ...prev,
      [unitId]: isNaN(parsed) ? 0 : parsed,
    }));
  };

  // Asignar un valor a un grupo específico (ej: a todos los locales, o a un piso)
  const handleApplyToGroup = () => {
    const val = parseFloat(groupPercentValue);
    if (isNaN(val) || val < 0) {
      setError("Ingresa un porcentaje válido mayor o igual a 0.");
      return;
    }
    setError(null);

    setCoefficients((prev) => {
      const next = { ...prev };
      for (const u of units) {
        if (targetGroup === "LOCAL" && u.unitType === UnitType.LOCAL) {
          next[u.unitId] = val;
        } else if (targetGroup === "DEPARTAMENTO" && u.unitType === UnitType.DEPARTAMENTO) {
          next[u.unitId] = val;
        } else if (targetGroup === "COCHERA" && u.unitType === UnitType.COCHERA) {
          next[u.unitId] = val;
        } else if (targetGroup.startsWith("FLOOR_")) {
          const floorNum = parseInt(targetGroup.replace("FLOOR_", ""), 10);
          if (u.floor === floorNum) {
            next[u.unitId] = val;
          }
        }
      }
      return next;
    });
  };

  // Distribuir el porcentaje restante equitativamente entre los departamentos
  const handleDistributeRemaining = () => {
    setError(null);
    const nonDeptSum = units
      .filter((u) => u.unitType !== UnitType.DEPARTAMENTO)
      .reduce((sum, u) => sum + (coefficients[u.unitId] || 0), 0);

    const remainingForDepts = Math.max(0, 100 - nonDeptSum);
    const deptUnits = units.filter((u) => u.unitType === UnitType.DEPARTAMENTO);

    if (deptUnits.length === 0) {
      setError("No hay departamentos en este consorcio para distribuir el restante.");
      return;
    }

    const share = Number((remainingForDepts / deptUnits.length).toFixed(4));
    setCoefficients((prev) => {
      const next = { ...prev };
      for (const du of deptUnits) {
        next[du.unitId] = share;
      }
      return next;
    });
  };

  // Equidistribuir 100% entre todas las unidades
  const handleDistributeAllEvenly = () => {
    setError(null);
    if (units.length === 0) return;
    const share = Number((100 / units.length).toFixed(4));
    setCoefficients(() => {
      const next: Record<string, number> = {};
      for (const u of units) {
        next[u.unitId] = share;
      }
      return next;
    });
  };

  const handleSave = () => {
    setError(null);

    const payload = Object.entries(coefficients).map(([unitId, coeff]) => ({
      unitId,
      coefficient: Math.max(0, Number(coeff)),
    }));

    startTransition(async () => {
      const res = await updateBuildingUnitCoefficients(buildingId, payload);
      if (!res.success) {
        setError(res.error || "No se pudieron actualizar los coeficientes.");
      } else {
        onClose();
        router.refresh();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-4xl my-4 sm:my-8 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden text-foreground">
        {/* Header */}
        <div className="sticky top-0 z-20 px-6 py-4 bg-card/95 backdrop-blur-sm border-b border-border flex items-center justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">⚖️</span>
              <h2 className="text-lg font-bold text-foreground">
                Configurar Coeficientes y Prorrateo Flexible
              </h2>
            </div>
            <p className="text-xs text-muted mt-0.5">
              Consorcio: <strong>{buildingName}</strong> • Asigna el porcentaje de gastos que corresponde a cada local, departamento o piso.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-muted hover:text-foreground rounded-lg hover:bg-muted-bg transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        <div className="p-6 space-y-6">
          {/* Barra de Herramientas de Asignación Rápida */}
          <div className="p-4 bg-muted-bg/50 border border-border rounded-2xl space-y-3">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider block">
              Herramienta de Asignación Rápida por Grupo / Medida
            </span>
            <p className="text-xs text-muted">
              Si los locales o ciertos pisos tienen medidas distintas a los demás, puedes definir un porcentaje fijo para ese grupo y distribuir el resto.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-muted">Grupo:</label>
                <select
                  value={targetGroup}
                  onChange={(e) => setTargetGroup(e.target.value)}
                  className="bg-background border border-border rounded-xl px-3 py-1.5 text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/40"
                >
                  <option value="LOCAL">🏪 Locales Comerciales</option>
                  <option value="DEPARTAMENTO">🏢 Departamentos</option>
                  <option value="COCHERA">🚗 Cocheras</option>
                  {uniqueFloors.map((fl) => (
                    <option key={fl} value={`FLOOR_${fl}`}>
                      Piso {fl} (Todas sus unidades)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-muted">Porcentaje (% c/u):</label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  max="100"
                  placeholder="Ej: 15.0"
                  value={groupPercentValue}
                  onChange={(e) => setGroupPercentValue(e.target.value)}
                  className="w-24 bg-background border border-border rounded-xl px-3 py-1.5 text-xs font-semibold text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/40"
                />
              </div>

              <button
                type="button"
                onClick={handleApplyToGroup}
                className="px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Aplicar a este Grupo
              </button>

              <button
                type="button"
                onClick={handleDistributeRemaining}
                className="px-3 py-1.5 border border-border hover:bg-muted-bg text-foreground text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
                title="Repartir lo que falta para llegar a 100% equitativamente entre los departamentos"
              >
                Distribuir Restante a Departamentos
              </button>

              <button
                type="button"
                onClick={handleDistributeAllEvenly}
                className="px-3 py-1.5 border border-border hover:bg-muted-bg text-muted hover:text-foreground text-xs font-medium rounded-xl transition-all cursor-pointer"
                title="Dividir en partes iguales entre todas las unidades"
              >
                Dividir Todo Equitativo
              </button>
            </div>
          </div>

          {/* Estado del Balance Total */}
          <div className="p-4 bg-card border border-border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-muted uppercase tracking-wider">
                Total Acumulado de Coeficientes:
              </span>
              <span className="text-2xl font-black text-foreground">
                {totalSum.toFixed(3)}%
              </span>
              <span className="text-xs text-muted">de 100.000%</span>
            </div>

            <div>
              {isBalanced ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  <span>✓</span>
                  <span>100% Balanceado</span>
                </span>
              ) : totalSum > 100.01 ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30">
                  <span>⚠️</span>
                  <span>Excede el 100% (+{(totalSum - 100).toFixed(3)}%)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  <span>⚠️</span>
                  <span>Faltan asignar {(100 - totalSum).toFixed(3)}%</span>
                </span>
              )}
            </div>
          </div>

          {/* Tabla de Unidades para Ajuste Directo */}
          <div className="border border-border rounded-2xl overflow-hidden shadow-xs">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-muted-bg text-muted border-b border-border font-bold uppercase text-[10px] tracking-wider z-10">
                  <tr>
                    <th className="py-2.5 px-4">Unidad</th>
                    <th className="py-2.5 px-4">Tipo</th>
                    <th className="py-2.5 px-4">Piso / Dpto</th>
                    <th className="py-2.5 px-4">Ocupante / Titular</th>
                    <th className="py-2.5 px-4 text-right">Coeficiente (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-foreground">
                  {units.map((unit) => {
                    const currentVal = coefficients[unit.unitId] ?? unit.coefficient;
                    const typeLabel = unit.unitType ? TYPE_NAMES[unit.unitType] : "Departamento";

                    return (
                      <tr key={unit.unitId} className="hover:bg-muted-bg/30 transition-colors">
                        <td className="py-2.5 px-4 font-bold text-foreground">
                          U.F. {unit.unitNumber}
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              unit.unitType === UnitType.LOCAL
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : unit.unitType === UnitType.COCHERA
                                ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                                : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                            }`}
                          >
                            {typeLabel}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-muted">
                          {unit.floor !== null && unit.floor !== undefined ? `Piso ${unit.floor}` : "PB"}
                          {unit.door ? ` • Dpto ${unit.door}` : ""}
                        </td>
                        <td className="py-2.5 px-4 text-muted">
                          {unit.tenantName || unit.ownerName}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1 justify-end">
                            <input
                              type="number"
                              step="0.001"
                              min="0"
                              max="100"
                              value={currentVal}
                              onChange={(e) => handleCoefficientChange(unit.unitId, e.target.value)}
                              className="w-24 bg-background border border-border rounded-xl px-2.5 py-1 text-xs font-bold text-right text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/40"
                            />
                            <span className="text-xs font-bold text-muted">%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-muted hover:text-foreground hover:bg-muted-bg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <span>💾</span>
              <span>{isPending ? "Guardando..." : "Guardar Coeficientes y Recalcular"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

