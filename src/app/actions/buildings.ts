"use server";

import { prisma } from "@/lib/prisma";
import { syncUserWithPrisma } from "@/app/actions/users";
import { revalidatePath } from "next/cache";

export type BuildingFormState = {
    success: boolean;
    message?: string;
    error?: string;
};

export async function createBuilding(
    _previousState: BuildingFormState,
    formData: FormData,
): Promise<BuildingFormState> {
    const name = String(formData.get("name") ?? "").trim();
    const address = String(formData.get("address") ?? "").trim();
    const city = String(formData.get("city") ?? "").trim();

    if (!name || !address) {
        return { success: false, error: "El nombre y la dirección son obligatorios." };
    }

    try {
        const user = await syncUserWithPrisma();
        if (!user) {
            return { success: false, error: "Inicia sesión para agregar un edificio." };
        }

        const newBuilding = await prisma.building.create({
            data: {
                name,
                address,
                city: city || "Santiago del Estero",
                tenantId: user.tenantId,
            },
        });

        revalidatePath("/dashboard/consorcios");
        return { success: true, message: `${newBuilding.name} se agregó correctamente.` };
    } catch (error) {
        console.error("Error al crear edificio:", error);
        return { success: false, error: "Error al guardar el edificio." };
    }
}