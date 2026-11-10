"use client";

import { useRef } from "react";

export interface PaymentReceiptData {
  receiptId: string;
  receiptNumber: string;
  unitNumber: string;
  floor: number | null;
  door?: string | null;
  ownerName: string;
  tenantName?: string | null;
  paidAmount: number;
  paidAt: Date | string | null;
  paymentMethod: string;
  paymentReference?: string | null;
  notes?: string | null;
  ordinaryAmount: number;
  extraordinaryAmount: number;
  previousDebt?: number;
  interestAmount?: number;
}

export interface BuildingPaymentInfo {
  buildingName: string;
  buildingAddress: string;
  buildingCuit?: string | null;
  city: string;
  month: number;
  year: number;
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export function PaymentReceiptModal({
  isOpen,
  onClose,
  payment,
  buildingInfo,
}: {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentReceiptData;
  buildingInfo: BuildingPaymentInfo;
}) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const periodName = `${MONTH_NAMES[buildingInfo.month - 1]} ${buildingInfo.year}`.toUpperCase();
  const paidDateStr = payment.paidAt
    ? new Date(payment.paidAt).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : new Date().toLocaleDateString("es-AR");

  const floorDoorText = [
    payment.floor !== null && payment.floor !== undefined ? `Piso ${payment.floor}` : "",
    payment.door ? `Dpto ${payment.door}` : "",
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
      {/* Botón flotante siempre visible para cerrar */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-50 print:hidden bg-slate-950/95 hover:bg-red-600 text-white border border-slate-700 hover:border-red-500 px-3.5 py-2 rounded-full text-xs font-bold shadow-2xl flex items-center gap-1.5 transition-all cursor-pointer"
        title="Cerrar recibo"
      >
        <span className="text-sm font-black">✕</span>
        <span>Cerrar</span>
      </button>

      {/* Contenedor Principal (Hoja de Papel Formal) */}
      <div className="w-full max-w-3xl my-4 sm:my-8 bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-300 print:border-none print:shadow-none print:m-0 print:rounded-none print:max-w-none print:w-full">
        {/* Barra Superior de Controles (Visible en pantalla, oculta al imprimir) */}
        <div className="sticky top-0 z-30 px-6 py-3.5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 print:hidden shadow-lg">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">🧾</span>
            <div>
              <span className="text-xs font-bold text-white tracking-wide block">
                Recibo Oficial de Cobranza / Pago
              </span>
              <span className="text-[11px] text-slate-400">
                N° {payment.receiptNumber} • U.F. {payment.unitNumber}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-2"
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
          {/* 1. Encabezado Oficial */}
          <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">
                Consorcio de Copropietarios
              </span>
              <h2 className="font-black text-xl text-slate-950 tracking-tight mt-0.5">
                {buildingInfo.buildingName.toUpperCase()}
              </h2>
              <p className="text-slate-700 text-xs font-medium mt-0.5">
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

            <div className="sm:text-right shrink-0 bg-emerald-50 border border-emerald-300 rounded-xl p-3 min-w-[220px]">
              <span className="text-[10px] uppercase tracking-wider text-emerald-800 font-bold block">
                Comprobante Oficial
              </span>
              <h1 className="text-xs font-black text-emerald-900 uppercase tracking-tight mt-0.5">
                RECIBO OFICIAL DE COBRANZA / PAGO
              </h1>
              <p className="text-sm font-black text-slate-950 mt-1 font-mono tracking-wide">
                N° {payment.receiptNumber}
              </p>
              <div className="mt-1 flex sm:justify-end">
                <span className="inline-block px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold">
                  ✓ TOTALMENTE CANCELADO
                </span>
              </div>
            </div>
          </div>

          {/* 2. Constancia Formal Enmarcada */}
          {(() => {
            const payerName = payment.tenantName?.trim() || payment.ownerName;
            const isTenant = !!payment.tenantName?.trim();
            return (
              <div className="bg-slate-50 border-2 border-slate-300 rounded-2xl p-5 text-slate-800 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Carta de Pago / Constancia de Cancelación
                </span>
                <p className="text-sm sm:text-base leading-relaxed text-slate-900 font-normal">
                  Recibimos de{" "}
                  <strong className="font-bold text-slate-950 underline decoration-slate-400 underline-offset-2">
                    {payerName}
                  </strong>
                  , en su carácter de {isTenant ? "inquilino / ocupante" : "titular / copropietario"} de la Unidad Funcional{" "}
                  <strong className="font-bold text-slate-950">
                    U.F. {payment.unitNumber} {floorDoorText ? `(${floorDoorText})` : ""}
                  </strong>
                  {isTenant && (
                    <span className="text-slate-600"> (Inmueble perteneciente a {payment.ownerName})</span>
                  )}
                  , la suma de{" "}
                  <strong className="font-black text-emerald-800 text-base font-mono">
                    ${payment.paidAmount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </strong>{" "}
                  en concepto de <strong className="font-semibold text-slate-950">cancelación total de Expensas</strong> correspondientes al período{" "}
                  <strong className="font-black text-slate-950 uppercase font-mono">{periodName}</strong> del{" "}
                  <strong className="font-semibold text-slate-950">{buildingInfo.buildingName}</strong>.
                </p>
              </div>
            );
          })()}

          {/* 3. Detalle de Cobranza & Imputación Contable */}
          <div className="space-y-3">
            <h3 className="font-black text-xs uppercase tracking-wider text-slate-950">
              Detalle de la Transacción & Acreditación
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                {payment.tenantName && (
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">Inquilino / Pagador:</span>
                    <span className="font-bold text-slate-950">{payment.tenantName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Propietario del Inmueble:</span>
                  <span className="font-bold text-slate-950">{payment.ownerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Fecha de Cobro Acreditada:</span>
                  <span className="font-bold text-slate-950 font-mono">{paidDateStr}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Medio de Pago:</span>
                  <span className="font-bold text-slate-950">{payment.paymentMethod || "Transferencia Bancaria"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Nº Ref. / Comprobante:</span>
                  <span className="font-mono text-slate-900 font-semibold">
                    {payment.paymentReference || "—"}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Cuota Ordinaria Cancelada:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    ${payment.ordinaryAmount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {payment.extraordinaryAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">Cuota Extraordinaria:</span>
                    <span className="font-mono font-semibold text-purple-900">
                      ${payment.extraordinaryAmount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {(payment.previousDebt || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">Deuda Anterior Acreditada:</span>
                    <span className="font-mono font-semibold text-amber-900">
                      ${payment.previousDebt?.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="border-t border-slate-300 pt-1 flex justify-between font-bold text-slate-900">
                  <span>Monto Total Abonado:</span>
                  <span className="font-mono text-emerald-700">
                    ${payment.paidAmount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Estado de Cuenta del Período */}
          <div className="bg-emerald-50/60 border border-emerald-300 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-2">
            <div>
              <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-wider block">
                Saldo Deudor del Período Liquidado
              </span>
              <p className="text-xs text-emerald-800">
                La presente unidad no registra saldos pendientes para el período {periodName}.
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-emerald-700 font-mono">$0,00</span>
              <span className="block text-[10px] text-emerald-800 font-semibold uppercase tracking-wider">
                Totalmente Cancelado
              </span>
            </div>
          </div>

          {payment.notes && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs">
              <span className="font-bold text-[10px] uppercase text-slate-500 block mb-0.5">
                Observaciones del Recibo:
              </span>
              <p>{payment.notes}</p>
            </div>
          )}

          {/* 5. Firmas y Talón Formal de Pago */}
          <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-[11px] text-slate-600 page-break-inside-avoid">
            <div>
              <div className="w-52 border-b border-slate-400 mx-auto mb-2"></div>
              <p className="font-bold text-slate-900 uppercase tracking-wider">
                Copropietario / Inquilino
              </p>
              <p className="text-[10px] text-slate-500">Conformidad de Recepción</p>
            </div>
            <div>
              <div className="w-52 border-b border-slate-400 mx-auto mb-2"></div>
              <p className="font-bold text-slate-900 uppercase tracking-wider">
                Administración del Consorcio
              </p>
              <p className="text-[10px] text-slate-500">Firma, Sello & Validez Legal</p>
            </div>
          </div>

          {/* Pie de Documento Formal */}
          <div className="border-t border-slate-200 pt-3 text-[10px] text-slate-500 text-center">
            Documento electrónico emitido conforme al Código Civil y Comercial de la Nación (Art. 2048 y conc.). Conservar como constancia válida de pago.
          </div>
        </div>
      </div>
    </div>
  );
}

