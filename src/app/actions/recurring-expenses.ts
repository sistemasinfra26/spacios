"use server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/app/actions/expenses";
import { ExpenseCategory } from "@prisma/client";
import { revalidatePath } from "next/cache";

export interface ExpenseTemplateItem {
  id: string;
  organizationId: string;
  buildingId: string | null;
  category: ExpenseCategory;
  concept: string;
  supplierName: string;
  defaultAmount: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ActionResponse<T = unknown> = {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
};

/**
 * Trae las plantillas disponibles para el consorcio / organización y edificio especificado.
 * Si se pasa buildingId, incluye tanto las plantillas globales (buildingId: null) como las del edificio.
 */
export async function getExpenseTemplates(
  buildingId?: string | null
): Promise<ActionResponse<ExpenseTemplateItem[]>> {
  try {
    const { tenantId } = await getAuthenticatedTenant();

    const whereClause: any = {
      organizationId: tenantId,
    };

    if (buildingId) {
      whereClause.OR = [{ buildingId: null }, { buildingId }];
    }

    const templates = await prisma.recurringExpenseTemplate.findMany({
      where: whereClause,
      orderBy: [{ concept: "asc" }],
    });

    return {
      success: true,
      data: templates,
    };
  } catch (error) {
    console.error("Error al obtener plantillas de gastos:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al obtener plantillas de gastos.",
      data: [],
    };
  }
}

/**
 * Crea una nueva plantilla reutilizable de gasto recurrente.
 */
export async function createExpenseTemplate(data: {
  buildingId?: string | null;
  category: ExpenseCategory;
  concept: string;
  supplierName: string;
  defaultAmount?: number | null;
}): Promise<ActionResponse<ExpenseTemplateItem>> {
  try {
    const { tenantId } = await getAuthenticatedTenant();

    if (!data.concept || !data.concept.trim()) {
      return { success: false, error: "El concepto de la plantilla es obligatorio." };
    }

    if (!data.supplierName || !data.supplierName.trim()) {
      return { success: false, error: "El nombre del proveedor es obligatorio." };
    }

    const template = await prisma.recurringExpenseTemplate.create({
      data: {
        organizationId: tenantId,
        buildingId: data.buildingId || null,
        category: data.category,
        concept: data.concept.trim(),
        supplierName: data.supplierName.trim(),
        defaultAmount:
          data.defaultAmount !== undefined && data.defaultAmount !== null && !isNaN(Number(data.defaultAmount))
            ? Number(data.defaultAmount)
            : null,
      },
    });

    revalidatePath("/dashboard/expensas");

    return {
      success: true,
      message: "Plantilla de gasto frecuente guardada con éxito.",
      data: template,
    };
  } catch (error) {
    console.error("Error al crear plantilla de gasto:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al crear plantilla de gasto.",
    };
  }
}

/**
 * Elimina una plantilla de gasto existente.
 */
export async function deleteExpenseTemplate(templateId: string): Promise<ActionResponse> {
  try {
    const { tenantId } = await getAuthenticatedTenant();

    const template = await prisma.recurringExpenseTemplate.findFirst({
      where: {
        id: templateId,
        organizationId: tenantId,
      },
    });

    if (!template) {
      return { success: false, error: "Plantilla no encontrada o no autorizada." };
    }

    await prisma.recurringExpenseTemplate.delete({
      where: { id: templateId },
    });

    revalidatePath("/dashboard/expensas");

    return {
      success: true,
      message: "Plantilla eliminada correctamente.",
    };
  } catch (error) {
    console.error("Error al eliminar plantilla de gasto:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al eliminar la plantilla.",
    };
  }
}

