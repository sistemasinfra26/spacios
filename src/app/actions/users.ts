"use server";

import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * Sincroniza el usuario autenticado en Clerk con la tabla `users` de Prisma.
 * Si el usuario es nuevo, crea un `Tenant` inicial para su administración.
 */
export async function syncUserWithPrisma() {
    const clerkUser = await currentUser();

    if (!clerkUser) return null;

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) return null;

    // 1. Verificar si el usuario ya existe por ID o Email
    let dbUser = await prisma.user.findUnique({
        where: { id: clerkUser.id },
    });

    if (!dbUser) {
        // 2. Si no existe, creamos primero un Tenant para esta administración
        const tenant = await prisma.tenant.create({
            data: {
                name: `Administración ${clerkUser.firstName || "Nueva"}`,
                email: email,
            },
        });

        // 3. Crear el User vinculado al Tenant con rol TENANT_ADMIN
        dbUser = await prisma.user.create({
            data: {
                id: clerkUser.id, // Directamente el ID de Clerk
                tenantId: tenant.id,
                email: email,
                firstName: clerkUser.firstName || "Sin Nombre",
                lastName: clerkUser.lastName || "",
                phone: clerkUser.phoneNumbers[0]?.phoneNumber || null,
                role: Role.TENANT_ADMIN,
            },
        });
    }

    return dbUser;
}

/**
 * Crea un nuevo usuario/empleado dentro de un consorcio (Tenant) existente.
 */
export async function createEmployee(formData: FormData) {
    const email = formData.get("email") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const phone = formData.get("phone") as string;
    const tenantId = formData.get("tenantId") as string;
    const roleInput = formData.get("role") as string;

    if (!email || !firstName || !tenantId) {
        return { success: false, error: "Email, Nombre y Tenant son obligatorios." };
    }

    try {
        const role = (roleInput as Role) || Role.PROPERTY_MANAGER;

        const newEmployee = await prisma.user.create({
            data: {
                id: `pending_${Date.now()}`, // Se actualizará cuando el empleado haga primer login vía Clerk
                tenantId,
                email,
                firstName,
                lastName: lastName || "",
                phone: phone || null,
                role,
            },
        });

        revalidatePath("/dashboard/empleados");
        return { success: true, data: newEmployee };
    } catch (error) {
        console.error("Error al crear empleado:", error);
        return { success: false, error: "No se pudo registrar el usuario." };
    }
}