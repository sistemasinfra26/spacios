import Link from "next/link";

export function Sidebar() {
  return (
    <aside className="w-64 bg-card border-r border-border min-h-screen flex flex-col justify-between p-4 sticky top-0 h-screen shrink-0 z-30">
      <div className="space-y-6">
        {/* Brand / Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 font-bold text-xl px-2 py-1">
          <span className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-white text-base shadow-xs">
            S
          </span>
          <span className="tracking-tight">
            Spacio<span className="text-brand">.</span>
          </span>
        </Link>

        {/* Navigation */}
        <nav className="space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-muted-bg transition-colors text-foreground"
          >
            <span className="text-base">📊</span>
            <span>Resumen Global</span>
          </Link>

          <Link
            href="/dashboard/consorcios"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-foreground hover:bg-muted-bg transition-colors"
          >
            <span className="text-base">🏢</span>
            <span>Consorcios</span>
          </Link>

          <Link
            href="/dashboard/alquileres"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-foreground hover:bg-muted-bg transition-colors"
          >
            <span className="text-base">🔑</span>
            <span>Alquileres</span>
          </Link>

          <Link
            href="/dashboard/expensas"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-foreground hover:bg-muted-bg transition-colors"
          >
            <span className="text-base">💵</span>
            <span>Liquidación Expensas</span>
          </Link>

          <Link
            href="/dashboard/reclamos"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-foreground hover:bg-muted-bg transition-colors"
          >
            <span className="text-base">🛠️</span>
            <span>Reclamos & SUM</span>
          </Link>
        </nav>
      </div>

      {/* User / Administration Footer */}
      <div className="border-t border-border pt-4 px-2 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand/10 text-brand font-bold flex items-center justify-center text-xs">
            AT
          </div>
          <div className="text-xs min-w-0">
            <p className="font-semibold text-foreground truncate">Administración Terrazas</p>
            <p className="text-muted truncate">admin@terrazas.com</p>
          </div>
        </div>

        <Link
          href="/"
          className="block text-center text-xs text-muted hover:text-foreground py-1 transition-colors"
        >
          ← Volver al sitio público
        </Link>
      </div>
    </aside>
  );
}