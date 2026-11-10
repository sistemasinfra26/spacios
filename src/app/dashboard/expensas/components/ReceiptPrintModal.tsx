"use client";

import { useRef } from "react";

export interface ReceiptData {
  id: string;
  unitNumber: string;
  floor: number | null;
  door?: string | null;
  code?: string | null;
  ownerName: string;
  tenantName?: string | null;
  coefficient: number;
  ordinaryAmount: number;
  extraordinaryAmount: number;
  previousDebt: number;
  interestAmount: number;
  totalPayable: number;
  paymentStatus: "PENDING" | "PAID" | "OVERDUE";
  paidAt?: Date | null;
  paymentMethod?: string | null;
  paymentReference?: string | null;
  receiptNumber?: string | null;
}

export interface BuildingReceiptInfo {
  buildingName: string;
  buildingAddress: string;
  buildingCuit?: string | null;
  city: string;
  month: number;
  year: number;
  dueDateFirst: string | Date;
  dueDateSecond?: string | Date | null;
  interestRate?: number | null;
  totalBuildingExpenses: number;
  notes?: string | null;
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export function ReceiptPrintModal({
  receipt,
  buildingInfo,
  onClose,
}: {
  receipt: ReceiptData;
  buildingInfo: BuildingReceiptInfo;
  onClose: () => void;
}) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const periodName = `${MONTH_NAMES[buildingInfo.month - 1]} ${buildingInfo.year}`.toUpperCase();
  const dueDateFirstStr = new Date(buildingInfo.dueDateFirst).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const dueDateSecondStr = buildingInfo.dueDateSecond
    ? new Date(buildingInfo.dueDateSecond).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  const surchargeAmount = buildingInfo.interestRate
    ? Number((receipt.totalPayable * (1 + buildingInfo.interestRate / 100)).toFixed(2))
    : receipt.totalPayable;

  const floorDoorText = [
    receipt.floor !== null && receipt.floor !== undefined ? `Piso ${receipt.floor}` : "",
    receipt.door ? `Dpto ${receipt.door}` : "",
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
      {/* Botón flotante siempre visible para cerrar */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-50 print:hidden bg-slate-950/95 hover:bg-red-600 text-white border border-slate-700 hover:border-red-500 px-3.5 py-2 rounded-full text-xs font-bold shadow-2xl flex items-center gap-1.5 transition-all cursor-pointer"
        title="Cerrar comprobante"
      >
        <span className="text-sm font-black">✕</span>
        <span>Cerrar</span>
      </button>

      {/* Contenedor Principal (Hoja de Papel Formal) */}
      <div className="w-full max-w-3xl my-4 sm:my-8 bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-300 print:border-none print:shadow-none print:m-0 print:rounded-none print:max-w-none print:w-full">
        {/* Barra Superior de Controles (Visible en pantalla, oculta al imprimir) */}
        <div className="sticky top-0 z-30 px-6 py-3.5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 print:hidden shadow-lg">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">📄</span>
            <div>
              <span className="text-xs font-bold text-white tracking-wide block">
                Liquidación Individual de Expensas
              </span>
              <span className="text-[11px] text-slate-400">
                U.F. {receipt.unitNumber} • {buildingInfo.buildingName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-2"
            >
              <span>🖨️</span>
              <span>Imprimir / Descargar PDF</span>
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
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="font-black text-xl text-slate-950 tracking-tight">
                  CONSORCIO {buildingInfo.buildingName.toUpperCase()}
                </h2>
                {receipt.paymentStatus === "PAID" ? (
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-[10px] font-black border border-emerald-300 uppercase tracking-wider">
                    ✓ PAGADO
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-black border border-amber-300 uppercase tracking-wider">
                    ● PENDIENTE DE PAGO
                  </span>
                )}
              </div>
              <p className="text-slate-700 text-xs font-medium mt-1">
                {buildingInfo.buildingAddress} • {buildingInfo.city}
              </p>
              {buildingInfo.buildingCuit ? (
                <p className="text-slate-600 text-[11px] mt-0.5 font-normal">
                  CUIT Consorcio: <span className="font-mono font-semibold">{buildingInfo.buildingCuit}</span>
                </p>
              ) : (
                <p className="text-slate-500 text-[11px] mt-0.5 font-normal">
                  Administración de Consorcios
                </p>
              )}
            </div>

            <div className="sm:text-right shrink-0 bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-[10px] uppercase tracking-wider text-slate-600 font-bold block">
                Aviso de Cobro
              </span>
              <p className="text-sm font-black text-indigo-700 uppercase tracking-tight mt-0.5">
                LIQUIDACIÓN INDIVIDUAL DE EXPENSAS
              </p>
              <p className="text-xs font-black text-slate-950 mt-1 font-mono">
                PERÍODO: {periodName}
              </p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                Emisión: {new Date().toLocaleDateString("es-AR")}
              </p>
            </div>
          </div>

          {/* Cajas: Datos de la Unidad, Inquilino & Propietario */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-300 rounded-xl p-4.5 text-slate-900">
            {/* Columna Izquierda: Unidad, Inquilino y Propietario */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-600 tracking-wider block">
                Datos de la Unidad & Ocupante
              </span>
              <p className="text-sm font-black text-slate-950">
                U.F. {receipt.unitNumber} {floorDoorText ? `• ${floorDoorText}` : ""}
              </p>
              {receipt.tenantName ? (
                <>
                  <p className="text-xs text-slate-900 font-medium">
                    Inquilino / Ocupante: <span className="font-extrabold text-slate-950">{receipt.tenantName}</span>
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Propietario del Inmueble: <span className="font-medium text-slate-800">{receipt.ownerName}</span>
                  </p>
                </>
              ) : (
                <p className="text-xs text-slate-800 font-medium">
                  Titular / Propietario: <span className="font-bold text-slate-950">{receipt.ownerName}</span>
                </p>
              )}
              <p className="text-[11px] text-slate-700 font-normal">
                Porcentual / Coeficiente:{" "}
                <span className="font-extrabold text-slate-950">{receipt.coefficient.toFixed(3)} %</span>
              </p>
            </div>

            {/* Columna Derecha: Vencimientos */}
            <div className="space-y-1.5 sm:border-l sm:border-slate-300 sm:pl-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-600 tracking-wider block">
                Fechas de Vencimiento
              </span>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-800 font-medium">1º Vencimiento ({dueDateFirstStr}):</span>
                <span className="font-black text-slate-950 text-base">
                  ${receipt.totalPayable.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              {dueDateSecondStr && (
                <div className="flex justify-between items-center text-xs pt-1.5 border-t border-slate-200">
                  <span className="text-slate-700 font-medium">
                    2º Vencimiento ({dueDateSecondStr}):
                  </span>
                  <span className="font-bold text-slate-900">
                    ${surchargeAmount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Desglose Individual de la Unidad */}
          <div>
            <h3 className="font-black text-xs uppercase tracking-wider text-slate-950 mb-2">
              Composición de la Liquidación Individual
            </h3>
            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-950 font-bold text-[11px] border-b border-slate-300">
                    <th className="p-3">Concepto</th>
                    <th className="p-3 text-center">Porcentual</th>
                    <th className="p-3 text-right">Subtotal ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-900 text-xs">
                  <tr className="bg-white">
                    <td className="p-3 font-medium">
                      Expensas Ordinarias (Gastos comunes, servicios centrales, mantenimiento)
                    </td>
                    <td className="p-3 text-center font-mono font-semibold">
                      {receipt.coefficient.toFixed(3)}%
                    </td>
                    <td className="p-3 text-right font-bold text-slate-950">
                      ${receipt.ordinaryAmount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>

                  {receipt.extraordinaryAmount > 0 && (
                    <tr className="bg-slate-50/70">
                      <td className="p-3 font-medium">
                        Expensas Extraordinarias (Obras y mejoras estructurales)
                      </td>
                      <td className="p-3 text-center font-mono font-semibold">
                        {receipt.coefficient.toFixed(3)}%
                      </td>
                      <td className="p-3 text-right font-bold text-purple-900">
                        ${receipt.extraordinaryAmount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )}

                  {receipt.previousDebt > 0 && (
                    <tr className="bg-amber-50">
                      <td className="p-3 text-amber-950 font-bold">
                        Saldo Deudor Anterior acumulado
                      </td>
                      <td className="p-3 text-center text-amber-900 font-semibold">-</td>
                      <td className="p-3 text-right font-black text-amber-950">
                        ${receipt.previousDebt.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )}

                  {receipt.interestAmount > 0 && (
                    <tr className="bg-amber-50">
                      <td className="p-3 text-amber-950 font-bold">
                        Intereses moratorios aplicados
                      </td>
                      <td className="p-3 text-center text-amber-900 font-semibold">-</td>
                      <td className="p-3 text-right font-black text-amber-950">
                        ${receipt.interestAmount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-950 text-white font-bold text-sm">
                    <td colSpan={2} className="p-3.5 uppercase tracking-wide">
                      Total a Pagar (1º Vencimiento)
                    </td>
                    <td className="p-3.5 text-right font-black text-base text-white">
                      ${receipt.totalPayable.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p className="text-[10px] text-slate-500 italic mt-1.5">
              * El detalle consolidado de comprobantes y facturas que integran el gasto total del consorcio se encuentra a disposición en la Planilla de Respaldo Contable del período.
            </p>
          </div>

          {/* Notas y Medios de Pago */}
          <div className="border-t border-slate-300 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-800">
            <div className="space-y-1">
              <span className="font-bold text-slate-950 block">Notas de la Administración:</span>
              <p className="leading-relaxed text-slate-700 text-[11px]">
                {buildingInfo.notes ||
                  "Se solicita enviar comprobante de transferencia bancaria indicando U.F. y titular para su debida acreditación y emisión del recibo oficial de pago."}
              </p>
            </div>

            <div className="bg-slate-100 p-3.5 rounded-xl border border-slate-300 space-y-1">
              <span className="font-bold text-slate-950 block">Cuentas Bancarias Habilitadas:</span>
              <p className="text-[11px] text-slate-800 font-medium">Banco Galicia • Cuenta Corriente Nº 4019-2 081-3</p>
              <p className="font-mono text-[11px] text-slate-900 font-semibold">CBU: 0070081820000040192083</p>
              <p className="font-mono text-[11px] text-slate-900 font-semibold">ALIAS: CONSORCIO.TERRAZAS</p>
            </div>
          </div>

          {/* Talón de Pago para Desprender (Cupón Bancario) */}
          <div className="border-t-2 border-dashed border-slate-400 pt-5 mt-6">
            <div className="flex justify-between items-center text-[10px] text-slate-600 uppercase tracking-widest mb-2 font-bold">
              <span>✂ Talón de Pago para la Administración / Banco</span>
              <span>U.F. {receipt.unitNumber}</span>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-100 rounded-xl border border-slate-300 gap-3">
              <div>
                <p className="font-black text-slate-950 text-xs">
                  CONSORCIO {buildingInfo.buildingName.toUpperCase()} • {periodName}
                </p>
                <p className="text-xs text-slate-800 font-medium mt-0.5">
                  U.F. {receipt.unitNumber} • {receipt.tenantName ? `${receipt.tenantName} (Inquilino)` : receipt.ownerName}
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
                  1º Vencimiento: {dueDateFirstStr}
                </p>
              </div>

              <div className="sm:text-right w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                <span className="text-[10px] text-slate-600 font-bold block uppercase tracking-wider">
                  Importe a Abonar
                </span>
                <span className="text-lg font-black text-slate-950 block">
                  ${receipt.totalPayable.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Alias para exportación semántica
export const LiquidationSheetModal = ReceiptPrintModal;
