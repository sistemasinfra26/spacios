"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createUnit, updateUnit } from "@/app/actions/units";
import { UnitType } from "@prisma/client";

export interface UnitData {
  id?: string;
  buildingId: string;
  name?: string | null;
  code?: string | null;
  type: UnitType;
  number: string;
  floor?: number | null;
  door?: string | null;
  coefficient: number;
  ownerName?: string | null;
  ownerEmail?: string | null;
  ownerPhone?: string | null;
  tenantName?: string | null;
  tenantEmail?: string | null;
  tenantPhone?: string | null;
}

const UNIT_TYPE_LABELS: Record<UnitType, string> = {
  [UnitType.DEPARTAMENTO]: "Departamento / Vivienda",
  [UnitType.COCHERA]: "Cochera / Estacionamiento",
  [UnitType.BAULERA]: "Baulera / Depósito",
  [UnitType.LOCAL]: "Local Comercial / Oficina",
  [UnitType.OTRO]: "Otro Tipo de Unidad",
};

export function UnitModal({
  buildingId,
  unit,
  remainingCoefficient = 100,
  isOpen,
  onClose,
}: {
  buildingId: string;
  unit?: UnitData | null;
  remainingCoefficient?: number;
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [showTenantFields, setShowTenantFields] = useState<boolean>(
    Boolean(unit?.tenantName || unit?.tenantEmail || unit?.tenantPhone)
  );

  const isEditing = Boolean(unit && unit.id);

  const [formData, setFormData] = useState({
    name: unit?.name || "",
    code: unit?.code || "",
    type: unit?.type || UnitType.DEPARTAMENTO,
    number: unit?.number || "",
    floor: unit?.floor !== undefined && unit?.floor !== null ? String(unit.floor) : "",
    door: unit?.door || "",
    coefficient: unit?.coefficient ? String(unit.coefficient) : "",
    ownerName: unit?.ownerName || "",
    ownerEmail: unit?.ownerEmail || "",
    ownerPhone: unit?.ownerPhone || "",
    tenantName: unit?.tenantName || "",
    tenantEmail: unit?.tenantEmail || "",
    tenantPhone: unit?.tenantPhone || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setWarning(null);

    const coeffNum = parseFloat(formData.coefficient);
    if (!formData.number.trim()) {
      setError("El número o identificación principal de la unidad es obligatorio.");
      return;
    }
    if (isNaN(coeffNum) || coeffNum <= 0) {
      setError("El porcentaje de coeficiente debe ser un número positivo mayor a 0%.");
      return;
    }

    startTransition(async () => {
      const payload = {
        buildingId,
        name: formData.name.trim() || undefined,
        code: formData.code.trim() || undefined,
        type: formData.type,
        number: formData.number.trim(),
        floor: formData.floor.trim() ? parseInt(formData.floor.trim(), 10) : undefined,
        door: formData.door.trim() || undefined,
        coefficient: coeffNum,
        ownerName: formData.ownerName.trim() || undefined,
        ownerEmail: formData.ownerEmail.trim() || undefined,
        ownerPhone: formData.ownerPhone.trim() || undefined,
        tenantName: formData.tenantName.trim() || undefined,
        tenantEmail: formData.tenantEmail.trim() || undefined,
        tenantPhone: formData.tenantPhone.trim() || undefined,
      };

      let res;
      if (isEditing && unit?.id) {
        res = await updateUnit(unit.id, payload);
      } else {
        res = await createUnit(payload);
      }

      if (!res.success) {
        setError(res.error || "Ocurrió un error al guardar la unidad.");
      } else {
        onClose();
        router.refresh();
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {isEditing ? `Editar Unidad: ${unit?.number}` : "Registrar Nueva Unidad Funcional"}
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Configura los datos catastrales, coeficiente fiscal y datos de contacto para expensas.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground p-1.5 rounded-lg hover:bg-muted-bg transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          {warning && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs rounded-xl font-medium">
              {warning}
            </div>
          )}

          {/* Sección 1: Identificación y Tipo */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-muted uppercase tracking-wider">
              1. Identificación y Ubicación
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Tipo de Unidad <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as UnitType })}
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/40"
                >
                  {Object.entries(UNIT_TYPE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Número / U.F. <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: 3B, PB-1, C-14, Loc 2"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  required
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/40"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Piso (Opcional)
                </label>
                <input
                  type="number"
                  placeholder="Ej: 3"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Puerta / Dpto
                </label>
                <input
                  type="text"
                  placeholder="Ej: B, Norte"
                  value={formData.door}
                  onChange={(e) => setFormData({ ...formData, door: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/40"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Código Interno
                </label>
                <input
                  type="text"
                  placeholder="Ej: UF-05"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/40"
                />
              </div>
            </div>
          </div>

          {/* Sección 2: Prorrateo / Coeficiente */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-muted uppercase tracking-wider">
                2. Coeficiente de Prorrateo Fiscal
              </h3>
              {!isEditing && remainingCoefficient > 0 && (
                <span className="text-[11px] text-brand font-medium">
                  Disponible sin exceder: {remainingCoefficient.toFixed(2)}%
                </span>
              )}
            </div>

            <div>
              <div className="relative">
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  max="100"
                  placeholder="Ej: 4.250"
                  value={formData.coefficient}
                  onChange={(e) => setFormData({ ...formData, coefficient: e.target.value })}
                  required
                  className="w-full bg-background border border-border rounded-xl pl-3.5 pr-8 py-2.5 text-sm font-bold text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/40"
                />
                <span className="absolute right-3.5 top-2.5 text-sm text-muted font-bold">%</span>
              </div>
              <p className="text-[11px] text-muted mt-1">
                Porcentaje de participación legal en los gastos comunes y fondo de reserva.
              </p>
            </div>
          </div>

          {/* Sección 3: Datos del Propietario */}
          <div className="space-y-3 pt-2 border-t border-border">
            <h3 className="text-xs font-bold text-muted uppercase tracking-wider">
              3. Datos del Propietario / Titular
            </h3>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Nombre y Apellido
              </label>
              <input
                type="text"
                placeholder="Ej: Martín Rodríguez"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/40"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Email para Expensas
                </label>
                <input
                  type="email"
                  placeholder="propietario@email.com"
                  value={formData.ownerEmail}
                  onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="tel"
                  placeholder="+54 9 11 4059-2810"
                  value={formData.ownerPhone}
                  onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/40"
                />
              </div>
            </div>
          </div>

          {/* Sección 4: Datos del Inquilino (Opcional Colapsable) */}
          <div className="pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => setShowTenantFields(!showTenantFields)}
              className="text-xs font-bold text-brand hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <span>{showTenantFields ? "▼" : "▶"}</span>
              <span>
                {showTenantFields
                  ? "Ocultar datos de inquilino / inquilina"
                  : "+ Agregar datos de inquilino u ocupante (opcional)"}
              </span>
            </button>

            {showTenantFields && (
              <div className="space-y-3 mt-3 p-3.5 rounded-xl bg-muted-bg/50 border border-border">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Nombre del Inquilino
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Laura Benítez"
                    value={formData.tenantName}
                    onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/40"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Email Inquilino
                    </label>
                    <input
                      type="email"
                      placeholder="inquilino@email.com"
                      value={formData.tenantEmail}
                      onChange={(e) => setFormData({ ...formData, tenantEmail: e.target.value })}
                      className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/40"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Teléfono Inquilino
                    </label>
                    <input
                      type="tel"
                      placeholder="+54 9 11 5820-9182"
                      value={formData.tenantPhone}
                      onChange={(e) => setFormData({ ...formData, tenantPhone: e.target.value })}
                      className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand/40"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botones de Acción */}
          <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
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
              className="px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isPending ? "Guardando..." : isEditing ? "Actualizar Unidad" : "Registrar Unidad"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
