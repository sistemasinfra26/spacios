"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addExpenseItem } from "@/app/actions/expenses";
import {
  getExpenseTemplates,
  createExpenseTemplate,
  type ExpenseTemplateItem,
} from "@/app/actions/recurring-expenses";
import { ExpenseCategory } from "@prisma/client";

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

export function AddExpenseItemModal({
  liquidationId,
  buildingId,
  isDraft = true,
}: {
  liquidationId: string;
  buildingId?: string;
  isDraft?: boolean;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Plantillas recurrentes
  const [templates, setTemplates] = useState<ExpenseTemplateItem[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [saveAsTemplate, setSaveAsTemplate] = useState<boolean>(false);

  const todayStr = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState<{
    category: ExpenseCategory;
    description: string;
    supplierName: string;
    invoiceNumber: string;
    amount: string;
    date: string;
  }>({
    category: ExpenseCategory.ORDINARY_A,
    description: "",
    supplierName: "",
    invoiceNumber: "",
    amount: "",
    date: todayStr,
  });

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await getExpenseTemplates(buildingId);
      if (res.success && res.data) {
        setTemplates(res.data);
      }
    } catch (err) {
      console.error("Error al cargar plantillas de gastos:", err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen, buildingId]);

  const resetForm = () => {
    setFormData({
      category: ExpenseCategory.ORDINARY_A,
      description: "",
      supplierName: "",
      invoiceNumber: "",
      amount: "",
      date: todayStr,
    });
    setSelectedTemplateId("");
    setSaveAsTemplate(false);
    setError(null);
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;

    const tmpl = templates.find((t) => t.id === templateId);
    if (tmpl) {
      setFormData((prev) => ({
        ...prev,
        category: tmpl.category,
        description: tmpl.concept,
        supplierName: tmpl.supplierName,
        amount: tmpl.defaultAmount ? String(tmpl.defaultAmount) : prev.amount,
      }));
    }
  };

  const handleSave = (keepOpen: boolean) => {
    setError(null);
    setSuccessMsg(null);

    const numAmount = parseFloat(formData.amount);
    if (!formData.description.trim()) {
      setError("El concepto / descripción es obligatorio.");
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("El monto debe ser un valor numérico mayor a cero.");
      return;
    }

    startTransition(async () => {
      // 1. Guardar el item del gasto
      const res = await addExpenseItem({
        liquidationId,
        category: formData.category,
        description: formData.description,
        supplierName: formData.supplierName || null,
        invoiceNumber: formData.invoiceNumber || null,
        amount: numAmount,
        date: formData.date || null,
      });

      if (!res.success) {
        setError(res.error || "No se pudo registrar el gasto.");
        return;
      }

      // 2. Si se marcó guardar como recurrente, guardar la plantilla en paralelo
      if (saveAsTemplate) {
        try {
          await createExpenseTemplate({
            buildingId: buildingId || null,
            category: formData.category,
            concept: formData.description,
            supplierName: formData.supplierName || "Varios",
            defaultAmount: numAmount,
          });
          // Recargar la lista de plantillas
          loadTemplates();
        } catch (err) {
          console.error("Error al guardar plantilla recurrente:", err);
        }
      }

      if (keepOpen) {
        setSuccessMsg(`✓ Factura guardada ($${numAmount.toLocaleString("es-AR")}). Carga la siguiente:`);
        resetForm();
        router.refresh();
      } else {
        setIsOpen(false);
        resetForm();
        router.refresh();
      }
    });
  };

  if (!isDraft) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => {
          resetForm();
          setIsOpen(true);
        }}
        className="bg-card border border-border text-foreground hover:bg-muted-bg text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-2"
      >
        <span className="text-brand font-bold text-sm">+</span>
        <span>Cargar Factura / Gasto</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-xl overflow-hidden max-h-[92vh] flex flex-col">
            {/* Header del Modal */}
            <div className="p-6 border-b border-border flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-bold text-foreground">Cargar Gasto al Período</h2>
                <p className="text-xs text-muted mt-0.5">
                  Registra facturas y comprobantes para prorratear entre los copropietarios.
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted hover:text-foreground p-1.5 rounded-lg hover:bg-muted-bg transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Contenido / Formulario */}
            <div className="p-6 space-y-4 overflow-y-auto">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs rounded-xl">
                  {error}
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl">
                  {successMsg}
                </div>
              )}

              {/* Selector de Plantilla Frecuente */}
              <div className="bg-brand/5 border border-brand/20 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <span>⚡</span>
                    <span>Cargar desde plantilla frecuente...</span>
                  </label>
                  {selectedTemplateId && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTemplateId("");
                      }}
                      className="text-[11px] text-muted hover:text-foreground underline cursor-pointer"
                    >
                      Limpiar selección
                    </button>
                  )}
                </div>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => handleTemplateSelect(e.target.value)}
                  disabled={loadingTemplates}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/40"
                >
                  <option value="">
                    {loadingTemplates
                      ? "Cargando plantillas..."
                      : templates.length === 0
                      ? "-- No hay plantillas frecuentes creadas aún --"
                      : "-- Seleccionar concepto o proveedor frecuente --"}
                  </option>
                  {templates.map((tmpl) => (
                    <option key={tmpl.id} value={tmpl.id}>
                      {tmpl.concept} • {tmpl.supplierName}
                      {tmpl.defaultAmount
                        ? ` ($${tmpl.defaultAmount.toLocaleString("es-AR")})`
                        : ""}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-muted mt-1">
                  Autocompleta rubro, concepto, proveedor y sugiere el monto habitual.
                </p>
              </div>

              {/* Categoría / Clasificación */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Tipo / Clasificación del Gasto <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(CATEGORY_LABELS) as ExpenseCategory[]).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: cat })}
                      className={`text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                        formData.category === cat
                          ? "border-brand bg-brand/10 text-brand font-semibold shadow-xs"
                          : "border-border bg-background hover:bg-muted-bg text-muted"
                      }`}
                    >
                      <div className="font-semibold text-foreground">{CATEGORY_LABELS[cat].label}</div>
                      <div className="text-[10px] text-muted truncate mt-0.5">{CATEGORY_LABELS[cat].desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Concepto / Descripción */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Concepto / Detalle del Gasto <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: Abono mensual de ascensores, Edesur servicios comunes..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/40"
                  required
                />
              </div>

              {/* Proveedor y Nº Factura */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Proveedor / Empresa
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Otis Ascensores S.A."
                    value={formData.supplierName}
                    onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Nº Comprobante / Factura
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: B-0004-00192837"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/40"
                  />
                </div>
              </div>

              {/* Monto y Fecha */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Monto Total ($) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs text-muted font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full bg-background border border-border rounded-xl pl-8 pr-3.5 py-2.5 text-sm font-bold text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/40"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Fecha del Comprobante
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/40"
                  />
                </div>
              </div>

              {/* Switch / Checkbox inferior: Guardar como gasto frecuente */}
              <div className="pt-2 border-t border-border">
                <label className="flex items-start gap-3 cursor-pointer p-2.5 rounded-xl bg-background hover:bg-muted-bg border border-border transition-colors">
                  <input
                    type="checkbox"
                    checked={saveAsTemplate}
                    onChange={(e) => setSaveAsTemplate(e.target.checked)}
                    className="mt-0.5 rounded border-border text-brand focus:ring-brand h-4 w-4 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-semibold text-foreground block">
                      Guardar este concepto como gasto frecuente para futuros meses
                    </span>
                    <span className="text-[11px] text-muted block mt-0.5">
                      Quedará disponible en la lista de plantillas rápidas para liquidar con 1 clic en próximos períodos.
                    </span>
                  </div>
                </label>
              </div>

              {/* Botones de acción */}
              <div className="pt-3 border-t border-border flex items-center justify-between gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                  className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted-bg transition-colors"
                >
                  Cerrar
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSave(true)}
                    disabled={isPending}
                    className="px-4 py-2.5 rounded-xl bg-card border border-brand text-brand hover:bg-brand/10 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                  >
                    Guardar y agregar otro
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSave(false)}
                    disabled={isPending}
                    className="px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-xs font-semibold text-white transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isPending ? "Guardando..." : "Guardar Factura"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
