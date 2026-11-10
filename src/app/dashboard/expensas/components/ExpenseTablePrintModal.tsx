"use client";

import { useRef } from "react";
import { ExpenseCategory } from "@prisma/client";

export interface ExpenseTablePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  liquidation: {
    id: string;
    buildingName: string;
    buildingAddress: string;
    buildingCuit?: string | null;
    city: string;
    month: number;
    year: number;
    items: Array<{
      id: string;
      category: ExpenseCategory;
      description: string;
      supplierName: string | null;
      invoiceNumber: string | null;
      amount: number;
      date: Date | string;
    }>;
  };
  summary?: {
    totalOrdinaryA?: number;
    totalOrdinaryB?: number;
    totalExtraordinary?: number;
    totalReserveFund?: number;
    totalExpenses?: number;
  };
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

export function ExpenseTablePrintModal({
  isOpen,
  onClose,
  liquidation,
  summary,
}: ExpenseTablePrintModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const periodLabel = `${MONTH_NAMES[liquidation.month - 1]} ${liquidation.year}`.toUpperCase();
  const todayStr = new Date().toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const totalOrdinaryA =
    summary?.totalOrdinaryA ??
    liquidation.items
      .filter((i) => i.category === ExpenseCategory.ORDINARY_A)
      .reduce((sum, i) => sum + Number(i.amount), 0);

  const totalOrdinaryB =
    summary?.totalOrdinaryB ??
    liquidation.items
      .filter((i) => i.category === ExpenseCategory.ORDINARY_B)
      .reduce((sum, i) => sum + Number(i.amount), 0);

  const totalExtraordinary =
    summary?.totalExtraordinary ??
    liquidation.items
      .filter((i) => i.category === ExpenseCategory.EXTRAORDINARY)
      .reduce((sum, i) => sum + Number(i.amount), 0);

  const totalReserveFund =
    summary?.totalReserveFund ??
    liquidation.items
      .filter((i) => i.category === ExpenseCategory.RESERVE_FUND)
      .reduce((sum, i) => sum + Number(i.amount), 0);

  const totalExpenses =
    summary?.totalExpenses ??
    liquidation.items.reduce((sum, i) => sum + Number(i.amount), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
      {/* Botón flotante siempre visible para cerrar */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-50 print:hidden bg-slate-950/95 hover:bg-red-600 text-white border border-slate-700 hover:border-red-500 px-3.5 py-2 rounded-full text-xs font-bold shadow-2xl flex items-center gap-1.5 transition-all cursor-pointer"
        title="Cerrar planilla"
      >
        <span className="text-sm font-black">✕</span>
        <span>Cerrar</span>
      </button>

      {/* Contenedor Principal (Hoja de Papel Formal) */}
      <div className="w-full max-w-4xl my-4 sm:my-8 bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-300 print:border-none print:shadow-none print:m-0 print:rounded-none print:max-w-none print:w-full">
        {/* Barra Superior de Controles (Visible en pantalla, oculta al imprimir) */}
        <div className="sticky top-0 z-30 px-6 py-3.5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 print:hidden shadow-lg">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">📑</span>
            <div>
              <span className="text-xs font-bold text-white tracking-wide block">
                Planilla de Comprobantes y Gastos del Período
              </span>
              <span className="text-[11px] text-slate-400">
                Consorcio {liquidation.buildingName} • {periodLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-2"
            >
              <span>🖨️</span>
              <span>Imprimir / Guardar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-red-600 text-white text-xs font-bold rounded-xl border border-slate-700 hover:border-red-500 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <span className="text-sm font-black">✕</span>
              <span>Cerrar</span>
            </button>
          </div>
        </div>

        {/* Hoja de Papel A4 Formal */}
        <div
          ref={printRef}
          className="p-8 sm:p-10 bg-white text-slate-900 space-y-6 text-xs font-sans print:p-6 print:m-0"
        >
          {/* Encabezado: Consorcio & Período */}
          <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="font-black text-xl text-slate-950 tracking-tight">
                CONSORCIO {liquidation.buildingName.toUpperCase()}
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                {liquidation.buildingAddress}, {liquidation.city}
              </p>
              {liquidation.buildingCuit && (
                <p className="text-xs text-slate-600">
                  CUIT: <span className="font-mono">{liquidation.buildingCuit}</span>
                </p>
              )}
            </div>

            <div className="text-left sm:text-right">
              <div className="inline-block bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-lg mb-1">
                <span className="text-[11px] font-black tracking-wider text-slate-800 uppercase">
                  PLANILLA DE COMPROBANTES Y GASTOS
                </span>
              </div>
              <p className="text-sm font-bold text-slate-900 mt-1">
                PERÍODO: <span className="text-indigo-900">{periodLabel}</span>
              </p>
              <p className="text-[11px] text-slate-500">Fecha de emisión: {todayStr}</p>
            </div>
          </div>

          {/* Resumen de Subtotales por Categoría */}
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-2">
              Resumen Consolidado de Gastos del Período
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  Ordinarios A
                </span>
                <span className="text-sm font-black text-slate-900">
                  ${totalOrdinaryA.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  Ordinarios B
                </span>
                <span className="text-sm font-black text-slate-900">
                  ${totalOrdinaryB.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  Extraordinarios
                </span>
                <span className="text-sm font-black text-slate-900">
                  ${totalExtraordinary.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl">
                <span className="text-[10px] font-bold text-indigo-700 uppercase block">
                  Total General
                </span>
                <span className="text-sm font-black text-indigo-950">
                  ${totalExpenses.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Tabla de Facturas y Comprobantes */}
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-2">
              Detalle Pormenorizado de Comprobantes ({liquidation.items.length})
            </h3>
            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-300">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3">Concepto / Rubro</th>
                    <th className="py-2.5 px-3">Categoría</th>
                    <th className="py-2.5 px-3">Proveedor</th>
                    <th className="py-2.5 px-3">Nro. Comprobante</th>
                    <th className="py-2.5 px-3">Fecha</th>
                    <th className="py-2.5 px-3 text-right">Monto ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {liquidation.items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-500 italic">
                        No hay comprobantes cargados para este período.
                      </td>
                    </tr>
                  ) : (
                    liquidation.items.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[10px]">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {item.description}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            {CATEGORY_NAMES[item.category]}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {item.supplierName || "-"}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          {item.invoiceNumber || "-"}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {new Date(item.date).toLocaleDateString("es-AR")}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          ${item.amount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-slate-100/80 border-t-2 border-slate-900 font-black text-slate-950">
                  <tr>
                    <td colSpan={6} className="py-3 px-3 text-right uppercase text-[11px]">
                      Total Gastos Abonados / Devengados:
                    </td>
                    <td className="py-3 px-3 text-right text-sm font-black text-slate-950">
                      ${totalExpenses.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Pie de Página Formal y Firma */}
          <div className="pt-6 border-t border-slate-300 flex flex-col sm:flex-row justify-between items-end gap-6 text-[11px] text-slate-500">
            <div className="max-w-md space-y-1">
              <p className="font-semibold text-slate-700">Constancia Contable y Legal:</p>
              <p className="leading-relaxed">
                Los comprobantes y facturas detallados en la presente planilla corresponden a los gastos
                devengados y abonados por el Consorcio en el período indicado. La documentación respaldatoria
                se encuentra archivada en la Administración a disposición de los copropietarios.
              </p>
            </div>

            <div className="w-56 text-center border-t border-slate-400 pt-2 shrink-0">
              <span className="block font-bold text-slate-800 text-xs">
                Administración del Consorcio
              </span>
              <span className="text-[10px] text-slate-500">Firma y Sello Autorizado</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
