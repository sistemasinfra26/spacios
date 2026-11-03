import Link from "next/link";

export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            {/* Header / Navbar */}
            <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="font-bold text-xl flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-lg bg-brand text-white flex items-center justify-center font-extrabold text-base shadow-sm">
                            S
                        </span>
                        <span className="tracking-tight">
                            Spacio<span className="text-brand">.</span>
                        </span>
                    </Link>

                    {/* Nav links */}
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted">
                        <Link
                            href="#modulos"
                            className="hover:text-foreground transition-colors"
                        >
                            Módulos
                        </Link>
                        <Link
                            href="#consorcios"
                            className="hover:text-foreground transition-colors"
                        >
                            Consorcios
                        </Link>
                        <Link
                            href="#alquileres"
                            className="hover:text-foreground transition-colors"
                        >
                            Alquileres
                        </Link>
                    </nav>

                    {/* Action buttons */}
                    <div className="flex items-center gap-3">
                        <Link
                            href="/sign-in"
                            className="text-sm font-medium px-4 py-2 rounded-lg text-muted hover:text-foreground hover:bg-muted-bg transition-colors"
                        >
                            Iniciar Sesión
                        </Link>
                        <Link
                            href="/sign-up"
                            className="text-sm font-medium bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-lg shadow-sm transition-all"
                        >
                            Registrar Administración
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1">{children}</main>

            {/* Footer */}
            <footer className="border-t border-border bg-card py-12">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="space-y-3 md:col-span-1">
                        <Link href="/" className="font-bold text-lg flex items-center gap-2">
                            <span className="w-7 h-7 rounded-md bg-brand text-white flex items-center justify-center font-bold text-sm">
                                S
                            </span>
                            <span>Spacio.</span>
                        </Link>
                        <p className="text-xs text-muted leading-relaxed">
                            Plataforma SaaS B2B integral para la gestión ágil de consorcios, liquidación de expensas y administración de contratos de alquiler.
                        </p>
                    </div>

                    <div className="space-y-2 text-xs">
                        <h4 className="font-semibold text-foreground text-sm mb-3">Plataforma</h4>
                        <ul className="space-y-2 text-muted">
                            <li>
                                <Link href="#modulos" className="hover:text-brand transition-colors">
                                    Módulos Operativos
                                </Link>
                            </li>
                            <li>
                                <Link href="#consorcios" className="hover:text-brand transition-colors">
                                    Gestión de Consorcios
                                </Link>
                            </li>
                            <li>
                                <Link href="#alquileres" className="hover:text-brand transition-colors">
                                    Administración de Alquileres
                                </Link>
                            </li>
                            <li>
                                <Link href="/dashboard" className="hover:text-brand transition-colors">
                                    Acceso al Dashboard
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div className="space-y-2 text-xs">
                        <h4 className="font-semibold text-foreground text-sm mb-3">Accesos</h4>
                        <ul className="space-y-2 text-muted">
                            <li>
                                <Link href="/sign-in" className="hover:text-brand transition-colors">
                                    Iniciar Sesión
                                </Link>
                            </li>
                            <li>
                                <Link href="/sign-up" className="hover:text-brand transition-colors">
                                    Registrar Administración
                                </Link>
                            </li>
                            <li>
                                <span className="text-muted/70">Soporte y Mesa de Ayuda</span>
                            </li>
                        </ul>
                    </div>

                    <div className="space-y-2 text-xs text-muted">
                        <h4 className="font-semibold text-foreground text-sm mb-3">Seguridad y Confianza</h4>
                        <p className="leading-relaxed">
                            Diseñado con arquitectura multi-tenant y cifrado de datos de extremo a extremo para garantizar la privacidad de tus consorcios.
                        </p>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6 mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between text-xs text-muted gap-4">
                    <p>© 2026 Spacio SaaS. Todos los derechos reservados.</p>
                    <div className="flex gap-6">
                        <span>Términos del Servicio</span>
                        <span>Política de Privacidad</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}