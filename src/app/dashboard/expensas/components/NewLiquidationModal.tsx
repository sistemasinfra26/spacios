"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createLiquidationPeriod } from "@/app/actions/expenses";
import { UnitType } from "@prisma/client";
import type { BuildingOption } from "./LiquidationsTable";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export function NewLiquidationModal({
  buildings,
  selectedBuildingId,
}: {
  buildings: BuildingOption[];
  selectedBuildingId?: string;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // 1-12
  const currentYear = currentDate.getFullYear();

  // Fechas de vencimiento sugeridas: día 10 y 20 del próximo mes
  const nextMonthDate = new Date(currentYear, currentMonth, 10);
  const nextMonthSecondDate = new Date(currentYear, currentMonth, 20);
  const defaultDueDate1 = nextMonthDate.toISOString().split("T")[0];
  const defaultDueDate2 = nextMonthSecondDate.toISOString().split("T")[0];

  const initialBuildingId =
    selectedBuildingId && selectedBuildingId !== "ALL"
      ? selectedBuildingId
      : (buildings[0]?.id || "");

  const [formData, setFormData] = useState({
    buildingId: initialBuildingId,
    month: currentMonth,
    year: currentYear,
    dueDateFirst: defaultDueDate1,
    dueDateSecond: defaultDueDate2,
    interestRate: 5,
    notes: "Expensas ordinarias del período en curso.",
  });

  // Unidades del edificio seleccionado
  const selectedBuilding = buildings.find((b) => b.id === formData.buildingId);
  const units = selectedBuilding?.units || [];

  // Coeficientes personalizados
  const [coefficients, setCoefficients] = useState<Record<string, number>>({});
  const [showCoefficients, setShowCoefficients] = useState(false);
  const [quickGroup, setQuickGroup] = useState<string>("LOCAL");
  const [quickPercent, setQuickPercent] = useState<string>("");

  useEffect(() => {
    if (selectedBuilding?.units) {
      const map: Record<string, number> = {};
      for (const u of selectedBuilding.units) {
        map[u.id] = u.coefficient;
      }
      setCoefficients(map);
    }
  }, [formData.buildingId, selectedBuilding]);

  const totalSum = Number(
    Object.values(coefficients)
      .reduce((acc, val) => acc + (isNaN(val) ? 0 : val), 0)
      .toFixed(4)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.buildingId) {
      setError("Por favor selecciona un consorcio.");
      return;
    }

    const payload = {
      ...formData,
      unitCoefficients: Object.entries(coefficients).map(([unitId, coeff]) => ({
        unitId,
        coefficient: Math.max(0, Number(coeff)),
      })),
    };

    startTransition(async () => {
      const res = await createLiquidationPeriod(payload);
      if (!res.success) {
        setError(res.error || "Ocurrió un error al crear la liquidación.");
      } else {
        setIsOpen(false);
        if (res.data?.id) {
          router.push(`/dashboard/expensas/${res.data.id}`);
        } else {
          router.refresh();
        }
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-brand hover:bg-brand-hover text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-2"
      >
        <span className="text-base font-bold">+</span>
        <span>Nueva Liquidación</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl w-full max-w-xl shadow-xl overflow-hidden my-4 sm:my-8">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">Abrir Nuevo Período de Expensas</h2>
                <p className="text-xs text-muted mt-0.5">
                  Inicia una liquidación en borrador para cargar facturas y prorratear.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-muted hover:text-foreground p-1.5 rounded-lg hover:bg-muted-bg transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs rounded-xl">
                  {error}
                </div>
              )}

              {/* Consorcio / Edificio */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Consorcio / Edificio <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.buildingId}
                  onChange={(e) => setFormData({ ...formData, buildingId: e.target.value })}
                  required
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/40"
                >
                  <option value="" disabled>Selecciona un edificio...</option>
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.address})
                    </option>
                  ))}
                </select>
                {buildings.length === 0 && (
                  <p className="text-[11px] text-amber-500 mt-1">
                    No tienes edificios creados. Crea uno primero en la sección de Consorcios.
                  </p>
                )}
              </div>

              {/* Período: Mes y Año */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Mes a Liquidar <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/40"
                  >
                    {MONTH_NAMES.map((name, idx) => (
                      <option key={idx + 1} value={idx + 1}>
                        {name} ({idx + 1})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Año <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={2020}
                    max={2035}
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    required
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/40"
                  />
                </div>
              </div>

              {/* Vencimientos */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    1er Vencimiento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.dueDateFirst}
                    onChange={(e) => setFormData({ ...formData, dueDateFirst: e.target.value })}
                    required
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    2do Vencimiento (Opcional)
                  </label>
                  <input
                    type="date"
                    value={formData.dueDateSecond}
                    onChange={(e) => setFormData({ ...formData, dueDateSecond: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/40"
                  />
                </div>
              </div>

              {/* Tasa de interés / recargo */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Recargo / Interés 2do Vencimiento y Mora (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={formData.interestRate}
                    onChange={(e) => setFormData({ ...formData, interestRate: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/40"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-muted font-bold">%</span>
                </div>
              </div>

              {/* Notas del Período */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Notas / Circular a los Copropietarios
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ej: Cuentas bancarias habilitadas o recordatorios del período..."
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/40 resize-none"
                />
              </div>

              {/* Sección de Coeficientes y Prorrateo Flexible por Locales / Pisos */}
              {units.length > 0 && (
                <div className="border border-border rounded-xl p-3.5 space-y-3 bg-muted-bg/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-foreground block">
                        ⚖️ Coeficientes de Prorrateo ({units.length} Unidades)
                      </span>
                      <p className="text-[11px] text-muted">
                        Personaliza los porcentajes para locales, pisos o departamentos según sus medidas.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCoefficients(!showCoefficients)}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg border border-border hover:bg-card text-brand transition-colors cursor-pointer"
                    >
                      {showCoefficients ? "Ocultar detalles ▲" : "Configurar % ▼"}
                    </button>
                  </div>

                  {showCoefficients && (
                    <div className="space-y-3 pt-2 border-t border-border">
                      {/* Herramienta rápida de asignación por grupo */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <select
                          value={quickGroup}
                          onChange={(e) => setQuickGroup(e.target.value)}
                          className="bg-background border border-border rounded-lg px-2.5 py-1 text-xs font-medium text-foreground"
                        >
                          <option value="LOCAL">🏪 Locales Comerciales</option>
                          <option value="DEPARTAMENTO">🏢 Departamentos</option>
                          <option value="COCHERA">🚗 Cocheras</option>
                        </select>
                        <input
                          type="number"
                          step="0.001"
                          placeholder="% c/u"
                          value={quickPercent}
                          onChange={(e) => setQuickPercent(e.target.value)}
                          className="w-20 bg-background border border-border rounded-lg px-2 py-1 text-xs font-bold text-foreground"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const val = parseFloat(quickPercent);
                            if (isNaN(val) || val < 0) return;
                            setCoefficients((prev) => {
                              const next = { ...prev };
                              for (const u of units) {
                                if (u.type === quickGroup) {
                                  next[u.id] = val;
                                }
                              }
                              return next;
                            });
                          }}
                          className="px-2.5 py-1 bg-brand text-white text-xs font-bold rounded-lg cursor-pointer"
                        >
                          Aplicar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const nonDeptSum = units
                              .filter((u) => u.type !== UnitType.DEPARTAMENTO)
                              .reduce((s, u) => s + (coefficients[u.id] || 0), 0);
                            const deptUnits = units.filter((u) => u.type === UnitType.DEPARTAMENTO);
                            if (deptUnits.length === 0) return;
                            const share = Number(((100 - nonDeptSum) / deptUnits.length).toFixed(4));
                            setCoefficients((prev) => {
                              const next = { ...prev };
                              for (const du of deptUnits) {
                                next[du.id] = Math.max(0, share);
                              }
                              return next;
                            });
                          }}
                          className="px-2.5 py-1 border border-border text-foreground text-xs font-medium rounded-lg hover:bg-card cursor-pointer"
                          title="Repartir lo que falta para 100% entre departamentos"
                        >
                          Restante a Deptos
                        </button>
                      </div>

                      {/* Lista de unidades con inputs */}
                      <div className="max-h-48 overflow-y-auto space-y-1 pr-1 border border-border rounded-lg p-2 bg-background">
                        {units.map((u) => (
                          <div
                            key={u.id}
                            className="flex items-center justify-between py-1 px-1.5 hover:bg-muted-bg/50 rounded-md text-xs"
                          >
                            <div>
                              <span className="font-bold text-foreground mr-2">U.F. {u.number}</span>
                              <span className="text-[10px] text-muted mr-2">
                                ({u.type === UnitType.LOCAL ? "Local" : u.floor !== null ? `Piso ${u.floor}` : "Depto"})
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                step="0.001"
                                min="0"
                                max="100"
                                value={coefficients[u.id] ?? u.coefficient}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  setCoefficients((prev) => ({
                                    ...prev,
                                    [u.id]: isNaN(val) ? 0 : val,
                                  }));
                                }}
                                className="w-20 bg-card border border-border rounded-md px-2 py-0.5 text-xs font-bold text-right text-foreground"
                              />
                              <span className="font-bold text-muted">%</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Total balance indicator */}
                      <div className="flex justify-between items-center text-xs pt-1">
                        <span className="font-bold text-muted">Suma de Coeficientes:</span>
                        <span
                          className={`font-black ${
                            Math.abs(totalSum - 100) < 0.01
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-amber-500"
                          }`}
                        >
                          {totalSum.toFixed(3)}% {Math.abs(totalSum - 100) < 0.01 ? "✓ 100% Balanceado" : "(Ajustable)"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                  className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted-bg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending || buildings.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-xs font-semibold text-white transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? "Creando período..." : "Crear Borrador de Expensas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
