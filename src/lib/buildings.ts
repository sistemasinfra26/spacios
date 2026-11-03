import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function getBuildings() {
    const { userId } = await auth();

    if (!userId) {
        return { success: false, error: "Inicia sesión para ver tus edificios.", data: [] };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { tenantId: true },
        });

        if (!user) {
            return { success: true, data: [] };
        }

        const buildings = await prisma.building.findMany({
            where: { tenantId: user.tenantId },
            include: { units: true },
            orderBy: { createdAt: "desc" },
        });

        return { success: true, data: buildings };
    } catch (error) {
        console.error("Error al obtener edificios:", error);
        return { success: false, error: "No se pudieron cargar los edificios.", data: [] };
    }
}