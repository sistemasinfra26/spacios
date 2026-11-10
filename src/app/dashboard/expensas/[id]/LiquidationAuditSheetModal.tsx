"use client";

import React, { useRef } from "react";
import { ExpenseCategory, LiquidationStatus, PaymentStatus } from "@prisma/client";
import type { UnitProrationPreview, LiquidationFinancialSummary } from "@/app/actions/expenses";

export interface AuditSheetLiquidationInfo {
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

const CATEGORY_FORMAT: Record<ExpenseCategory, { label: string; badgeClass: string }> = {
  [ExpenseCategory.ORDINARY_A]: {
    label: "Ordinario A",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  [ExpenseCategory.ORDINARY_B]: {
    label: "Ordinario B",
    badgeClass: "bg-cyan-50 text-cyan-700 border-cyan-200",
  },
  [ExpenseCategory.EXTRAORDINARY]: {
    label: "Extraordinario",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  [ExpenseCategory.RESERVE_FUND]: {
    label: "Fondo de Reserva",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
  },
};

export function LiquidationAuditSheetModal({
  isOpen,
  onClose,
  liquidation,
  prorationList,
  summary,
}: {
  isOpen: boolean;
  onClose: () => void;
  liquidation: AuditSheetLiquidationInfo;
  prorationList: UnitProrationPreview[];
  summary: LiquidationFinancialSummary;
}) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const periodLabel = `${MONTH_NAMES[liquidation.month - 1]} ${liquidation.year}`.toUpperCase();
  const dueDateFirstStr = new Date(liquidation.dueDateFirst).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const dueDateSecondStr = liquidation.dueDateSecond
    ? new Date(liquidation.dueDateSecond).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  // Cálculo detallado de subtotales por rubro
  const subtotalOrdinaryA = liquidation.items
    .filter((i) => i.category === ExpenseCategory.ORDINARY_A)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const subtotalOrdinaryB = liquidation.items
    .filter((i) => i.category === ExpenseCategory.ORDINARY_B)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const subtotalExtraordinary = liquidation.items
    .filter((i) => i.category === ExpenseCategory.EXTRAORDINARY)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const subtotalReserveFund = liquidation.items
    .filter((i) => i.category === ExpenseCategory.RESERVE_FUND)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalOrdinaryCombined = subtotalOrdinaryA + subtotalOrdinaryB;
  const grandTotalExpenses = totalOrdinaryCombined + subtotalExtraordinary + subtotalReserveFund;

  // Totales de la planilla de prorrateo
  const sumCoefficients = prorationList.reduce((acc, u) => acc + (u.coefficient || 0), 0);
  const sumOrdinaryProrated = prorationList.reduce((acc, u) => acc + (u.ordinaryAmount || 0), 0);
  const sumExtraordinaryProrated = prorationList.reduce((acc, u) => acc + (u.extraordinaryAmount || 0), 0);
  const sumPreviousDebt = prorationList.reduce((acc, u) => acc + (u.previousDebt || 0) + (u.interestAmount || 0), 0);
  const sumTotalPayable = prorationList.reduce((acc, u) => acc + (u.totalPayable || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
      {/* Botón flotante siempre visible para cerrar con 1 clic */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-50 print:hidden bg-slate-950/95 hover:bg-red-600 text-white border border-slate-700 hover:border-red-500 px-3.5 py-2 rounded-full text-xs font-bold shadow-2xl flex items-center gap-1.5 transition-all cursor-pointer"
        title="Cerrar planilla"
      >
        <span className="text-sm font-black">✕</span>
        <span>Cerrar</span>
      </button>

      {/* Contenedor Modal / Hoja de Documento */}
      <div className="w-full max-w-5xl my-4 sm:my-8 bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-300 print:border-none print:shadow-none print:m-0 print:rounded-none print:max-w-none print:w-full">
        {/* Barra Superior de Control Sticky (Oculta al imprimir) */}
        <div className="sticky top-0 z-30 px-6 py-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 print:hidden shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-xl">📊</span>
            <div>
              <h2 className="text-sm font-bold tracking-wide">
                Planilla de Respaldo Contable & Rendición de Cuentas
              </h2>
              <p className="text-xs text-slate-400">
                {liquidation.buildingName} • Período: {periodLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-2"
            >
              <span>🖨️</span>
              <span>Imprimir / Exportar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-red-600 text-white text-xs font-bold rounded-xl border border-slate-700 hover:border-red-500 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <span className="text-sm font-black">✕</span>
              <span>Cerrar</span>
            </button>
          </div>
        </div>

        {/* Documento Formal A4 */}
        <div
          ref={printRef}
          className="p-8 sm:p-10 bg-white text-slate-900 space-y-6 text-xs font-sans print:p-6 print:m-0"
        >
          {/* 1. MEMBRETE FORMAL DEL CONSORCIO */}
          <div className="border-b-2 border-slate-800 pb-5">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">
                  Consorcio de Propietarios
                </span>
                <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
                  {liquidation.buildingName}
                </h1>
                <p className="text-xs text-slate-600 mt-0.5">
                  {liquidation.buildingAddress}, {liquidation.city}
                </p>
                {liquidation.buildingCuit ? (
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">
                    CUIT Consorcio: <span className="font-mono">{liquidation.buildingCuit}</span>
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic mt-0.5">CUIT: No registrado</p>
                )}
              </div>

              <div className="sm:text-right bg-slate-50 border border-slate-200 rounded-xl p-3 min-w-[240px]">
                <div className="text-[10px] uppercase font-bold text-slate-500">
                  Rendición Oficial de Cuentas
                </div>
                <div className="text-base font-black text-indigo-700 tracking-tight mt-0.5 font-mono">
                  PERÍODO: {periodLabel}
                </div>
                <div className="text-[11px] text-slate-600 mt-1">
                  1º Vencimiento: <strong className="text-slate-800">{dueDateFirstStr}</strong>
                </div>
                {dueDateSecondStr && (
                  <div className="text-[11px] text-slate-600">
                    2º Vencimiento:{" "}
                    <strong className="text-slate-800">
                      {dueDateSecondStr} (+{liquidation.interestRate || 0}%)
                    </strong>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. PLANILLA DESGLOSADA DE GASTOS Y COMPROBANTES */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <span>1.</span>
                <span>Planilla Desglosada de Gastos del Período</span>
              </h2>
              <span className="text-[11px] text-slate-500 font-medium">
                {liquidation.items.length} {liquidation.items.length === 1 ? "comprobante" : "comprobantes"}
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-300 rounded-lg">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                    <th className="py-2 px-2.5 w-24">Fecha</th>
                    <th className="py-2 px-2.5 w-28">Rubro</th>
                    <th className="py-2 px-2.5">Proveedor / Empresa</th>
                    <th className="py-2 px-2.5">Concepto / Detalle</th>
                    <th className="py-2 px-2.5 w-32 font-mono text-center">N° Comprobante</th>
                    <th className="py-2 px-2.5 text-right w-28 font-mono">Monto ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {liquidation.items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                        No se registraron comprobantes de gasto en esta liquidación.
                      </td>
                    </tr>
                  ) : (
                    liquidation.items.map((item) => {
                      const catInfo = CATEGORY_FORMAT[item.category] || {
                        label: item.category,
                        badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
                      };
                      return (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2 px-2.5 font-mono text-slate-600 whitespace-nowrap">
                            {new Date(item.date).toLocaleDateString("es-AR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-2 px-2.5">
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border ${catInfo.badgeClass}`}
                            >
                              {catInfo.label}
                            </span>
                          </td>
                          <td className="py-2 px-2.5 font-semibold text-slate-800">
                            {item.supplierName || "—"}
                          </td>
                          <td className="py-2 px-2.5 text-slate-700">{item.description}</td>
                          <td className="py-2 px-2.5 font-mono text-slate-600 text-center whitespace-nowrap">
                            {item.invoiceNumber || "—"}
                          </td>
                          <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                            ${item.amount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. TOTALES CONSOLIDADOS POR RUBRO */}
          <div className="flex flex-col sm:flex-row justify-end items-start pt-1">
            <div className="w-full sm:w-96 bg-slate-50 border border-slate-300 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="font-bold uppercase tracking-wider text-slate-700 text-[10px] border-b border-slate-200 pb-1.5">
                Consolidación de Gastos Operativos
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Ordinarias A:</span>
                <span className="font-mono font-semibold text-slate-800">
                  ${subtotalOrdinaryA.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Ordinarias B:</span>
                <span className="font-mono font-semibold text-slate-800">
                  ${subtotalOrdinaryB.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Extraordinarias:</span>
                <span className="font-mono font-semibold text-slate-800">
                  ${subtotalExtraordinary.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Fondo de Reserva:</span>
                <span className="font-mono font-semibold text-slate-800">
                  ${subtotalReserveFund.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="border-t-2 border-slate-800 pt-2 flex justify-between font-black text-slate-900 text-sm">
                <span>TOTAL GASTOS DEL PERÍODO:</span>
                <span className="font-mono text-indigo-700">
                  ${grandTotalExpenses.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* 4. PADRÓN DE PRORRATEO Y DISTRIBUCIÓN POR UNIDAD FUNCIONAL */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <span>2.</span>
                <span>Padrón de Prorrateo y Distribución por Unidad Funcional</span>
              </h2>
              <span className="text-[11px] text-slate-500 font-medium">
                {prorationList.length} {prorationList.length === 1 ? "unidad" : "unidades"}
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-300 rounded-lg">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                    <th className="py-2 px-2.5 w-16">U.F.</th>
                    <th className="py-2 px-2.5 w-24">Piso / Dpto</th>
                    <th className="py-2 px-2.5">Titular / Propietario</th>
                    <th className="py-2 px-2.5 text-right w-20 font-mono">Coef. (%)</th>
                    <th className="py-2 px-2.5 text-right w-24 font-mono">Cuota Ord.</th>
                    <th className="py-2 px-2.5 text-right w-24 font-mono">Extraord.</th>
                    <th className="py-2 px-2.5 text-right w-24 font-mono">Deuda/Mora</th>
                    <th className="py-2 px-2.5 text-right w-28 font-mono">Total a Pagar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {prorationList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-400 italic">
                        No hay unidades funcionales configuradas para este edificio.
                      </td>
                    </tr>
                  ) : (
                    prorationList.map((unit) => {
                      const floorDoorText = [
                        unit.floor !== null && unit.floor !== undefined ? `${unit.floor}°` : "",
                        unit.door || "",
                      ]
                        .filter(Boolean)
                        .join(" ");

                      const totalDebtWithInterest =
                        (unit.previousDebt || 0) + (unit.interestAmount || 0);

                      return (
                        <tr key={unit.unitId} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2 px-2.5 font-bold text-slate-900 whitespace-nowrap">
                            {unit.unitNumber}
                          </td>
                          <td className="py-2 px-2.5 text-slate-600 whitespace-nowrap">
                            {floorDoorText || "—"}
                          </td>
                          <td className="py-2 px-2.5 font-medium text-slate-800">
                            {unit.tenantName ? (
                              <div>
                                <span className="font-bold text-slate-950">{unit.tenantName}</span>
                                <span className="block text-[10px] text-slate-500">Prop: {unit.ownerName}</span>
                              </div>
                            ) : (
                              unit.ownerName
                            )}
                          </td>
                          <td className="py-2 px-2.5 text-right font-mono text-slate-600 whitespace-nowrap">
                            {Number(unit.coefficient).toFixed(3)}%
                          </td>
                          <td className="py-2 px-2.5 text-right font-mono text-slate-800 whitespace-nowrap">
                            ${unit.ordinaryAmount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-2.5 text-right font-mono text-slate-800 whitespace-nowrap">
                            ${unit.extraordinaryAmount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-2.5 text-right font-mono text-slate-600 whitespace-nowrap">
                            {totalDebtWithInterest > 0 ? (
                              <span className="text-amber-700 font-semibold">
                                ${totalDebtWithInterest.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                              </span>
                            ) : (
                              "$0.00"
                            )}
                          </td>
                          <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                            ${unit.totalPayable.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {prorationList.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                      <td colSpan={3} className="py-2 px-2.5 text-right uppercase text-[10px]">
                        Totales Consorcio:
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono">
                        {sumCoefficients.toFixed(3)}%
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono">
                        ${sumOrdinaryProrated.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono">
                        ${sumExtraordinaryProrated.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono">
                        ${sumPreviousDebt.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono font-black text-indigo-700">
                        ${sumTotalPayable.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Notas o Observaciones de la Liquidación */}
          {liquidation.notes && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
              <span className="font-bold text-[10px] uppercase text-slate-500 block mb-1">
                Observaciones de la Administración:
              </span>
              <p className="text-xs whitespace-pre-line leading-relaxed">{liquidation.notes}</p>
            </div>
          )}

          {/* 5. FIRMAS Y PIE FORMAL */}
          <div className="pt-10 border-t border-slate-300 grid grid-cols-2 gap-12 text-center text-[11px] text-slate-600 page-break-inside-avoid">
            <div>
              <div className="w-56 border-b border-slate-400 mx-auto mb-2"></div>
              <p className="font-bold text-slate-800 uppercase tracking-wider">
                Administración de Consorcios
              </p>
              <p className="text-[10px] text-slate-500">Firma y Sello Acreditado</p>
            </div>
            <div>
              <div className="w-56 border-b border-slate-400 mx-auto mb-2"></div>
              <p className="font-bold text-slate-800 uppercase tracking-wider">
                Consejo de Propietarios
              </p>
              <p className="text-[10px] text-slate-500">Revisión y Aprobación de Cuentas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

