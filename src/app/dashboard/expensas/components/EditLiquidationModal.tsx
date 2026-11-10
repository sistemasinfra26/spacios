"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LiquidationStatus } from "@prisma/client";
import { updateLiquidationPeriod, reopenLiquidationToDraft } from "@/app/actions/expenses";

export interface EditLiquidationModalProps {
  liquidation: {
    id: string;
    buildingName?: string;
    buildingAddress?: string;
    month: number;
    year: number;
    status: LiquidationStatus;
    dueDateFirst: Date | string;
    dueDateSecond: Date | string | null;
    interestRate: number | null;
    notes?: string | null;
  };
  trigger?: React.ReactNode;
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

function formatDateForInput(d: Date | string | null | undefined): string {
  if (!d) return "";
  try {
    const date = typeof d === "string" ? new Date(d) : d;
    if (isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

export function EditLiquidationModal({
  liquidation,
  trigger,
}: EditLiquidationModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isReopening, setIsReopening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dueDateFirst, setDueDateFirst] = useState(() =>
    formatDateForInput(liquidation.dueDateFirst)
  );
  const [dueDateSecond, setDueDateSecond] = useState(() =>
    formatDateForInput(liquidation.dueDateSecond)
  );
  const [interestRate, setInterestRate] = useState<number | string>(() =>
    liquidation.interestRate ?? 0
  );
  const [notes, setNotes] = useState(() => liquidation.notes ?? "");

  const handleOpen = () => {
    // Sincronizar datos al abrir
    setDueDateFirst(formatDateForInput(liquidation.dueDateFirst));
    setDueDateSecond(formatDateForInput(liquidation.dueDateSecond));
    setInterestRate(liquidation.interestRate ?? 0);
    setNotes(liquidation.notes ?? "");
    setError(null);
    setIsOpen(true);
  };

  const handleReopen = () => {
    if (
      !confirm(
        "¿Confirmas que deseas reabrir este período a estado Borrador para modificar o agregar gastos? Los pagos ya registrados se mantendrán intactos."
      )
    ) {
      return;
    }

    setError(null);
    setIsReopening(true);
    startTransition(async () => {
      const res = await reopenLiquidationToDraft(liquidation.id);
      setIsReopening(false);
      if (!res.success) {
        setError(res.error || "No se pudo reabrir la liquidación.");
      } else {
        setIsOpen(false);
        router.refresh();
      }
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!dueDateFirst) {
      setError("La fecha del 1º vencimiento es obligatoria.");
      return;
    }

    const numInterest = Number(interestRate);
    if (isNaN(numInterest) || numInterest < 0) {
      setError("La tasa de interés por mora debe ser un número igual o mayor a 0.");
      return;
    }

    startTransition(async () => {
      const res = await updateLiquidationPeriod(liquidation.id, {
        dueDateFirst,
        dueDateSecond: dueDateSecond || null,
        interestRate: numInterest,
        notes: notes.trim() || null,
      });

      if (!res.success) {
        setError(res.error || "No se pudo actualizar la liquidación.");
      } else {
        setIsOpen(false);
        router.refresh();
      }
    });
  };

  const periodLabel = `${MONTH_NAMES[liquidation.month - 1]} ${liquidation.year}`;
  const isClosed = liquidation.status === LiquidationStatus.CLOSED;
  const isPublished = liquidation.status === LiquidationStatus.PUBLISHED;

  return (
    <>
      {trigger ? (
        <span onClick={handleOpen} className="inline-flex cursor-pointer">
          {trigger}
        </span>
      ) : (
        <button
          type="button"
          onClick={handleOpen}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border border-border hover:bg-muted-bg text-foreground transition-all cursor-pointer shadow-xs"
          title="Editar liquidación"
        >
          <span>✏️</span>
          <span>Editar</span>
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-foreground">
                    Editar Liquidación de Expensas
                  </h2>
                  {liquidation.status === LiquidationStatus.DRAFT && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      Borrador
                    </span>
                  )}
                  {isPublished && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Publicado
                    </span>
                  )}
                  {isClosed && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted-bg text-muted border border-border">
                      Cerrado
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted mt-0.5">
                  {liquidation.buildingName ? `${liquidation.buildingName} • ` : ""}
                  Período: <strong>{periodLabel}</strong>
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

            {/* Error banner */}
            {error && (
              <div className="mx-6 mt-4 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {isClosed ? (
                <div className="p-4 bg-muted-bg/60 rounded-xl border border-border text-xs text-muted space-y-1">
                  <p className="font-bold text-foreground">🔒 Período Contablemente Cerrado</p>
                  <p>
                    Esta liquidación ya fue archivada y cerrada en forma definitiva. No se
                    pueden realizar modificaciones sobre los importes, vencimientos o comprobantes.
                  </p>
                </div>
              ) : (
                <>
                  {/* Banner informativo para Publicadas */}
                  {isPublished && (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-3">
                      <div className="flex items-start gap-2.5">
                        <span className="text-base">⚠️</span>
                        <div className="text-xs text-amber-900 dark:text-amber-200">
                          <p className="font-bold">Liquidación Emitida / Confirmada</p>
                          <p className="mt-0.5 text-muted leading-relaxed">
                            Puedes ajustar las fechas de vencimiento, la tasa de mora y las
                            observaciones directamente aquí.
                          </p>
                          <p className="mt-1 text-muted leading-relaxed">
                            Si necesitas <strong>modificar facturas cargadas, eliminar comprobantes o agregar nuevos gastos</strong>,
                            debes reabrir el período a borrador. Los cobros ya ingresados no se perderán.
                          </p>
                        </div>
                      </div>

                      <div className="pt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={handleReopen}
                          disabled={isPending || isReopening}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <span>🔓</span>
                          <span>
                            {isReopening ? "Reabriendo..." : "Reabrir a Borrador para Modificar Gastos"}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Vencimientos */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-muted mb-1">
                        1º Vencimiento <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={dueDateFirst}
                        onChange={(e) => setDueDateFirst(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/40"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted mb-1">
                        2º Vencimiento (Opcional)
                      </label>
                      <input
                        type="date"
                        value={dueDateSecond}
                        onChange={(e) => setDueDateSecond(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/40"
                      />
                    </div>
                  </div>

                  {/* Tasa de Interés */}
                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1">
                      Tasa de Interés por Mora Mensual (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/40"
                    />
                    <span className="text-[10px] text-muted mt-1 block">
                      Aplicable a unidades con deuda vencida.
                    </span>
                  </div>

                  {/* Notas / Observaciones */}
                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1">
                      Notas u Observaciones del Período
                    </label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Información sobre cuentas bancarias, avisos de asamblea o recordatorios..."
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/40"
                    />
                  </div>
                </>
              )}

              {/* Actions */}
              <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-muted hover:text-foreground hover:bg-muted-bg transition-colors cursor-pointer"
                >
                  {isClosed ? "Cerrar" : "Cancelar"}
                </button>

                {!isClosed && (
                  <button
                    type="submit"
                    disabled={isPending || isReopening}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-brand hover:bg-brand-hover text-white transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <span>💾</span>
                    <span>{isPending ? "Guardando..." : "Guardar Cambios"}</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

