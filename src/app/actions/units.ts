"use server";

import { prisma } from "@/lib/prisma";
import { syncUserWithPrisma } from "@/app/actions/users";
import { UnitType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ============================================================================
// Tipos & Esquemas Zod
// ============================================================================

export type ActionResponse<T = unknown> = {
  success: boolean;
  message?: string;
  error?: string;
  warning?: string;
  data?: T;
};

const UnitInputSchema = z.object({
  buildingId: z.string().min(1, "El consorcio/edificio es obligatorio"),
  name: z.string().max(100).optional().nullable(),
  code: z.string().max(50).optional().nullable(),
  type: z.nativeEnum(UnitType).default(UnitType.DEPARTAMENTO),
  number: z.string().min(1, "El número o denominación de unidad es obligatorio").max(50),
  floor: z.coerce.number().int().optional().nullable(),
  door: z.string().max(20).optional().nullable(),
  coefficient: z.coerce
    .number()
    .positive("El coeficiente debe ser mayor a 0%")
    .max(100, "El coeficiente no puede superar el 100%"),
  ownerName: z.string().max(150).optional().nullable(),
  ownerEmail: z
    .string()
    .email("Email de propietario inválido")
    .optional()
    .or(z.literal(""))
    .nullable(),
  ownerPhone: z.string().max(50).optional().nullable(),
  tenantName: z.string().max(150).optional().nullable(),
  tenantEmail: z
    .string()
    .email("Email de inquilino inválido")
    .optional()
    .or(z.literal(""))
    .nullable(),
  tenantPhone: z.string().max(50).optional().nullable(),
});

// Helper de Autenticación & Multi-Tenant
async function getAuthenticatedTenant() {
  const user = await syncUserWithPrisma();
  if (!user || !user.tenantId) {
    throw new Error("No autenticado o sin administración asociada.");
  }
  return { user, tenantId: user.tenantId };
}

// ============================================================================
// 1. Obtener Unidades con Balance de Coeficientes
// ============================================================================

export async function getUnitsByBuilding(buildingId: string) {
  try {
    const { tenantId } = await getAuthenticatedTenant();

    const building = await prisma.building.findFirst({
      where: { id: buildingId, tenantId },
      include: {
        units: {
          include: {
            owner: true,
            receipts: {
              select: { id: true, paymentStatus: true, totalPayable: true },
            },
          },
          orderBy: [{ floor: "asc" }, { number: "asc" }],
        },
      },
    });

    if (!building) {
      return { success: false, error: "Edificio no encontrado o no autorizado.", data: null };
    }

    const units = building.units;
    const totalUnits = units.length;

    // Calcular coeficiente acumulado y estadísticas
    const rawSum = units.reduce((acc, u) => acc + (u.coefficient || 0), 0);
    const totalCoefficient = Number(rawSum.toFixed(4));
    const remainingCoefficient = Number((100 - totalCoefficient).toFixed(4));
    const isBalanced = Math.abs(totalCoefficient - 100) < 0.01;

    // Agrupación por tipo
    const typeCounts: Record<string, number> = {};
    for (const u of units) {
      typeCounts[u.type] = (typeCounts[u.type] || 0) + 1;
    }

    return {
      success: true,
      data: {
        building: {
          id: building.id,
          name: building.name,
          address: building.address,
          city: building.city,
        },
        units,
        stats: {
          totalUnits,
          totalCoefficient,
          remainingCoefficient,
          isBalanced,
          typeCounts,
        },
      },
    };
  } catch (error) {
    console.error("Error al obtener unidades del consorcio:", error);
    return { success: false, error: "No se pudieron cargar las unidades.", data: null };
  }
}

// ============================================================================
// 2. Crear Unidad Funcional
// ============================================================================

export async function createUnit(
  rawData: unknown
): Promise<ActionResponse<{ id: string }>> {
  try {
    const { tenantId } = await getAuthenticatedTenant();

    const parsed = UnitInputSchema.safeParse(rawData);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Datos de unidad inválidos.";
      return { success: false, error: firstError };
    }

    const data = parsed.data;

    // Validar pertenencia del edificio al tenant
    const building = await prisma.building.findFirst({
      where: { id: data.buildingId, tenantId },
      include: { units: true },
    });

    if (!building) {
      return { success: false, error: "Edificio no encontrado o no autorizado." };
    }

    // Validar duplicado de denominación / número en el mismo edificio
    const exists = building.units.some(
      (u) =>
        u.number.trim().toLowerCase() === data.number.trim().toLowerCase() &&
        (u.door || "").trim().toLowerCase() === (data.door || "").trim().toLowerCase()
    );

    if (exists) {
      return {
        success: false,
        error: `Ya existe una unidad registrada con la denominación '${data.number}'${
          data.door ? ` puerta '${data.door}'` : ""
        } en este edificio.`,
      };
    }

    // Control de suma de coeficientes
    const currentSum = building.units.reduce((acc, u) => acc + (u.coefficient || 0), 0);
    const newTotal = Number((currentSum + data.coefficient).toFixed(4));

    if (newTotal > 100.01) {
      return {
        success: false,
        error: `La suma de coeficientes superaría el 100% permitido. Actual: ${currentSum.toFixed(
          2
        )}%, nuevo valor resultaría en: ${newTotal.toFixed(2)}%. Disponible máximo: ${(
          100 - currentSum
        ).toFixed(2)}%.`,
      };
    }

    const newUnit = await prisma.unit.create({
      data: {
        buildingId: data.buildingId,
        organizationId: tenantId,
        name: data.name?.trim() || `U.F. ${data.number.trim()}`,
        code: data.code?.trim() || null,
        type: data.type,
        number: data.number.trim(),
        floor: data.floor !== undefined ? data.floor : null,
        door: data.door?.trim() || null,
        coefficient: data.coefficient,
        ownerName: data.ownerName?.trim() || null,
        ownerEmail: data.ownerEmail?.trim() || null,
        ownerPhone: data.ownerPhone?.trim() || null,
        tenantName: data.tenantName?.trim() || null,
        tenantEmail: data.tenantEmail?.trim() || null,
        tenantPhone: data.tenantPhone?.trim() || null,
      },
    });

    revalidatePath(`/dashboard/consorcios/${data.buildingId}`);
    revalidatePath("/dashboard/consorcios");
    revalidatePath("/dashboard/expensas");

    let warningMsg: string | undefined;
    if (newTotal < 99.99) {
      warningMsg = `Unidad creada. Advertencia: El prorrateo total del consorcio suma ${newTotal.toFixed(
        2
      )}% (resta asignar ${(100 - newTotal).toFixed(2)}% para balancear al 100%).`;
    }

    return {
      success: true,
      message: `Unidad ${newUnit.number} agregada correctamente.`,
      warning: warningMsg,
      data: { id: newUnit.id },
    };
  } catch (error) {
    console.error("Error al crear unidad:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error inesperado al crear la unidad.",
    };
  }
}

// ============================================================================
// 3. Modificar Unidad Funcional
// ============================================================================

export async function updateUnit(
  unitId: string,
  rawData: unknown
): Promise<ActionResponse<{ id: string }>> {
  try {
    const { tenantId } = await getAuthenticatedTenant();

    const parsed = UnitInputSchema.safeParse(rawData);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Datos de unidad inválidos.";
      return { success: false, error: firstError };
    }

    const data = parsed.data;

    // Verificar existencia y autorización
    const unit = await prisma.unit.findFirst({
      where: {
        id: unitId,
        building: { tenantId },
      },
      include: {
        building: {
          include: { units: true },
        },
      },
    });

    if (!unit) {
      return { success: false, error: "Unidad funcional no encontrada o no autorizada." };
    }

    // Control de suma de coeficientes excluyendo la unidad actual
    const otherUnitsSum = unit.building.units
      .filter((u) => u.id !== unitId)
      .reduce((acc, u) => acc + (u.coefficient || 0), 0);

    const newTotal = Number((otherUnitsSum + data.coefficient).toFixed(4));
    if (newTotal > 100.01) {
      return {
        success: false,
        error: `El coeficiente ingresado (${data.coefficient}%) hace que el total del consorcio exceda el 100% (resultaría en ${newTotal.toFixed(
          2
        )}%). Máximo disponible: ${(100 - otherUnitsSum).toFixed(2)}%.`,
      };
    }

    await prisma.unit.update({
      where: { id: unitId },
      data: {
        name: data.name?.trim() || `U.F. ${data.number.trim()}`,
        code: data.code?.trim() || null,
        type: data.type,
        number: data.number.trim(),
        floor: data.floor !== undefined ? data.floor : null,
        door: data.door?.trim() || null,
        coefficient: data.coefficient,
        ownerName: data.ownerName?.trim() || null,
        ownerEmail: data.ownerEmail?.trim() || null,
        ownerPhone: data.ownerPhone?.trim() || null,
        tenantName: data.tenantName?.trim() || null,
        tenantEmail: data.tenantEmail?.trim() || null,
        tenantPhone: data.tenantPhone?.trim() || null,
      },
    });

    revalidatePath(`/dashboard/consorcios/${unit.buildingId}`);
    revalidatePath("/dashboard/consorcios");
    revalidatePath("/dashboard/expensas");

    let warningMsg: string | undefined;
    if (newTotal < 99.99) {
      warningMsg = `Unidad actualizada. Advertencia: El prorrateo total del consorcio suma ${newTotal.toFixed(
        2
      )}% (resta asignar ${(100 - newTotal).toFixed(2)}%).`;
    }

    return {
      success: true,
      message: `Unidad ${data.number} actualizada con éxito.`,
      warning: warningMsg,
      data: { id: unitId },
    };
  } catch (error) {
    console.error("Error al actualizar unidad:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error inesperado al actualizar la unidad.",
    };
  }
}

// ============================================================================
// 4. Eliminar Unidad Funcional
// ============================================================================

export async function deleteUnit(unitId: string): Promise<ActionResponse> {
  try {
    const { tenantId } = await getAuthenticatedTenant();

    const unit = await prisma.unit.findFirst({
      where: {
        id: unitId,
        building: { tenantId },
      },
      include: {
        receipts: {
          include: { liquidation: true },
        },
      },
    });

    if (!unit) {
      return { success: false, error: "Unidad funcional no encontrada." };
    }

    // Verificar si tiene recibos en liquidaciones ya emitidas o cerradas
    const hasActiveReceipts = unit.receipts.some(
      (r) => r.liquidation.status !== "DRAFT" || r.paymentStatus === "PAID"
    );

    if (hasActiveReceipts) {
      return {
        success: false,
        error:
          "No se puede eliminar la unidad porque cuenta con comprobantes de expensas emitidos o pagos registrados en el historial.",
      };
    }

    // Si tiene recibos solo en borradores, los eliminamos primero
    if (unit.receipts.length > 0) {
      await prisma.expenseReceipt.deleteMany({
        where: { unitId },
      });
    }

    await prisma.unit.delete({
      where: { id: unitId },
    });

    revalidatePath(`/dashboard/consorcios/${unit.buildingId}`);
    revalidatePath("/dashboard/consorcios");
    revalidatePath("/dashboard/expensas");

    return {
      success: true,
      message: `Unidad ${unit.number} eliminada correctamente.`,
    };
  } catch (error) {
    console.error("Error al eliminar unidad:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al eliminar la unidad funcional.",
    };
  }
}

/**
 * Actualizar masivamente los coeficientes de las unidades de un edificio
 */
export async function updateBuildingUnitCoefficients(
  buildingId: string,
  coefficients: Array<{ unitId: string; coefficient: number }>
): Promise<ActionResponse> {
  try {
    const { tenantId } = await getAuthenticatedTenant();

    const building = await prisma.building.findFirst({
      where: { id: buildingId, tenantId },
      include: { units: true },
    });

    if (!building) {
      return { success: false, error: "Edificio no encontrado o no autorizado." };
    }

    if (!coefficients || coefficients.length === 0) {
      return { success: false, error: "No se proporcionaron coeficientes a actualizar." };
    }

    // Actualizar todas las unidades en una transacción
    await prisma.$transaction(
      coefficients.map((c) =>
        prisma.unit.update({
          where: { id: c.unitId },
          data: {
            coefficient: Math.max(0, Number(c.coefficient.toFixed(4))),
          },
        })
      )
    );

    revalidatePath(`/dashboard/consorcios/${buildingId}`);
    revalidatePath("/dashboard/consorcios");
    revalidatePath("/dashboard/expensas");

    return {
      success: true,
      message: "Coeficientes de unidades actualizados correctamente.",
    };
  } catch (error) {
    console.error("Error al actualizar coeficientes masivamente:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error inesperado al actualizar coeficientes.",
    };
  }
}
