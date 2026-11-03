"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { registerUnitPayment } from "@/app/actions/expenses";

interface ReceiptTarget {
  id: string;
  unitNumber: string;
  ownerName: string;
  tenantName?: string | null;
  totalPayable: number;
}

export function RegisterPaymentModal({
  target,
  onClose,
}: {
  target: ReceiptTarget;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  const [amount, setAmount] = useState<number | string>(target.totalPayable);
  const [paymentMethod, setPaymentMethod] = useState("Transferencia Bancaria");
  const [paymentReference, setPaymentReference] = useState("");
  const [notes, setNotes] = useState("");
  const [paidAt, setPaidAt] = useState(todayStr);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = typeof amount === "number" ? amount : parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("El monto abonado debe ser un valor numérico mayor a cero.");
      return;
    }

    startTransition(async () => {
      const res = await registerUnitPayment(target.id, {
        amount: numAmount,
        paymentMethod,
        paymentReference: paymentReference.trim() || undefined,
        notes: notes.trim() || undefined,
        paidAt: paidAt || undefined,
      });

      if (!res.success) {
        setError(res.error || "No se pudo registrar el cobro.");
      } else {
        onClose();
        router.refresh();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span>💵</span>
              <span>Registrar Cobranza</span>
            </h2>
            <p className="text-xs text-muted mt-0.5">
              U.F. {target.unitNumber} • {target.tenantName ? `${target.tenantName} (Inquilino)` : target.ownerName}
              {target.tenantName && target.ownerName && (
                <span className="block text-[11px] text-muted-foreground">
                  Propietario: {target.ownerName}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground p-1.5 rounded-lg hover:bg-muted-bg transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleRegister} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs rounded-xl">
              {error}
            </div>
          )}

          {/* Monto abonado */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Monto Abonado ($) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs text-muted font-bold">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-xl pl-8 pr-3.5 py-2.5 text-base font-bold text-foreground focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
            <p className="text-[11px] text-muted mt-1">
              Total liquidado a cancelar: ${target.totalPayable.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Fecha de Pago */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Fecha de Cobro / Acreditación <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
              required
              className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>

          {/* Método de Pago */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Método de Pago <span className="text-red-500">*</span>
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40"
            >
              <option value="Transferencia Bancaria">Transferencia Bancaria (CBU / Alias)</option>
              <option value="Efectivo">Efectivo (Cobro en Administración)</option>
              <option value="Cheque">Cheque al Día / Postfechado</option>
              <option value="Otro">Otro Medio de Pago</option>
            </select>
          </div>

          {/* Número de Comprobante / Referencia */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Nº de Comprobante o Referencia de Transferencia (opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: Transf. Galicia N° 982144, Op. 38102..."
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>

          {/* Observaciones adicionales */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Observaciones / Notas (opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: Cobrado en mano por tesorería..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>

          {/* Botones de Acción */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted-bg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <span>✓</span>
              <span>{isPending ? "Registrando..." : "Confirmar Cobro"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
