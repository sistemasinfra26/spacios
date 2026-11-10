"use server";

import { prisma } from "@/lib/prisma";
import { syncUserWithPrisma } from "@/app/actions/users";
import { ExpenseCategory, LiquidationStatus, PaymentStatus, UnitType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ============================================================================
// Tipos & Esquemas Zod
// ============================================================================

export type ActionResponse<T = unknown> = {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
};

const CreateLiquidationSchema = z.object({
  buildingId: z.string().min(1, "El edificio es obligatorio"),
  month: z.coerce.number().int().min(1, "Mes inválido").max(12, "Mes inválido"),
  year: z.coerce.number().int().min(2020).max(2100),
  dueDateFirst: z.string().min(1, "La fecha del 1er vencimiento es obligatoria"),
  dueDateSecond: z.string().optional().nullable(),
  interestRate: z.coerce.number().min(0).max(100).default(0),
  notes: z.string().max(500).optional().nullable(),
  unitCoefficients: z
    .array(
      z.object({
        unitId: z.string(),
        coefficient: z.coerce.number().min(0),
      })
    )
    .optional(),
});

const UpdateLiquidationSchema = z.object({
  dueDateFirst: z.string().min(1, "La fecha del 1er vencimiento es obligatoria"),
  dueDateSecond: z.string().optional().nullable(),
  interestRate: z.coerce.number().min(0).max(100).default(0),
  notes: z.string().max(500).optional().nullable(),
});

const AddExpenseItemSchema = z.object({
  liquidationId: z.string().min(1, "La liquidación es obligatoria"),
  category: z.nativeEnum(ExpenseCategory, {
    message: "Categoría de gasto inválida",
  }),
  description: z.string().min(2, "La descripción debe tener al menos 2 caracteres").max(255),
  supplierName: z.string().max(150).optional().nullable(),
  invoiceNumber: z.string().max(100).optional().nullable(),
  amount: z.coerce.number().positive("El monto debe ser un valor positivo mayor a 0"),
  date: z.string().optional().nullable(),
});

const UpdateExpenseItemSchema = z.object({
  itemId: z.string().min(1, "El comprobante es obligatorio"),
  category: z.nativeEnum(ExpenseCategory, {
    message: "Categoría de gasto inválida",
  }),
  description: z.string().min(2, "La descripción debe tener al menos 2 caracteres").max(255),
  supplierName: z.string().max(150).optional().nullable(),
  invoiceNumber: z.string().max(100).optional().nullable(),
  amount: z.coerce.number().positive("El monto debe ser un valor positivo mayor a 0"),
  date: z.string().optional().nullable(),
});

const RegisterPaymentSchema = z.object({
  receiptId: z.string().min(1, "El comprobante es obligatorio"),
  amount: z.coerce.number().optional().nullable(),
  paymentMethod: z.string().min(1, "El método de pago es obligatorio").default("TRANSFERENCIA"),
  paymentReference: z.string().max(200).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  paidAt: z.string().optional().nullable(),
});

// ============================================================================
// Helper de Autenticación & Multi-Tenant
// ============================================================================

export async function getAuthenticatedTenant() {
  const user = await syncUserWithPrisma();
  if (!user || !user.tenantId) {
    throw new Error("No autenticado o sin consorcio asignado.");
  }
  return { user, tenantId: user.tenantId };
}

// ============================================================================
// 1. Crear Período de Liquidación
// ============================================================================

export async function createLiquidationPeriod(
  rawData: unknown
): Promise<ActionResponse<{ id: string }>> {
  try {
    const { tenantId } = await getAuthenticatedTenant();

    const parsed = CreateLiquidationSchema.safeParse(rawData);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Datos del formulario inválidos.";
      return { success: false, error: firstError };
    }

    const {
      buildingId,
      month,
      year,
      dueDateFirst,
      dueDateSecond,
      interestRate,
      notes,
      unitCoefficients,
    } = parsed.data;

    // Verificar pertenencia del edificio al tenant
    const building = await prisma.building.findFirst({
      where: { id: buildingId, tenantId },
      include: { units: true },
    });

    if (!building) {
      return { success: false, error: "Edificio no encontrado o no autorizado." };
    }

    // Verificar si ya existe una liquidación para este edificio en el mismo período
    const existing = await prisma.expenseLiquidation.findUnique({
      where: {
        buildingId_year_month: {
          buildingId,
          year,
          month,
        },
      },
    });

    if (existing) {
      return {
        success: false,
        error: `Ya existe una liquidación creada para el período ${month}/${year} en este edificio.`,
      };
    }

    const newLiquidation = await prisma.$transaction(async (tx) => {
      // Si se enviaron coeficientes actualizados, guardarlos en las unidades correspondientes
      if (unitCoefficients && unitCoefficients.length > 0) {
        for (const uc of unitCoefficients) {
          await tx.unit.update({
            where: { id: uc.unitId },
            data: { coefficient: Math.max(0, Number(uc.coefficient.toFixed(4))) },
          });
        }
      }

      return await tx.expenseLiquidation.create({
        data: {
          organizationId: tenantId,
          buildingId,
          month,
          year,
          status: LiquidationStatus.DRAFT,
          dueDateFirst: new Date(dueDateFirst),
          dueDateSecond: dueDateSecond ? new Date(dueDateSecond) : null,
          interestRate,
          notes: notes || null,
          totalAmount: 0,
        },
      });
    });

    revalidatePath("/dashboard/expensas");
    return {
      success: true,
      message: `Período ${month}/${year} abierto en borrador correctamente.`,
      data: { id: newLiquidation.id },
    };
  } catch (error) {
    console.error("Error al crear período de liquidación:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error inesperado al crear la liquidación.",
    };
  }
}

// ============================================================================
// 2. Cargar Gasto / Factura a la Liquidación
// ============================================================================

export async function addExpenseItem(rawData: unknown): Promise<ActionResponse<{ id: string }>> {
  try {
    const { tenantId } = await getAuthenticatedTenant();

    const parsed = AddExpenseItemSchema.safeParse(rawData);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Datos del gasto inválidos.";
      return { success: false, error: firstError };
    }

    const { liquidationId, category, description, supplierName, invoiceNumber, amount, date } =
      parsed.data;

    // Verificar que la liquidación pertenece al tenant y se encuentra en estado DRAFT
    const liquidation = await prisma.expenseLiquidation.findFirst({
      where: {
        id: liquidationId,
        building: { tenantId },
      },
      include: { items: true },
    });

    if (!liquidation) {
      return { success: false, error: "Liquidación no encontrada o no autorizada." };
    }

    if (liquidation.status === LiquidationStatus.CLOSED) {
      return {
        success: false,
        error: "No se pueden agregar gastos a una liquidación que ya fue cerrada contablemente.",
      };
    }

    // Insertar el item y actualizar el total acumulado en una transacción
    const [newItem] = await prisma.$transaction([
      prisma.expenseItem.create({
        data: {
          liquidationId,
          category,
          description: description.trim(),
          supplierName: supplierName?.trim() || null,
          invoiceNumber: invoiceNumber?.trim() || null,
          amount,
          date: date ? new Date(date) : new Date(),
        },
      }),
      prisma.expenseLiquidation.update({
        where: { id: liquidationId },
        data: {
          totalAmount: {
            increment: amount,
          },
        },
      }),
    ]);

    revalidatePath("/dashboard/expensas");
    revalidatePath(`/dashboard/expensas/${liquidationId}`);
    return {
      success: true,
      message: "Gasto agregado correctamente a la liquidación.",
      data: { id: newItem.id },
    };
  } catch (error) {
    console.error("Error al agregar gasto:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error inesperado al cargar el gasto.",
    };
  }
}

/**
 * Modificar un comprobante o gasto cargado
 */
export async function updateExpenseItem(rawData: unknown): Promise<ActionResponse> {
  try {
    const { tenantId } = await getAuthenticatedTenant();

    const parsed = UpdateExpenseItemSchema.safeParse(rawData);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Datos del comprobante inválidos.";
      return { success: false, error: firstError };
    }

    const { itemId, category, description, supplierName, invoiceNumber, amount, date } =
      parsed.data;

    const existingItem = await prisma.expenseItem.findFirst({
      where: {
        id: itemId,
        liquidation: {
          building: { tenantId },
        },
      },
      include: { liquidation: true },
    });

    if (!existingItem) {
      return { success: false, error: "Comprobante de gasto no encontrado o no autorizado." };
    }

    if (existingItem.liquidation.status === LiquidationStatus.CLOSED) {
      return {
        success: false,
        error: "No se pueden modificar gastos de un período cerrado contablemente.",
      };
    }

    const oldAmount = Number(existingItem.amount);
    const diff = amount - oldAmount;

    await prisma.$transaction([
      prisma.expenseItem.update({
        where: { id: itemId },
        data: {
          category,
          description: description.trim(),
          supplierName: supplierName?.trim() || null,
          invoiceNumber: invoiceNumber?.trim() || null,
          amount,
          date: date ? new Date(date) : existingItem.date,
        },
      }),
      prisma.expenseLiquidation.update({
        where: { id: existingItem.liquidationId },
        data: {
          totalAmount: {
            increment: diff,
          },
        },
      }),
    ]);

    revalidatePath("/dashboard/expensas");
    revalidatePath(`/dashboard/expensas/${existingItem.liquidationId}`);

    return {
      success: true,
      message: "Gasto actualizado correctamente.",
    };
  } catch (error) {
    console.error("Error al actualizar gasto:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al actualizar el comprobante.",
    };
  }
}

// ============================================================================
// 3. Eliminar Gasto (en estado Borrador)
// ============================================================================

export async function deleteExpenseItem(itemId: string): Promise<ActionResponse> {
  try {
    const { tenantId } = await getAuthenticatedTenant();

    const item = await prisma.expenseItem.findFirst({
      where: {
        id: itemId,
        liquidation: {
          building: { tenantId },
        },
      },
      include: { liquidation: true },
    });

    if (!item) {
      return { success: false, error: "Comprobante de gasto no encontrado." };
    }

    if (item.liquidation.status === LiquidationStatus.CLOSED) {
      return {
        success: false,
        error: "No se pueden eliminar gastos de un período ya cerrado contablemente.",
      };
    }

    await prisma.$transaction([
      prisma.expenseItem.delete({
        where: { id: itemId },
      }),
      prisma.expenseLiquidation.update({
        where: { id: item.liquidationId },
        data: {
          totalAmount: {
            decrement: item.amount,
          },
        },
      }),
    ]);

    revalidatePath("/dashboard/expensas");
    revalidatePath(`/dashboard/expensas/${item.liquidationId}`);
    return { success: true, message: "Comprobante eliminado correctamente." };
  } catch (error) {
    console.error("Error al eliminar gasto:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "No se pudo eliminar el gasto.",
    };
  }
}

// ============================================================================
// 4. Prorrateo, Previsualización y Publicación de Expensas
// ============================================================================

export interface UnitProrationPreview {
  unitId: string;
  unitNumber: string;
  floor: number | null;
  door?: string | null;
  code?: string | null;
  unitType?: UnitType;
  ownerName: string;
  tenantName?: string | null;
  coefficient: number;
  ordinaryAmount: number;
  extraordinaryAmount: number;
  previousDebt: number;
  interestAmount: number;
  totalPayable: number;
  receiptId?: string;
  receiptNumber?: string | null;
  paymentStatus?: PaymentStatus;
  paidAt?: Date | null;
  paymentMethod?: string | null;
  paymentReference?: string | null;
  notes?: string | null;
}

export interface LiquidationFinancialSummary {
  totalOrdinary: number;
  totalExtraordinary: number;
  totalReserveFund: number;
  totalExpenses: number;
  totalPreviousDebt: number;
  totalInterest: number;
  grandTotalPayable: number;
  totalPaid: number;
  unitsCount: number;
}

/**
 * Calcula la distribución matemática por coeficiente e historial de deudas
 */
export async function calculateProrationData(liquidationId: string, tenantId: string) {
  const liquidation = await prisma.expenseLiquidation.findFirst({
    where: {
      id: liquidationId,
      building: { tenantId },
    },
    include: {
      building: {
        include: {
          tenant: true,
          units: {
            include: {
              owner: true,
              contracts: {
                include: { tenantUser: true },
              },
            },
            orderBy: [{ floor: "asc" }, { number: "asc" }],
          },
        },
      },
      items: {
        orderBy: [{ date: "asc" }, { createdAt: "asc" }],
      },
      receipts: true,
    },
  });

  if (!liquidation) {
    throw new Error("Liquidación no encontrada.");
  }

  const { units } = liquidation.building;

  // 1. Clasificación de Gastos
  let totalOrdinary = 0;
  let totalExtraordinary = 0;
  let totalReserveFund = 0;

  for (const item of liquidation.items) {
    const val = Number(item.amount);
    if (item.category === ExpenseCategory.EXTRAORDINARY) {
      totalExtraordinary += val;
    } else if (item.category === ExpenseCategory.RESERVE_FUND) {
      totalReserveFund += val;
    } else {
      totalOrdinary += val;
    }
  }

  // Los gastos ordinarios consolidan ORDINARY_A, ORDINARY_B y RESERVE_FUND
  const consolidatedOrdinary = totalOrdinary + totalReserveFund;
  const totalExpenses = consolidatedOrdinary + totalExtraordinary;

  // Si el edificio aún no posee unidades funcionales registradas, retornamos la estructura vacía
  if (!units || units.length === 0) {
    const emptySummary: LiquidationFinancialSummary = {
      totalOrdinary,
      totalExtraordinary,
      totalReserveFund,
      totalExpenses,
      totalPreviousDebt: 0,
      totalInterest: 0,
      grandTotalPayable: totalExpenses,
      totalPaid: 0,
      unitsCount: 0,
    };

    return {
      liquidation,
      units: [],
      prorationList: [],
      summary: emptySummary,
    };
  }

  // 2. Coeficientes
  // Suma total de coeficientes para normalizar (ej: suma 100% o suma 1.0)
  const sumCoefficients = units.reduce((acc, u) => acc + (u.coefficient || 0), 0);
  const normalizedBase = sumCoefficients > 0 ? sumCoefficients : units.length;

  // 3. Buscar deudas pendientes de períodos anteriores para las unidades
  // Se buscan comprobantes impagos de esta unidad en el mismo consorcio
  const pendingReceipts = await prisma.expenseReceipt.findMany({
    where: {
      unit: { buildingId: liquidation.buildingId },
      liquidationId: { not: liquidationId },
      paymentStatus: { in: [PaymentStatus.PENDING, PaymentStatus.OVERDUE] },
      liquidation: {
        createdAt: { lt: liquidation.createdAt },
      },
    },
    select: {
      unitId: true,
      totalPayable: true,
    },
  });

  const debtMap = new Map<string, number>();
  for (const p of pendingReceipts) {
    const current = debtMap.get(p.unitId) || 0;
    debtMap.set(p.unitId, current + Number(p.totalPayable));
  }

  // 4. Calcular desglose por cada unidad
  const interestRate = liquidation.interestRate || 0;
  const prorationList: UnitProrationPreview[] = [];

  let totalPreviousDebt = 0;
  let totalInterest = 0;
  let grandTotalPayable = 0;
  let totalPaid = 0;

  const existingReceiptsMap = new Map(liquidation.receipts.map((r) => [r.unitId, r]));

  for (const unit of units) {
    const ratio = sumCoefficients > 0 ? unit.coefficient / normalizedBase : 1 / units.length;

    const unitOrdinary = Number((consolidatedOrdinary * ratio).toFixed(2));
    const unitExtraordinary = Number((totalExtraordinary * ratio).toFixed(2));

    const rawDebt = debtMap.get(unit.id) || 0;
    const unitInterest = rawDebt > 0 && interestRate > 0 ? Number((rawDebt * (interestRate / 100)).toFixed(2)) : 0;
    const unitPreviousDebt = Number((rawDebt + unitInterest).toFixed(2));

    const unitTotal = Number((unitOrdinary + unitExtraordinary + unitPreviousDebt).toFixed(2));

    const existingReceipt = existingReceiptsMap.get(unit.id);
    if (existingReceipt && existingReceipt.paymentStatus === PaymentStatus.PAID) {
      totalPaid += Number(existingReceipt.totalPayable);
    }

    totalPreviousDebt += rawDebt;
    totalInterest += unitInterest;
    grandTotalPayable += unitTotal;

    const ownerName =
      unit.ownerName?.trim() ||
      (unit.owner
        ? `${unit.owner.firstName} ${unit.owner.lastName}`.trim()
        : "Sin Propietario Registrado");

    const activeContract = unit.contracts?.find((c) => c.status === "ACTIVE");
    const contractTenant = activeContract?.tenantUser
      ? `${activeContract.tenantUser.firstName} ${activeContract.tenantUser.lastName}`.trim()
      : null;
    const tenantName = unit.tenantName?.trim() || contractTenant || null;

    const receiptNum =
      existingReceipt?.receiptNumber ||
      (existingReceipt?.paymentStatus === PaymentStatus.PAID
        ? `REC-${liquidation.year}${String(liquidation.month).padStart(2, "0")}-${unit.number.replace(/\s+/g, "")}`
        : null);

    prorationList.push({
      unitId: unit.id,
      unitNumber: unit.number,
      floor: unit.floor,
      door: unit.door,
      code: unit.code,
      unitType: unit.type,
      ownerName,
      tenantName,
      coefficient: unit.coefficient,
      ordinaryAmount: unitOrdinary,
      extraordinaryAmount: unitExtraordinary,
      previousDebt: rawDebt,
      interestAmount: unitInterest,
      totalPayable: unitTotal,
      receiptId: existingReceipt?.id,
      receiptNumber: receiptNum,
      paymentStatus: existingReceipt?.paymentStatus || PaymentStatus.PENDING,
      paidAt: existingReceipt?.paidAt,
      paymentMethod: existingReceipt?.paymentMethod,
      paymentReference: existingReceipt?.paymentReference || null,
      notes: existingReceipt?.notes || null,
    });
  }

  const summary: LiquidationFinancialSummary = {
    totalOrdinary,
    totalExtraordinary,
    totalReserveFund,
    totalExpenses,
    totalPreviousDebt,
    totalInterest,
    grandTotalPayable,
    totalPaid,
    unitsCount: units.length,
  };

  return {
    liquidation,
    units,
    prorationList,
    summary,
  };
}

/**
 * Obtener vista previa del cálculo antes de emitir
 */
export async function getLiquidationProrationPreview(liquidationId: string): Promise<
  ActionResponse<{
    prorationList: UnitProrationPreview[];
    summary: LiquidationFinancialSummary;
    liquidation: {
      id: string;
      month: number;
      year: number;
      status: LiquidationStatus;
      totalAmount: number;
      buildingName: string;
      dueDateFirst: Date;
      dueDateSecond: Date | null;
      interestRate: number | null;
      notes: string | null;
    };
  }>
> {
  try {
    const { tenantId } = await getAuthenticatedTenant();
    const data = await calculateProrationData(liquidationId, tenantId);

    return {
      success: true,
      data: {
        prorationList: data.prorationList,
        summary: data.summary,
        liquidation: {
          id: data.liquidation.id,
          month: data.liquidation.month,
          year: data.liquidation.year,
          status: data.liquidation.status,
          totalAmount: Number(data.liquidation.totalAmount),
          buildingName: data.liquidation.building.name,
          dueDateFirst: data.liquidation.dueDateFirst,
          dueDateSecond: data.liquidation.dueDateSecond,
          interestRate: data.liquidation.interestRate,
          notes: data.liquidation.notes,
        },
      },
    };
  } catch (error) {
    console.error("Error al obtener preview de prorrateo:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al calcular el prorrateo.",
    };
  }
}

/**
 * Prorrateo automático de gastos y emisión formal (DRAFT -> PUBLISHED)
 * Genera los registros de comprobantes por unidad
 */
export async function calculateAndPublishLiquidation(
  liquidationId: string
): Promise<ActionResponse<{ publishedReceiptsCount: number }>> {
  try {
    const { tenantId } = await getAuthenticatedTenant();

    const data = await calculateProrationData(liquidationId, tenantId);

    if (data.prorationList.length === 0) {
      return {
        success: false,
        error: "El edificio no posee unidades funcionales registradas para prorratear. Genera o carga unidades antes de emitir la liquidación.",
      };
    }

    // Ejecutar la creación o actualización de comprobantes y publicación dentro de una transacción
    await prisma.$transaction(async (tx) => {
      // 1. Crear / actualizar comprobantes individuales por unidad
      for (const p of data.prorationList) {
        await tx.expenseReceipt.upsert({
          where: {
            liquidationId_unitId: {
              liquidationId,
              unitId: p.unitId,
            },
          },
          update: {
            coefficient: p.coefficient,
            ordinaryAmount: p.ordinaryAmount,
            extraordinaryAmount: p.extraordinaryAmount,
            previousDebt: p.previousDebt + p.interestAmount,
            totalPayable: p.totalPayable,
          },
          create: {
            liquidationId,
            unitId: p.unitId,
            coefficient: p.coefficient,
            ordinaryAmount: p.ordinaryAmount,
            extraordinaryAmount: p.extraordinaryAmount,
            previousDebt: p.previousDebt + p.interestAmount,
            totalPayable: p.totalPayable,
            paymentStatus: PaymentStatus.PENDING,
          },
        });
      }

      // 2. Actualizar estado y total consolidado de la liquidación
      await tx.expenseLiquidation.update({
        where: { id: liquidationId },
        data: {
          status: LiquidationStatus.PUBLISHED,
          totalAmount: data.summary.totalExpenses,
        },
      });
    });

    revalidatePath("/dashboard/expensas");
    return {
      success: true,
      message: `¡Liquidación ${data.liquidation.month}/${data.liquidation.year} emitida con éxito! Se generaron ${data.prorationList.length} comprobantes de expensas.`,
      data: { publishedReceiptsCount: data.prorationList.length },
    };
  } catch (error) {
    console.error("Error al emitir y publicar liquidación:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al procesar la liquidación.",
    };
  }
}

// ============================================================================
// 5. Registrar Pago de Expensa por Unidad
// ============================================================================

export async function registerUnitPayment(
  unitExpenseId: string,
  paymentDetails: {
    amount?: number;
    paymentMethod?: string;
    paymentReference?: string;
    notes?: string;
    paidAt?: string;
  }
): Promise<ActionResponse> {
  try {
    const { tenantId } = await getAuthenticatedTenant();

    const parsed = RegisterPaymentSchema.safeParse({
      receiptId: unitExpenseId,
      ...paymentDetails,
    });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Datos de pago inválidos.",
      };
    }

    const { receiptId, paymentMethod, paymentReference, notes, paidAt } = parsed.data;

    // Verificar pertenencia y estado
    const receipt = await prisma.expenseReceipt.findFirst({
      where: {
        id: receiptId,
        liquidation: {
          building: { tenantId },
        },
      },
      include: {
        unit: true,
        liquidation: true,
      },
    });

    if (!receipt) {
      return { success: false, error: "Comprobante de expensa no encontrado o no autorizado." };
    }

    const receiptYear = receipt.liquidation.year;
    const receiptMonth = String(receipt.liquidation.month).padStart(2, "0");
    const cleanUnit = receipt.unit.number.replace(/\s+/g, "");
    const generatedReceiptNumber = `REC-${receiptYear}${receiptMonth}-${cleanUnit}`;

    await prisma.expenseReceipt.update({
      where: { id: receiptId },
      data: {
        paymentStatus: PaymentStatus.PAID,
        paidAt: paidAt ? new Date(paidAt) : new Date(),
        paymentMethod: paymentMethod.toUpperCase(),
        paymentReference: paymentReference?.trim() || null,
        receiptNumber: receipt.receiptNumber || generatedReceiptNumber,
        notes: notes || null,
      },
    });

    revalidatePath("/dashboard/expensas");
    return {
      success: true,
      message: `Pago registrado correctamente para la Unidad ${receipt.unit.number}.`,
    };
  } catch (error) {
    console.error("Error al registrar pago de expensa:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "No se pudo registrar el pago.",
    };
  }
}

// ============================================================================
// 6. Cerrar Período de Liquidación (PUBLISHED -> CLOSED)
// ============================================================================

export async function closeLiquidationPeriod(liquidationId: string): Promise<ActionResponse> {
  try {
    const { tenantId } = await getAuthenticatedTenant();

    const liquidation = await prisma.expenseLiquidation.findFirst({
      where: {
        id: liquidationId,
        building: { tenantId },
      },
    });

    if (!liquidation) {
      return { success: false, error: "Liquidación no encontrada." };
    }

    if (liquidation.status === LiquidationStatus.DRAFT) {
      return {
        success: false,
        error: "No se puede cerrar una liquidación que aún está en borrador. Debe emitirse primero.",
      };
    }

    await prisma.expenseLiquidation.update({
      where: { id: liquidationId },
      data: { status: LiquidationStatus.CLOSED },
    });

    revalidatePath("/dashboard/expensas");
    revalidatePath(`/dashboard/expensas/${liquidationId}`);
    return { success: true, message: "Período cerrado exitosamente." };
  } catch (error) {
    console.error("Error al cerrar período:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al cerrar el período.",
    };
  }
}

/**
 * Reabre una liquidación emitida para volver a editar gastos, corregir facturas o recalcular
 */
export async function reopenLiquidationToDraft(liquidationId: string): Promise<ActionResponse> {
  try {
    const { tenantId } = await getAuthenticatedTenant();

    const liquidation = await prisma.expenseLiquidation.findFirst({
      where: {
        id: liquidationId,
        building: { tenantId },
      },
    });

    if (!liquidation) {
      return { success: false, error: "Liquidación no encontrada o no autorizada." };
    }

    if (liquidation.status === LiquidationStatus.CLOSED) {
      return {
        success: false,
        error: "No se puede reabrir un período cerrado definitivamente.",
      };
    }

    await prisma.expenseLiquidation.update({
      where: { id: liquidationId },
      data: { status: LiquidationStatus.DRAFT },
    });

    revalidatePath("/dashboard/expensas");
    revalidatePath(`/dashboard/expensas/${liquidationId}`);

    return {
      success: true,
      message: "Liquidación reabierta a Borrador. Ahora puedes editar o agregar facturas y reemitir las expensas.",
    };
  } catch (error) {
    console.error("Error al reabrir liquidación:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al reabrir la liquidación.",
    };
  }
}

/**
 * Actualiza los datos generales de una liquidación (vencimientos, tasa de interés, observaciones)
 */
export async function updateLiquidationPeriod(
  liquidationId: string,
  rawData: unknown
): Promise<ActionResponse> {
  try {
    const { tenantId } = await getAuthenticatedTenant();

    const parsed = UpdateLiquidationSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Datos del formulario inválidos.",
      };
    }

    const { dueDateFirst, dueDateSecond, interestRate, notes } = parsed.data;

    const liquidation = await prisma.expenseLiquidation.findFirst({
      where: {
        id: liquidationId,
        building: { tenantId },
      },
    });

    if (!liquidation) {
      return { success: false, error: "Liquidación no encontrada o no autorizada." };
    }

    if (liquidation.status === LiquidationStatus.CLOSED) {
      return {
        success: false,
        error: "No se puede modificar un período cerrado contablemente.",
      };
    }

    await prisma.expenseLiquidation.update({
      where: { id: liquidationId },
      data: {
        dueDateFirst: new Date(dueDateFirst),
        dueDateSecond: dueDateSecond ? new Date(dueDateSecond) : null,
        interestRate,
        notes: notes || null,
      },
    });

    revalidatePath("/dashboard/expensas");
    revalidatePath(`/dashboard/expensas/${liquidationId}`);

    return {
      success: true,
      message: "Liquidación actualizada correctamente.",
    };
  } catch (error) {
    console.error("Error al actualizar liquidación:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al actualizar la liquidación.",
    };
  }
}

// ============================================================================
// 7. Consultas de Datos para UI
// ============================================================================

/**
 * Obtener listado de liquidaciones filtrado por edificio
 */
export async function getLiquidations(buildingId?: string) {
  try {
    const { tenantId } = await getAuthenticatedTenant();

    const whereClause: {
      organizationId: string;
      buildingId?: string;
    } = {
      organizationId: tenantId,
    };

    if (buildingId && buildingId !== "ALL") {
      whereClause.buildingId = buildingId;
    }

    const liquidations = await prisma.expenseLiquidation.findMany({
      where: whereClause,
      include: {
        building: {
          select: { id: true, name: true, address: true, city: true },
        },
        items: true,
        receipts: {
          select: {
            id: true,
            totalPayable: true,
            paymentStatus: true,
          },
        },
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    const formatted = liquidations.map((liq) => {
      const totalCollected = liq.receipts
        .filter((r) => r.paymentStatus === PaymentStatus.PAID)
        .reduce((acc, r) => acc + Number(r.totalPayable), 0);

      const totalPending = liq.receipts
        .filter((r) => r.paymentStatus !== PaymentStatus.PAID)
        .reduce((acc, r) => acc + Number(r.totalPayable), 0);

      const totalCalculated =
        liq.status === LiquidationStatus.DRAFT
          ? liq.items.reduce((acc, i) => acc + Number(i.amount), 0)
          : Number(liq.totalAmount);

      return {
        id: liq.id,
        buildingId: liq.buildingId,
        buildingName: liq.building.name,
        buildingAddress: liq.building.address,
        month: liq.month,
        year: liq.year,
        status: liq.status,
        dueDateFirst: liq.dueDateFirst,
        dueDateSecond: liq.dueDateSecond,
        interestRate: liq.interestRate,
        totalAmount: totalCalculated,
        totalCollected,
        totalPending,
        itemsCount: liq.items.length,
        receiptsCount: liq.receipts.length,
        notes: liq.notes,
        createdAt: liq.createdAt,
      };
    });

    return { success: true, data: formatted };
  } catch (error) {
    console.error("Error al obtener liquidaciones:", error);
    return { success: false, error: "No se pudieron cargar las liquidaciones.", data: [] };
  }
}

/**
 * Obtener detalle completo de una liquidación (Items + Receipts + Resumen)
 */
export async function getLiquidationDetail(liquidationId: string) {
  try {
    const { tenantId } = await getAuthenticatedTenant();

    const liquidation = await prisma.expenseLiquidation.findFirst({
      where: {
        id: liquidationId,
        building: { tenantId },
      },
      include: {
        building: {
          include: {
            units: {
              include: { owner: true },
              orderBy: [{ floor: "asc" }, { number: "asc" }],
            },
          },
        },
        items: {
          orderBy: { createdAt: "asc" },
        },
        receipts: {
          include: {
            unit: {
              include: { owner: true },
            },
          },
          orderBy: [{ unit: { floor: "asc" } }, { unit: { number: "asc" } }],
        },
      },
    });

    if (!liquidation) {
      return { success: false, error: "Liquidación no encontrada.", data: null };
    }

    return { success: true, data: liquidation };
  } catch (error) {
    console.error("Error al obtener detalle de liquidación:", error);
    return { success: false, error: "Error al cargar la liquidación.", data: null };
  }
}

