import Link from "next/link";

export default function MarketingPage() {
  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 max-w-7xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-muted-bg text-brand border border-border mb-8 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
          Nueva Plataforma SaaS B2B para Consorcios y Alquileres
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight">
          La gestión de consorcios y alquileres, <span className="text-brand">redefinida</span>.
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-muted max-w-2xl mx-auto font-normal">
          Automatizá liquidación de expensas, control de cobros, contratos y reclamos en un solo lugar. Diseñado para administradores profesionales, propietarios e inquilinos.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/sign-up"
            className="w-full sm:w-auto bg-brand hover:bg-brand-hover text-white font-medium px-8 py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg text-base"
          >
            Comenzar Prueba Gratis
          </Link>
          <Link
            href="#modulos"
            className="w-full sm:w-auto bg-muted-bg hover:bg-border text-foreground font-medium px-8 py-3.5 rounded-xl transition-all border border-border text-base"
          >
            Ver Módulos & Demo
          </Link>
        </div>

        {/* Live Dashboard Preview Mockup */}
        <div className="mt-16 relative rounded-2xl border border-border bg-card shadow-2xl overflow-hidden max-w-5xl mx-auto p-4 sm:p-8">
          <div className="rounded-xl border border-border bg-muted-bg/50 p-6 sm:p-10 space-y-6">
            <div className="flex justify-between items-center border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="ml-3 text-xs font-medium text-foreground">Torre Terrazas I - Dashboard</span>
              </div>
              <span className="text-xs font-mono text-muted">panel.spacio.app</span>
            </div>

            {/* Dashboard Sample KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
              <div className="p-4 bg-card rounded-lg border border-border shadow-xs">
                <span className="text-xs text-muted">Recaudación Mensual</span>
                <p className="text-2xl font-bold mt-1 text-brand-accent">$4.850.000</p>
                <span className="text-[10px] text-brand-accent font-medium">+12% vs mes anterior</span>
              </div>

              <div className="p-4 bg-card rounded-lg border border-border shadow-xs">
                <span className="text-xs text-muted">Expensas Cobradas</span>
                <p className="text-2xl font-bold mt-1 text-foreground">94%</p>
                <span className="text-[10px] text-muted font-medium">142 de 151 unidades</span>
              </div>

              <div className="p-4 bg-card rounded-lg border border-border shadow-xs">
                <span className="text-xs text-muted">Contratos por Vencer</span>
                <p className="text-2xl font-bold mt-1 text-amber-500">3</p>
                <span className="text-[10px] text-amber-500 font-medium">Próximos 30 días</span>
              </div>

              <div className="p-4 bg-card rounded-lg border border-border shadow-xs">
                <span className="text-xs text-muted">Tickets de Reclamos</span>
                <p className="text-2xl font-bold mt-1 text-brand">2 activos</p>
                <span className="text-[10px] text-muted font-medium">Tiempo resolución: 4h</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics & Social Proof Bar */}
      <section className="border-y border-border bg-card/50 py-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-3xl font-extrabold text-foreground">+150</p>
            <p className="text-xs text-muted mt-1 uppercase tracking-wide font-semibold">Edificios Conectados</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-brand-accent">99.4%</p>
            <p className="text-xs text-muted mt-1 uppercase tracking-wide font-semibold">Cobranzas a Término</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-brand">$120M+</p>
            <p className="text-xs text-muted mt-1 uppercase tracking-wide font-semibold">Expensas Procesadas/Mes</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-foreground">&lt; 15 min</p>
            <p className="text-xs text-muted mt-1 uppercase tracking-wide font-semibold">Liquidación de Mes Completo</p>
          </div>
        </div>
      </section>

      {/* Section #modulos (Features Grid) */}
      <section id="modulos" className="max-w-7xl mx-auto px-6 scroll-mt-20">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-block px-3 py-1 rounded-md bg-brand/10 text-brand text-xs font-semibold">
            Módulos Operativos
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Todo lo que tu administración necesita</h2>
          <p className="text-muted max-w-2xl mx-auto text-sm sm:text-base">
            Eliminá planillas manuales y centralizá el flujo operativo, administrativo y financiero de tus consorcios.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 bg-card rounded-2xl border border-border hover:border-brand/50 transition-all shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold text-xl mb-6">
              📊
            </div>
            <h3 className="text-xl font-bold mb-2">Liquidación de Expensas</h3>
            <p className="text-sm text-muted leading-relaxed">
              Prorrateo automático por coeficientes, imputación ágil de gastos ordinarios y extraordinarios, emisión masiva de comprobantes en PDF y conciliación bancaria.
            </p>
          </div>

          <div className="p-8 bg-card rounded-2xl border border-border hover:border-brand/50 transition-all shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold text-xl mb-6">
              🔑
            </div>
            <h3 className="text-xl font-bold mb-2">Gestión de Alquileres</h3>
            <p className="text-sm text-muted leading-relaxed">
              Seguimiento integral de contratos, actualización automática por índice de inflación (ICL / IPC), rendición mensual para propietarios y control de garantías.
            </p>
          </div>

          <div className="p-8 bg-card rounded-2xl border border-border hover:border-brand/50 transition-all shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold text-xl mb-6">
              📱
            </div>
            <h3 className="text-xl font-bold mb-2">Portal para Vecinos</h3>
            <p className="text-sm text-muted leading-relaxed">
              Autogestión 24/7 para inquilinos y propietarios: descarga de liquidaciones, reporte de reclamos en tiempo real con fotos y reserva online de SUM o amenities.
            </p>
          </div>
        </div>
      </section>

      {/* Section #consorcios */}
      <section id="consorcios" className="max-w-7xl mx-auto px-6 scroll-mt-20">
        <div className="rounded-3xl bg-card border border-border p-8 md:p-14 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-block px-3 py-1 rounded-md bg-brand/10 text-brand text-xs font-semibold">
                Gestión de Consorcios
              </div>
              <h2 className="text-3xl font-bold tracking-tight">
                Control total de edificios, unidades y fondos de reserva
              </h2>
              <p className="text-muted text-sm sm:text-base leading-relaxed">
                Estructurá cada consorcio con sus unidades funcionales y complementarias. Registrá propietarios, inquilinos autorizados y mantené la contabilidad del edificio transparente.
              </p>
              <ul className="space-y-3 text-sm text-muted">
                <li className="flex items-center gap-3">
                  <span className="text-brand-accent font-bold">✓</span>
                  Historial de expensas y cuentas corrientes individualizadas.
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-brand-accent font-bold">✓</span>
                  Gestión de fondos de reserva y presupuestos operativos anuales.
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-brand-accent font-bold">✓</span>
                  Libro de actas digital y comunicados masivos por correo o WhatsApp.
                </li>
              </ul>
            </div>

            <div className="bg-muted-bg/50 rounded-2xl p-6 border border-border space-y-4">
              <div className="flex justify-between items-center text-sm font-semibold pb-3 border-b border-border">
                <span>Edificios Activos</span>
                <span className="text-brand text-xs">Ver todos en Dashboard →</span>
              </div>
              <div className="p-4 bg-card rounded-xl border border-border flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-sm">Torre Terrazas I</h4>
                  <p className="text-xs text-muted">Libertad 1250, Santiago del Estero</p>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 font-medium px-2.5 py-1 rounded-md">
                  32 Unidades
                </span>
              </div>
              <div className="p-4 bg-card rounded-xl border border-border flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-sm">Edificio Belgrano Plaza</h4>
                  <p className="text-xs text-muted">Belgrano Sur 430, Santiago del Estero</p>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 font-medium px-2.5 py-1 rounded-md">
                  24 Unidades
                </span>
              </div>
              <div className="p-4 bg-card rounded-xl border border-border flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-sm">Complejo Altos del Parque</h4>
                  <p className="text-xs text-muted">Av. Costanera 880, Santiago del Estero</p>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 font-medium px-2.5 py-1 rounded-md">
                  48 Unidades
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section #alquileres */}
      <section id="alquileres" className="max-w-7xl mx-auto px-6 scroll-mt-20">
        <div className="rounded-3xl bg-muted-bg/40 border border-border p-8 md:p-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <div className="inline-block px-3 py-1 rounded-md bg-brand/10 text-brand text-xs font-semibold">
                Contratos y Cobranzas
              </div>
              <h2 className="text-3xl font-bold tracking-tight">
                Administración de Alquileres simple y automatizada
              </h2>
              <p className="text-muted text-sm sm:text-base leading-relaxed">
                Olvidate de calcular manualmente índices de actualización. Spacio ajusta automáticamente los cánones locativos según las pautas del contrato e indexación oficial.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className="p-4 bg-card rounded-xl border border-border">
                  <h4 className="font-semibold text-sm mb-1">Indexación Automática</h4>
                  <p className="text-xs text-muted">Cálculo al instante con ICL, IPC o porcentaje pactado.</p>
                </div>
                <div className="p-4 bg-card rounded-xl border border-border">
                  <h4 className="font-semibold text-sm mb-1">Rendición Propietarios</h4>
                  <p className="text-xs text-muted">Liquidación neta con honorarios y retenciones detalladas.</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-card rounded-2xl border border-border shadow-sm space-y-4">
              <h4 className="font-bold text-sm text-foreground">Estado de Contratos Demo</h4>
              <div className="space-y-3">
                <div className="p-3 bg-muted-bg/50 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-foreground">Depto 4B - Inquilino: M. López</p>
                    <p className="text-muted">Canon: $320.000 / mes (Ajuste ICL cuatrimestral)</p>
                  </div>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Al día</span>
                </div>
                <div className="p-3 bg-muted-bg/50 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-foreground">Depto 7A - Inquilino: C. Gómez</p>
                    <p className="text-muted">Canon: $410.000 / mes (Vence en 25 días)</p>
                  </div>
                  <span className="text-amber-500 font-semibold">Por Vencer</span>
                </div>
                <div className="p-3 bg-muted-bg/50 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-foreground">Local Comercial 1 - Inquilino: R. Pérez</p>
                    <p className="text-muted">Canon: $650.000 / mes (Ajuste IPC semestral)</p>
                  </div>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Al día</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-5xl mx-auto px-6 text-center">
        <div className="p-10 md:p-14 bg-brand rounded-3xl text-white shadow-xl space-y-6">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Empezá a transformar la gestión de tus consorcios hoy
          </h2>
          <p className="text-blue-100 max-w-xl mx-auto text-sm md:text-base">
            Probá Spacio gratis durante 14 días con tus primeros edificios. Sin tarjeta de crédito requerida y con migración asistida.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2">
            <Link
              href="/sign-up"
              className="w-full sm:w-auto bg-white text-brand hover:bg-blue-50 font-semibold px-8 py-3.5 rounded-xl transition-all shadow-md text-base"
            >
              Registrar Administración Gratis
            </Link>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto bg-brand-hover hover:bg-blue-800 text-white font-medium px-8 py-3.5 rounded-xl transition-all border border-blue-400 text-base"
            >
              Explorar Panel Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}