import { Sidebar } from "@/app/components/dashboard/Sidebar";
import { UserButton } from "@clerk/nextjs";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-background text-foreground">
            {/* Sidebar lateral fija */}
            <Sidebar />

            {/* Área principal del dashboard con encabezado */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Encabezado Superior */}
                <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm px-8 flex items-center justify-between sticky top-0 z-20">
                    <div className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-brand-accent animate-pulse" />
                        <div className="text-sm">
                            <span className="text-muted font-normal">Consorcio Activo: </span>
                            <span className="font-bold text-foreground">Administración</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="hidden sm:inline-block text-xs text-muted">
                            Período: Octubre 2026
                        </span>
                        <button className="text-xs bg-brand hover:bg-brand-hover text-white font-semibold px-4 py-2 rounded-lg transition-colors shadow-xs cursor-pointer">
                            + Nuevo Gasto / Expensa
                        </button>

                        {/* Perfil del usuario y botón de cierre de sesión */}
                        <UserButton />
                    </div>
                </header>

                {/* Contenido principal de la subruta */}
                <main className="p-8 flex-1 overflow-y-auto">{children}</main>
            </div>
        </div>
    );
}