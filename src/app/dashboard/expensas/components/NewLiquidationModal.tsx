"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createLiquidationPeriod } from "@/app/actions/expenses";

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

  const [formData, setFormData] = useState({
    buildingId: selectedBuildingId && selectedBuildingId !== "ALL" ? selectedBuildingId : (buildings[0]?.id || ""),
    month: currentMonth,
    year: currentYear,
    dueDateFirst: defaultDueDate1,
    dueDateSecond: defaultDueDate2,
    interestRate: 5,
    notes: "Expensas ordinarias del período en curso.",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.buildingId) {
      setError("Por favor selecciona un consorcio.");
      return;
    }

    startTransition(async () => {
      const res = await createLiquidationPeriod(formData);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">Abrir Nuevo Período de Expensas</h2>
                <p className="text-xs text-muted mt-0.5">
                  Inicia una liquidación en borrador para cargar facturas y prorratear.
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted hover:text-foreground p-1.5 rounded-lg hover:bg-muted-bg transition-colors"
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
                  placeholder="Ej: Se recuerda que el abono de ascensores incluye la renovación de cables..."
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/40 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                  className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted-bg transition-colors"
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
