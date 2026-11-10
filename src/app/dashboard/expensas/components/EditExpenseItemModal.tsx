"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateExpenseItem } from "@/app/actions/expenses";
import { ExpenseCategory } from "@prisma/client";

export interface ExpenseItemData {
  id: string;
  category: ExpenseCategory;
  description: string;
  supplierName: string | null;
  invoiceNumber: string | null;
  amount: number;
  date: Date | string;
}

const CATEGORY_LABELS: Record<ExpenseCategory, { label: string; desc: string }> = {
  [ExpenseCategory.ORDINARY_A]: {
    label: "Ordinario A",
    desc: "Servicios centrales, mantenimiento preventivo y limpieza general",
  },
  [ExpenseCategory.ORDINARY_B]: {
    label: "Ordinario B",
    desc: "Servicios específicos o áreas particulares (ej: cocheras)",
  },
  [ExpenseCategory.EXTRAORDINARY]: {
    label: "Extraordinario",
    desc: "Obras civiles, mejoras estructurales, reparaciones no habituales",
  },
  [ExpenseCategory.RESERVE_FUND]: {
    label: "Fondo de Reserva",
    desc: "Aportes para previsión de contingencias legales y fondo de emergencia",
  },
};

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

export function EditExpenseItemModal({
  item,
  trigger,
}: {
  item: ExpenseItemData;
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    category: item.category,
    description: item.description,
    supplierName: item.supplierName || "",
    invoiceNumber: item.invoiceNumber || "",
    amount: String(item.amount),
    date: formatDateForInput(item.date),
  });

  const handleOpen = () => {
    setFormData({
      category: item.category,
      description: item.description,
      supplierName: item.supplierName || "",
      invoiceNumber: item.invoiceNumber || "",
      amount: String(item.amount),
      date: formatDateForInput(item.date),
    });
    setError(null);
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(formData.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("El monto debe ser un valor numérico positivo mayor a 0.");
      return;
    }

    if (!formData.description.trim()) {
      setError("El concepto / descripción es obligatorio.");
      return;
    }

    startTransition(async () => {
      const res = await updateExpenseItem({
        itemId: item.id,
        category: formData.category,
        description: formData.description.trim(),
        supplierName: formData.supplierName.trim() || undefined,
        invoiceNumber: formData.invoiceNumber.trim() || undefined,
        amount: numAmount,
        date: formData.date || undefined,
      });

      if (!res.success) {
        setError(res.error || "Error al actualizar el comprobante.");
      } else {
        setIsOpen(false);
        router.refresh();
      }
    });
  };

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
          title="Editar comprobante / factura"
          className="text-blue-500 hover:text-blue-700 p-1.5 rounded-lg hover:bg-blue-500/10 transition-colors cursor-pointer text-xs"
        >
          ✏️
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 text-foreground">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">Editar Comprobante de Gasto</h2>
                <p className="text-xs text-muted mt-0.5">
                  Modifica los datos del gasto o factura cargada al período.
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

            {/* Error Message */}
            {error && (
              <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Categoría */}
              <div>
                <label className="block text-xs font-semibold text-muted mb-1">
                  Categoría de Gasto <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      category: e.target.value as ExpenseCategory,
                    }))
                  }
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/40"
                >
                  {Object.entries(CATEGORY_LABELS).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val.label} — {val.desc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Concepto / Rubro */}
              <div>
                <label className="block text-xs font-semibold text-muted mb-1">
                  Concepto / Rubro <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Mantenimiento de bombas de agua, Edenor, Limpieza..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/40"
                />
              </div>

              {/* Proveedor y Nro Comprobante */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">
                    Proveedor / Empresa
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Aguas de Santiago, Edese, Schindler..."
                    value={formData.supplierName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, supplierName: e.target.value }))
                    }
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">
                    Nro. Comprobante / Factura
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: B-0001-00049210"
                    value={formData.invoiceNumber}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, invoiceNumber: e.target.value }))
                    }
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/40"
                  />
                </div>
              </div>

              {/* Monto y Fecha */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">
                    Monto Total ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, amount: e.target.value }))
                    }
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">
                    Fecha del Comprobante
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, date: e.target.value }))
                    }
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/40"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-muted hover:text-foreground hover:bg-muted-bg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-brand hover:bg-brand-hover text-white transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span>💾</span>
                  <span>{isPending ? "Guardando..." : "Guardar Cambios"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

