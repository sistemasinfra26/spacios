"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  calculateAndPublishLiquidation,
  closeLiquidationPeriod,
  deleteExpenseItem,
  type UnitProrationPreview,
  type LiquidationFinancialSummary,
} from "@/app/actions/expenses";
import { AddExpenseItemModal } from "./AddExpenseItemModal";
import { RegisterPaymentModal } from "./RegisterPaymentModal";
import { ReceiptPrintModal, type ReceiptData, type BuildingReceiptInfo } from "./ReceiptPrintModal";
import { LiquidationAuditSheetModal } from "../[id]/LiquidationAuditSheetModal";
import { PaymentReceiptModal, type PaymentReceiptData } from "./PaymentReceiptModal";
import { EditLiquidationModal } from "./EditLiquidationModal";
import { EditExpenseItemModal } from "./EditExpenseItemModal";
import { ExpenseTablePrintModal } from "./ExpenseTablePrintModal";
import { AdjustProrationCoefficientsModal } from "./AdjustProrationCoefficientsModal";
import { ExpenseCategory, LiquidationStatus, PaymentStatus } from "@prisma/client";

interface LiquidationData {
  id: string;
  buildingId: string;
  buildingName: string;
  buildingAddress: string;
  buildingCuit?: string | null;
  city: string;
  month: number;
  year: number;
  status: LiquidationStatus;
  dueDateFirst: Date | string;
  dueDateSecond: Date | string | null;
  interestRate: number | null;
  notes: string | null;
  totalAmount: number;
  items: Array<{
    id: string;
    category: ExpenseCategory;
    description: string;
    supplierName: string | null;
    invoiceNumber: string | null;
    amount: number;
    date: Date | string;
  }>;
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const CATEGORY_NAMES: Record<ExpenseCategory, string> = {
  [ExpenseCategory.ORDINARY_A]: "Ordinario A",
  [ExpenseCategory.ORDINARY_B]: "Ordinario B",
  [ExpenseCategory.EXTRAORDINARY]: "Extraordinario",
  [ExpenseCategory.RESERVE_FUND]: "Fondo de Reserva",
};

export function LiquidationDetailView({
  liquidation,
  prorationList,
  summary,
}: {
  liquidation: LiquidationData;
  prorationList: UnitProrationPreview[];
  summary: LiquidationFinancialSummary;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"items" | "units">("units");
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modales
  const [selectedReceiptForPrint, setSelectedReceiptForPrint] = useState<ReceiptData | null>(null);
  const [selectedTargetForPayment, setSelectedTargetForPayment] = useState<{
    id: string;
    unitNumber: string;
    ownerName: string;
    tenantName?: string | null;
    totalPayable: number;
  } | null>(null);
  const [selectedPaymentReceipt, setSelectedPaymentReceipt] = useState<PaymentReceiptData | null>(null);
  const [showPublishConfirmation, setShowPublishConfirmation] = useState(false);
  const [isAuditSheetOpen, setIsAuditSheetOpen] = useState(false);
  const [isExpenseTablePrintOpen, setIsExpenseTablePrintOpen] = useState(false);
  const [isAdjustCoefficientsOpen, setIsAdjustCoefficientsOpen] = useState(false);

  const isDraft = liquidation.status === LiquidationStatus.DRAFT;
  const isPublished = liquidation.status === LiquidationStatus.PUBLISHED;
  const isClosed = liquidation.status === LiquidationStatus.CLOSED;

  const periodLabel = `${MONTH_NAMES[liquidation.month - 1]} ${liquidation.year}`;

  // Eliminar un gasto
  const handleDeleteItem = (itemId: string) => {
    if (!confirm("¿Deseas eliminar este comprobante de gasto?")) return;
    setActionError(null);
    startTransition(async () => {
      const res = await deleteExpenseItem(itemId);
      if (!res.success) {
        setActionError(res.error || "No se pudo eliminar.");
      } else {
        router.refresh();
      }
    });
  };

  // Emitir / Publicar liquidación
  const handlePublish = () => {
    setActionError(null);
    startTransition(async () => {
      const res = await calculateAndPublishLiquidation(liquidation.id);
      if (!res.success) {
        setActionError(res.error || "Error al emitir la liquidación.");
      } else {
        setActionSuccess(res.message || "Liquidación emitida correctamente.");
        setShowPublishConfirmation(false);
        router.refresh();
      }
    });
  };

  // Cerrar período
  const handleClose = () => {
    if (!confirm("¿Confirmas el cierre contable definitivo de este período?")) return;
    setActionError(null);
    startTransition(async () => {
      const res = await closeLiquidationPeriod(liquidation.id);
      if (!res.success) {
        setActionError(res.error || "Error al cerrar el período.");
      } else {
        setActionSuccess("Período cerrado exitosamente.");
        router.refresh();
      }
    });
  };

  const buildingReceiptInfo: BuildingReceiptInfo = {
    buildingName: liquidation.buildingName,
    buildingAddress: liquidation.buildingAddress,
    buildingCuit: liquidation.buildingCuit,
    city: liquidation.city,
    month: liquidation.month,
    year: liquidation.year,
    dueDateFirst: liquidation.dueDateFirst,
    dueDateSecond: liquidation.dueDateSecond,
    interestRate: liquidation.interestRate,
    totalBuildingExpenses: summary.totalExpenses,
    notes: liquidation.notes,
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs text-muted">
        <Link href="/dashboard/expensas" className="hover:text-foreground transition-colors">
          ← Volver al Listado de Expensas
        </Link>
        <span>/</span>
        <span className="text-foreground font-semibold">
          {liquidation.buildingName} • {periodLabel}
        </span>
      </div>

      {/* Main Header */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              {liquidation.buildingName}
            </h1>
            {isDraft && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                ● Borrador
              </span>
            )}
            {isPublished && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                ● Publicado / En Cobranza
              </span>
            )}
            {isClosed && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-muted-bg text-muted border border-border">
                ● Período Cerrado
              </span>
            )}
          </div>
          <p className="text-xs text-muted mt-1">
            {liquidation.buildingAddress}, {liquidation.city} • Período:{" "}
            <strong className="text-foreground">{periodLabel}</strong> • 1º Vencimiento:{" "}
            <strong className="text-foreground">
              {new Date(liquidation.dueDateFirst).toLocaleDateString("es-AR")}
            </strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {!isClosed && (
            <EditLiquidationModal
              liquidation={{
                id: liquidation.id,
                buildingName: liquidation.buildingName,
                buildingAddress: liquidation.buildingAddress,
                month: liquidation.month,
                year: liquidation.year,
                status: liquidation.status,
                dueDateFirst: liquidation.dueDateFirst,
                dueDateSecond: liquidation.dueDateSecond,
                interestRate: liquidation.interestRate,
                notes: liquidation.notes,
              }}
              trigger={
                <button
                  type="button"
                  className="bg-card border border-border hover:bg-muted-bg text-foreground text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  title="Editar vencimientos, intereses o notas de la liquidación"
                >
                  <span>✏️</span>
                  <span>Editar Liquidación</span>
                </button>
              }
            />
          )}

          {isDraft && (
            <AddExpenseItemModal
              liquidationId={liquidation.id}
              buildingId={liquidation.buildingId}
              isDraft={true}
            />
          )}

          <button
            onClick={() => setIsAuditSheetOpen(true)}
            className="bg-card border border-border hover:bg-muted-bg text-foreground text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            title="Ver e imprimir planilla contable de respaldo del período"
          >
            <span>📑</span>
            <span>Planilla de Respaldo / Rendición de Cuentas</span>
          </button>

          {isDraft && (
            <button
              onClick={() => setShowPublishConfirmation(true)}
              disabled={isPending || prorationList.length === 0}
              className="bg-brand hover:bg-brand-hover text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <span>🚀</span>
              <span>Emitir / Publicar Expensas</span>
            </button>
          )}

          {isPublished && (
            <button
              onClick={handleClose}
              disabled={isPending}
              className="bg-card border border-border hover:bg-muted-bg text-foreground text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              Cerrar Período Contable
            </button>
          )}
        </div>
      </div>

      {/* Alertas de error o éxito */}
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

      {/* Alerta de edificio sin unidades */}
      {prorationList.length === 0 && (
        <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-bold text-sm flex items-center gap-2">
              <span>⚠️</span>
              <span>Este edificio aún no tiene unidades funcionales registradas</span>
            </h4>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Para prorratear y emitir las expensas, debes registrar los departamentos, cocheras o locales con sus porcentajes de coeficiente.
            </p>
          </div>
          <Link
            href={`/dashboard/consorcios/${liquidation.buildingId}`}
            className="bg-brand hover:bg-brand-hover text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs shrink-0 inline-flex items-center gap-2"
          >
            <span>🏢 Cargar Unidades Funcionales →</span>
          </Link>
        </div>
      )}

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gastos Ordinarios */}
        <div className="p-4 bg-card rounded-2xl border border-border shadow-xs">
          <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
            Gastos Ordinarios
          </span>
          <p className="text-2xl font-bold mt-1 text-foreground">
            ${summary.totalOrdinary.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-muted">Mantenimiento, servicios y sueldos</span>
        </div>

        {/* Gastos Extraordinarios */}
        <div className="p-4 bg-card rounded-2xl border border-border shadow-xs">
          <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
            Gastos Extraordinarios
          </span>
          <p className="text-2xl font-bold mt-1 text-purple-600 dark:text-purple-400">
            ${summary.totalExtraordinary.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-muted">Obras y mejoras estructurales</span>
        </div>

        {/* Total Gastos a Prorratear */}
        <div className="p-4 bg-card rounded-2xl border border-border shadow-xs bg-brand/5 border-brand/20">
          <span className="text-[11px] font-semibold text-brand uppercase tracking-wider">
            Total Gastos Período
          </span>
          <p className="text-2xl font-black mt-1 text-brand">
            ${summary.totalExpenses.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-brand/80">
            {liquidation.items.length} facturas cargadas
          </span>
        </div>

        {/* Cobranzas / Total a Recaudar */}
        <div className="p-4 bg-card rounded-2xl border border-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
              {isDraft ? "Total a Liquidar" : "Recaudación"}
            </span>
            {!isDraft && (
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                {summary.grandTotalPayable > 0
                  ? `${Math.round((summary.totalPaid / summary.grandTotalPayable) * 100)}% cobrado`
                  : "0%"}
              </span>
            )}
          </div>
          <p className="text-2xl font-bold mt-1 text-foreground">
            ${summary.grandTotalPayable.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-muted">
            {isDraft
              ? `Incluye $${summary.totalPreviousDebt.toLocaleString("es-AR")} de deuda previa`
              : `Cobrado: $${summary.totalPaid.toLocaleString("es-AR")}`}
          </span>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab("units")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "units"
              ? "bg-brand text-white shadow-xs"
              : "text-muted hover:text-foreground hover:bg-muted-bg"
          }`}
        >
          <span>🏢</span>
          <span>Liquidación por Unidad Funcional ({prorationList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("items")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "items"
              ? "bg-brand text-white shadow-xs"
              : "text-muted hover:text-foreground hover:bg-muted-bg"
          }`}
        >
          <span>📑</span>
          <span>Gastos y Facturas Cargadas ({liquidation.items.length})</span>
        </button>
      </div>

      {/* TAB 1: Unidades & Prorrateo */}
      {activeTab === "units" && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-xs">
          <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-foreground">
                {isDraft ? "Previsualización del Prorrateo" : "Comprobantes Emitidos"}
              </h3>
              <p className="text-xs text-muted mt-0.5">
                Cálculo automático según el coeficiente de copropiedad e historial de saldos impagos.
              </p>
            </div>

            {isDraft && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustCoefficientsOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-card border border-border hover:bg-muted-bg text-foreground text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  title="Modificar porcentajes y coeficientes para locales, pisos o departamentos"
                >
                  <span>⚖️</span>
                  <span>Ajustar Coeficientes</span>
                </button>
                <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-amber-500/10 text-amber-600 border border-amber-500/20">
                  Modo Borrador • Los montos se fijan al emitir
                </span>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted-bg/60 text-muted border-b border-border font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3">U.F. / Depto</th>
                  <th className="px-5 py-3">Propietario / Ocupante</th>
                  <th className="px-5 py-3 text-center">Coeficiente %</th>
                  <th className="px-5 py-3 text-right">Ordinarias</th>
                  <th className="px-5 py-3 text-right">Extraord.</th>
                  <th className="px-5 py-3 text-right">Deuda / Mora</th>
                  <th className="px-5 py-3 text-right">Total a Pagar</th>
                  <th className="px-5 py-3 text-center">Estado</th>
                  <th className="px-5 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-foreground">
                {prorationList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-12 text-center text-muted">
                      No hay unidades funcionales configuradas para este consorcio.
                    </td>
                  </tr>
                ) : (
                  prorationList.map((unit) => {
                    const isPaid = unit.paymentStatus === PaymentStatus.PAID;
                    return (
                      <tr key={unit.unitId} className="hover:bg-muted-bg/30 transition-colors">
                        <td className="px-5 py-3.5 font-bold">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-6 h-6 rounded-md bg-brand/10 text-brand flex items-center justify-center text-[10px] font-bold">
                              {unit.unitNumber}
                            </span>
                            <span>{unit.floor ? `Piso ${unit.floor}` : `UF ${unit.unitNumber}`}</span>
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-foreground">
                            {unit.tenantName || unit.ownerName}
                          </div>
                          {unit.tenantName && unit.ownerName && (
                            <div className="text-[10px] text-muted flex items-center gap-1">
                              <span className="font-medium text-slate-500">Prop:</span>
                              <span>{unit.ownerName}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-center font-mono font-semibold">
                          {isDraft ? (
                            <button
                              type="button"
                              onClick={() => setIsAdjustCoefficientsOpen(true)}
                              className="hover:text-brand hover:underline cursor-pointer inline-flex items-center gap-1"
                              title="Clic para ajustar coeficientes de prorrateo"
                            >
                              <span>{unit.coefficient.toFixed(3)}%</span>
                              <span className="text-[10px] text-muted">✏️</span>
                            </button>
                          ) : (
                            `${unit.coefficient.toFixed(3)}%`
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right font-medium">
                          ${unit.ordinaryAmount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-5 py-3.5 text-right font-medium text-purple-600 dark:text-purple-400">
                          ${unit.extraordinaryAmount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-5 py-3.5 text-right font-medium">
                          {unit.previousDebt > 0 ? (
                            <span className="text-amber-600 dark:text-amber-400 font-bold">
                              ${unit.previousDebt.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                              {unit.interestAmount > 0 && ` (+int)`}
                            </span>
                          ) : (
                            <span className="text-muted">$0.00</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right font-black text-foreground">
                          ${unit.totalPayable.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          {isPaid ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                              ✓ Pagado
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400">
                              Pendiente
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {/* Ver liquidación individual */}
                            <button
                              onClick={() =>
                                setSelectedReceiptForPrint({
                                  id: unit.receiptId || unit.unitId,
                                  unitNumber: unit.unitNumber,
                                  floor: unit.floor,
                                  door: unit.door,
                                  code: unit.code,
                                  ownerName: unit.ownerName,
                                  tenantName: unit.tenantName,
                                  coefficient: unit.coefficient,
                                  ordinaryAmount: unit.ordinaryAmount,
                                  extraordinaryAmount: unit.extraordinaryAmount,
                                  previousDebt: unit.previousDebt,
                                  interestAmount: unit.interestAmount,
                                  totalPayable: unit.totalPayable,
                                  paymentStatus: unit.paymentStatus || "PENDING",
                                  paidAt: unit.paidAt,
                                  paymentMethod: unit.paymentMethod,
                                  paymentReference: unit.paymentReference,
                                  receiptNumber: unit.receiptNumber,
                                })
                              }
                              title="Ver liquidación individual de expensas"
                              className="px-2.5 py-1 rounded-lg border border-border text-[11px] font-semibold hover:bg-muted-bg text-foreground transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <span>📄</span>
                              <span>Ver Liquidación</span>
                            </button>

                            {/* Registrar cobro (si está publicado y pendiente de pago) */}
                            {!isDraft && !isPaid && unit.receiptId && (
                              <button
                                onClick={() =>
                                  setSelectedTargetForPayment({
                                    id: unit.receiptId!,
                                    unitNumber: unit.unitNumber,
                                    ownerName: unit.ownerName,
                                    tenantName: unit.tenantName,
                                    totalPayable: unit.totalPayable,
                                  })
                                }
                                title="Registrar cobranza de la unidad"
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-colors cursor-pointer shadow-xs flex items-center gap-1"
                              >
                                <span>💵</span>
                                <span>Registrar Cobro</span>
                              </button>
                            )}

                            {/* Recibo Oficial de Pago (si está pagado) */}
                            {!isDraft && isPaid && (
                              <button
                                onClick={() =>
                                  setSelectedPaymentReceipt({
                                    receiptId: unit.receiptId || unit.unitId,
                                    receiptNumber:
                                      unit.receiptNumber ||
                                      `REC-${liquidation.year}${String(liquidation.month).padStart(2, "0")}-${unit.unitNumber.replace(/\s+/g, "")}`,
                                    unitNumber: unit.unitNumber,
                                    floor: unit.floor,
                                    door: unit.door,
                                    ownerName: unit.ownerName,
                                    tenantName: unit.tenantName,
                                    paidAmount: unit.totalPayable,
                                    paidAt: unit.paidAt || null,
                                    paymentMethod: unit.paymentMethod || "Transferencia Bancaria",
                                    paymentReference: unit.paymentReference || null,
                                    notes: unit.notes || null,
                                    ordinaryAmount: unit.ordinaryAmount,
                                    extraordinaryAmount: unit.extraordinaryAmount,
                                    previousDebt: unit.previousDebt,
                                    interestAmount: unit.interestAmount,
                                  })
                                }
                                title="Ver e imprimir Recibo Oficial de Cobranza / Pago"
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1"
                              >
                                <span>🧾</span>
                                <span>Recibo de Pago</span>
                              </button>
                            )}
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
      )}

      {/* TAB 2: Gastos y Facturas */}
      {activeTab === "items" && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-xs">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-foreground">Comprobantes y Gastos del Período</h3>
              <p className="text-xs text-muted mt-0.5">
                Facturas ingresadas que componen el monto total a distribuir.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsExpenseTablePrintOpen(true)}
                className="bg-card border border-border hover:bg-muted-bg text-foreground text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                title="Imprimir planilla de comprobantes y gastos del período"
              >
                <span>🖨️</span>
                <span>Imprimir Gastos</span>
              </button>

              {isDraft && (
                <AddExpenseItemModal
                  liquidationId={liquidation.id}
                  buildingId={liquidation.buildingId}
                  isDraft={true}
                />
              )}

              {isPublished && (
                <EditLiquidationModal
                  liquidation={{
                    id: liquidation.id,
                    buildingName: liquidation.buildingName,
                    buildingAddress: liquidation.buildingAddress,
                    month: liquidation.month,
                    year: liquidation.year,
                    status: liquidation.status,
                    dueDateFirst: liquidation.dueDateFirst,
                    dueDateSecond: liquidation.dueDateSecond,
                    interestRate: liquidation.interestRate,
                    notes: liquidation.notes,
                  }}
                  trigger={
                    <button
                      type="button"
                      className="px-3.5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                      title="Reabrir a borrador para modificar facturas"
                    >
                      <span>🔓</span>
                      <span>Reabrir para Modificar Gastos</span>
                    </button>
                  }
                />
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted-bg/60 text-muted border-b border-border font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3">Concepto / Rubro</th>
                  <th className="px-5 py-3">Categoría</th>
                  <th className="px-5 py-3">Proveedor</th>
                  <th className="px-5 py-3">Nro. Comprobante</th>
                  <th className="px-5 py-3">Fecha</th>
                  <th className="px-5 py-3 text-right">Monto ($)</th>
                  {isDraft && <th className="px-5 py-3 text-center">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-foreground">
                {liquidation.items.length === 0 ? (
                  <tr>
                    <td colSpan={isDraft ? 7 : 6} className="px-5 py-12 text-center text-muted">
                      Todavía no se cargaron facturas ni gastos para este período.
                      {isDraft && (
                        <div className="mt-3">
                          <AddExpenseItemModal
                            liquidationId={liquidation.id}
                            buildingId={liquidation.buildingId}
                            isDraft={true}
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  liquidation.items.map((item) => (
                    <tr key={item.id} className="hover:bg-muted-bg/30 transition-colors">
                      <td className="px-5 py-3.5 font-semibold">
                        {isDraft ? (
                          <EditExpenseItemModal
                            item={item}
                            trigger={
                              <span
                                className="hover:text-brand hover:underline cursor-pointer"
                                title="Clic para editar este gasto"
                              >
                                {item.description}
                              </span>
                            }
                          />
                        ) : (
                          item.description
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            item.category === ExpenseCategory.EXTRAORDINARY
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-400"
                              : item.category === ExpenseCategory.RESERVE_FUND
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400"
                          }`}
                        >
                          {CATEGORY_NAMES[item.category]}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-muted">{item.supplierName || "-"}</td>
                      <td className="px-5 py-3.5 font-mono text-[11px] text-muted">
                        {item.invoiceNumber || "-"}
                      </td>
                      <td className="px-5 py-3.5 text-muted">
                        {new Date(item.date).toLocaleDateString("es-AR")}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-right text-foreground">
                        ${item.amount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </td>
                      {isDraft && (
                        <td className="px-5 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <EditExpenseItemModal item={item} />
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              disabled={isPending}
                              title="Eliminar gasto"
                              className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-500/10 transition-colors cursor-pointer text-xs"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Confirmación para Emitir / Publicar Expensas */}
      {showPublishConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center text-2xl mx-auto">
              🚀
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-foreground">¿Emitir Liquidación Oficial?</h3>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Esta acción prorrateará los{" "}
                <strong className="text-foreground">
                  ${summary.totalExpenses.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </strong>{" "}
                entre las {prorationList.length} unidades funcionales según su coeficiente, creará los
                comprobantes de pago y habilitará la cobranza.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-muted-bg/60 border border-border text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted">Total Gastos:</span>
                <span className="font-bold text-foreground">
                  ${summary.totalExpenses.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Deuda previa acumulada:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  ${summary.totalPreviousDebt.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-1.5 font-bold">
                <span className="text-foreground">Total Liquidado a Cobrar:</span>
                <span className="text-brand">
                  ${summary.grandTotalPayable.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPublishConfirmation(false)}
                disabled={isPending}
                className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted-bg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={isPending}
                className="px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isPending ? "Emitiendo..." : "Confirmar y Publicar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Comprobante Formal Imprimible */}
      {selectedReceiptForPrint && (
        <ReceiptPrintModal
          receipt={selectedReceiptForPrint}
          buildingInfo={buildingReceiptInfo}
          onClose={() => setSelectedReceiptForPrint(null)}
        />
      )}

      {/* Modal para Registrar Pago */}
      {selectedTargetForPayment && (
        <RegisterPaymentModal
          target={selectedTargetForPayment}
          onClose={() => setSelectedTargetForPayment(null)}
        />
      )}

      {/* Modal de Recibo Oficial de Cobranza / Pago */}
      {selectedPaymentReceipt && (
        <PaymentReceiptModal
          isOpen={!!selectedPaymentReceipt}
          onClose={() => setSelectedPaymentReceipt(null)}
          payment={selectedPaymentReceipt}
          buildingInfo={{
            buildingName: liquidation.buildingName,
            buildingAddress: liquidation.buildingAddress,
            buildingCuit: liquidation.buildingCuit,
            city: liquidation.city,
            month: liquidation.month,
            year: liquidation.year,
          }}
        />
      )}

      {/* Modal de Planilla de Respaldo Contable / Rendición de Cuentas */}
      <LiquidationAuditSheetModal
        isOpen={isAuditSheetOpen}
        onClose={() => setIsAuditSheetOpen(false)}
        liquidation={liquidation}
        prorationList={prorationList}
        summary={summary}
      />

      {/* Modal de Impresión de la Tabla de Gastos */}
      <ExpenseTablePrintModal
        isOpen={isExpenseTablePrintOpen}
        onClose={() => setIsExpenseTablePrintOpen(false)}
        liquidation={{
          id: liquidation.id,
          buildingName: liquidation.buildingName,
          buildingAddress: liquidation.buildingAddress,
          buildingCuit: liquidation.buildingCuit,
          city: liquidation.city,
          month: liquidation.month,
          year: liquidation.year,
          items: liquidation.items,
        }}
        summary={{
          totalOrdinaryA: summary.totalOrdinary,
          totalOrdinaryB: 0,
          totalExtraordinary: summary.totalExtraordinary,
          totalReserveFund: summary.totalReserveFund,
          totalExpenses: summary.totalExpenses,
        }}
      />

      {/* Modal para Ajustar Coeficientes de Prorrateo Flexible */}
      {isAdjustCoefficientsOpen && (
        <AdjustProrationCoefficientsModal
          isOpen={isAdjustCoefficientsOpen}
          onClose={() => setIsAdjustCoefficientsOpen(false)}
          buildingId={liquidation.buildingId}
          buildingName={liquidation.buildingName}
          units={prorationList.map((p) => ({
            unitId: p.unitId,
            unitNumber: p.unitNumber,
            floor: p.floor,
            door: p.door,
            unitType: p.unitType,
            ownerName: p.ownerName,
            tenantName: p.tenantName,
            coefficient: p.coefficient,
            totalPayable: p.totalPayable,
          }))}
        />
      )}
    </div>
  );
}
